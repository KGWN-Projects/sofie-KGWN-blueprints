import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// Simple XML parser to extract and understand the NRCS message structure
function parseXml(xmlString: string): Record<string, any> {
	const result: Record<string, any> = {}

	// Extract roCreate block
	const roCreateMatch = xmlString.match(/<roCreate>([\s\S]*?)<\/roCreate>/)?.[1]
	if (!roCreateMatch) {
		throw new Error('No roCreate block found in XML')
	}

	// Extract roID
	const roIDMatch = roCreateMatch.match(/<roID>(.*?)<\/roID>/)
	result.roID = roIDMatch?.[1]

	// Extract roSlug
	const roSlugMatch = roCreateMatch.match(/<roSlug>(.*?)<\/roSlug>/)
	result.roSlug = roSlugMatch?.[1]

	// Extract roEdStart
	const roEdStartMatch = roCreateMatch.match(/<roEdStart>(.*?)<\/roEdStart>/)
	result.roEdStart = roEdStartMatch?.[1]

	// Extract roEdDur
	const roEdDurMatch = roCreateMatch.match(/<roEdDur>(.*?)<\/roEdDur>/)
	result.roEdDur = roEdDurMatch?.[1]

	// Extract all stories
	const storyMatches = roCreateMatch.matchAll(/<story>([\s\S]*?)<\/story>/g)
	result.stories = []

	for (const storyMatch of storyMatches) {
		const storyContent = storyMatch[1]
		const story: Record<string, any> = {}

		const storyIDMatch = storyContent.match(/<storyID>(.*?)<\/storyID>/)
		story.storyID = storyIDMatch?.[1]

		const storySlugMatch = storyContent.match(/<storySlug>(.*?)<\/storySlug>/)
		story.storySlug = storySlugMatch?.[1]

		const storyNumMatch = storyContent.match(/<storyNum>(.*?)<\/storyNum>/)
		story.storyNum = storyNumMatch?.[1]

		result.stories.push(story)
	}

	return result
}

describe('NRCS rundown parsing', () => {
	it('should parse the sofieRundown.txt XML structure', () => {
		// Read the sofieRundown.txt file
		const rundownPath = path.join(__dirname, '../../../../sofieRundown.txt')
		const fileContent = fs.readFileSync(rundownPath, 'utf-8')

		// Extract JSON from the log message
		const jsonMatch = fileContent.match(/\{"source":"incoming"[\s\S]*?\}(?=\n|$)/)
		expect(jsonMatch).toBeDefined()

		if (!jsonMatch) throw new Error('No JSON found in sofieRundown.txt')

		const logMessage = JSON.parse(jsonMatch[0])
		const rawMessage = logMessage.rawMessage

		// Parse XML
		const parsed = parseXml(rawMessage)

		console.log('\n=== RUNDOWN STRUCTURE ===')
		console.log(`Rundown ID: ${parsed.roID}`)
		console.log(`Rundown Slug: ${parsed.roSlug}`)
		console.log(`Start Time: ${parsed.roEdStart}`)
		console.log(`Duration: ${parsed.roEdDur}`)
		console.log(`Total Stories: ${parsed.stories.length}`)

		console.log('\n=== STORY STRUCTURE (first 5) ===')
		parsed.stories?.slice(0, 5).forEach((story: any, idx: number) => {
			console.log(`\nStory ${idx + 1}:`)
			console.log(`  ID: ${story.storyID}`)
			console.log(`  Slug: ${story.storySlug}`)
			console.log(`  Number: ${story.storyNum}`)
		})

		// Assertions to validate structure
		expect(parsed.roID).toBeTruthy()
		expect(parsed.roSlug).toBe('THU 630 AM')
		expect(parsed.stories.length).toBeGreaterThan(30) // We have 37+ stories in the rundown
		expect(parsed.stories[0].storySlug).toBe('SHOW OPEN-SOT OPEN')
	})

	it('should show how stories map to Sofie segments', () => {
		const rundownPath = path.join(__dirname, '../../../../sofieRundown.txt')
		const fileContent = fs.readFileSync(rundownPath, 'utf-8')
		const jsonMatch = fileContent.match(/\{"source":"incoming"[\s\S]*?\}(?=\n|$)/)

		if (!jsonMatch) throw new Error('No JSON found in sofieRundown.txt')

		const logMessage = JSON.parse(jsonMatch[0])
		const parsed = parseXml(logMessage.rawMessage)

		console.log('\n=== MAPPING: NRCS Story → Sofie Segment ===')
		console.log(`Each <story> in roCreate becomes one ingestSegment`)
		console.log(`Each ingestSegment is passed to getSegment() which creates a BlueprintResultSegment`)

		const mappingExample = parsed.stories[0]
		console.log(`\nExample mapping:`)
		console.log(`  Story.storyID → ingestSegment.externalId (segment ID)`)
		console.log(`  Story.storySlug → ingestSegment.name (segment title)`)
		console.log(`  Story.storyNum → ingestSegment.rank (segment order)`)

		expect(mappingExample.storyID).toBeTruthy()
		expect(mappingExample.storySlug).toBeTruthy()
		expect(mappingExample.storyNum).toBeTruthy()
	})

	it('should identify missing data and outline next steps', () => {
		const rundownPath = path.join(__dirname, '../../../../sofieRundown.txt')
		const fileContent = fs.readFileSync(rundownPath, 'utf-8')
		const jsonMatch = fileContent.match(/\{"source":"incoming"[\s\S]*?\}(?=\n|$)/)

		if (!jsonMatch) throw new Error('No JSON found in sofieRundown.txt')

		const logMessage = JSON.parse(jsonMatch[0])
		const parsed = parseXml(logMessage.rawMessage)

		console.log('\n=== WHAT WE HAVE vs WHAT WE NEED ===')
		console.log('\nFrom roCreate (Rundown structure):')
		console.log('  ✓ storyID, storySlug, storyNum')
		console.log('  ~ roID (identifies which rundown)')
		console.log('  ~ roSlug, roEdStart, roEdDur (rundown metadata)')

		console.log('\nMISSING from roCreate:')
		console.log('  ✗ Story items/clips (need roStorySend messages)')
		console.log('  ✗ In/out times, durations per item')
		console.log('  ✗ Script, camera info, etc.')

		console.log('\nNEXT STEPS:')
		console.log('  1. Create NRCS parser that handles roCreate → creates basic segments')
		console.log('  2. Add roStorySend handler to populate items within each segment')
		console.log('  3. Parse story items to determine part types (camera, VT, graphics, etc.)')

		expect(parsed.stories.length).toBeGreaterThan(0)
	})
})
