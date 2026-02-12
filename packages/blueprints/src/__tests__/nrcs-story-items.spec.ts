import { describe, it, expect } from 'vitest'

/**
 * Parse a roStorySend message to understand story items structure
 */
function parseStorySendJson(jsonString: string): Record<string, any> {
	const data = JSON.parse(jsonString)
	const result: Record<string, any> = {
		storyID: data.storyID,
		storySlug: data.storySlug,
		storyNum: data.storyNum,
		items: [],
		metadata: data.mosExternalMetadata?.mosPayload || {},
	}

	// Extract story items
	if (data.storyBody?.storyItem && Array.isArray(data.storyBody.storyItem)) {
		result.items = data.storyBody.storyItem.map((item: any) => ({
			mosID: item.mosID,
			mosAbstract: item.mosAbstract,
			itemSlug: item.itemSlug,
			objID: item.objID,
			objDur: item.objDur, // milliseconds
			objSlug: item.objSlug,
			objPaths: item.objPaths,
		}))
	} else if (data.storyBody?.storyItem && !Array.isArray(data.storyBody.storyItem)) {
		// Single item
		const item = data.storyBody.storyItem
		result.items.push({
			mosID: item.mosID,
			mosAbstract: item.mosAbstract,
			itemSlug: item.itemSlug,
			objID: item.objID,
			objDur: item.objDur,
			objSlug: item.objSlug,
			objPaths: item.objPaths,
		})
	}

	return result
}

describe('NRCS Story Items (roStorySend) parsing', () => {
	it('should parse a roStorySend JSON message', () => {
		// Use the test data from sofieJsonMessage.txt
		const testJson = {
			type: 'roStorySend',
			roID: 'KGWN-ENPS01;P_KGWNNEWS\\W;59EAC70E-60E9-46DA-987D-B48990D74EA1',
			storyID: '...',
			storySlug: 'SHOW OPEN-SOT OPEN',
			storyNum: 'A1',
			storyBody: {
				storyItem: [
					{
						mosID: 'imagine.nexio.kgwn.mos',
						mosAbstract: 'WY_Newsnow_Open 0:16',
						itemSlug: 'WY_Newsnow_Open',
						objID: 'WY_Newsnow_Open',
						objDur: 16000, // 16 seconds in milliseconds
						objTB: 60,
						objSlug: 'WY_Newsnow_Open',
						objPaths: {
							objPath: 'ftp://10.48.96.139/MXF/WY_Newsnow_Open.mxf',
						},
					},
				],
			},
			mosExternalMetadata: {
				mosPayload: {
					MOSItemDurations: '16',
					ENPSItemType: '3',
				},
			},
		}

		const parsed = parseStorySendJson(JSON.stringify(testJson))

		console.log('\n=== STORY SEND STRUCTURE ===')
		console.log(`Story ID: ${parsed.storyID}`)
		console.log(`Story Slug: ${parsed.storySlug}`)
		console.log(`Items: ${parsed.items.length}`)

		console.log('\n=== ITEM DETAILS ===')
		parsed.items.forEach((item: any, idx: number) => {
			console.log(`\nItem ${idx + 1}:`)
			console.log(`  mosID: ${item.mosID}`)
			console.log(`  mosAbstract: ${item.mosAbstract}`)
			console.log(`  itemSlug: ${item.itemSlug}`)
			console.log(`  objDur: ${item.objDur}ms`)
			console.log(`  objSlug: ${item.objSlug}`)
			console.log(`  objPath: ${item.objPaths?.objPath}`)
		})

		expect(parsed.storySlug).toBe('SHOW OPEN-SOT OPEN')
		expect(parsed.items).toHaveLength(1)
		expect(parsed.items[0].objDur).toBe(16000)
	})

	it('should detect item types from mosID and properties', () => {
		// Map mosID patterns to part type
		const itemTypePatterns = {
			camera: {
				mosID: /^cueit\.cuescript|^sofie\.mos/i,
				indicators: ['2shot', 'mcu', 'studio', 'anchor', 'presenter'],
			},
			vt: {
				mosID: /imagine\.nexio/i,
				indicators: ['open', 'bump', 'stinger', 'graphic', 'animation'],
			},
			remote: {
				mosID: /kgwn\.NVerzion/i,
				indicators: ['sot', 'remote', 'interview'],
			},
		}

		// Test examples from sofieRundown.txt
		const testStories = [
			{ storySlug: 'SHOW OPEN-SOT OPEN', mosID: 'imagine.nexio.kgwn.mos' }, // VT
			{ storySlug: 'WELCOME-2 SHOT', mosID: 'cueit.cuescript.kgwn.mos' }, // Camera
			{ storySlug: 'FULL WEATHER-WX WALL', mosID: 'cueit.cuescript.kgwn.mos' }, // Camera + graphics
			{ storySlug: 'FIRST WEATHER-STNGR GFX', mosID: 'imagine.nexio.kgwn.mos' }, // Stinger/graphic
		]

		console.log('\n=== STORY TYPE DETECTION ===')
		testStories.forEach((story) => {
			let detectedType = 'unknown'

			if (itemTypePatterns.vt.mosID.test(story.mosID)) {
				detectedType = story.storySlug.match(/stinger|graphic|bump|animation|open/i) ? 'VT/Graphic' : 'VT'
			} else if (itemTypePatterns.camera.mosID.test(story.mosID)) {
				detectedType = story.storySlug.match(/2shot|mcu|shot/i) ? 'Camera + Setup' : 'Camera'
			} else if (itemTypePatterns.remote.mosID.test(story.mosID)) {
				detectedType = 'Remote/SOT'
			}

			console.log(`${story.storySlug}: ${detectedType} (from ${story.mosID})`)
			expect(detectedType).not.toBe('unknown')
		})
	})

	it('should map VT items to VTProps', () => {
		const item = {
			mosID: 'imagine.nexio.kgwn.mos',
			mosAbstract: 'WY_Newsnow_Open 0:16',
			itemSlug: 'WY_Newsnow_Open',
			objID: 'WY_Newsnow_Open',
			objDur: 16000, // milliseconds
			objSlug: 'WY_Newsnow_Open',
			objPaths: {
				objPath: 'ftp://10.48.96.139/MXF/WY_Newsnow_Open.mxf',
			},
		}

		console.log('\n=== VT ITEM MAPPING ===')
		console.log(`itemSlug (→ partName): ${item.itemSlug}`)
		console.log(`objDur (→ duration): ${item.objDur}ms`)
		console.log(`objPaths.objPath (→ mediaPath): ${item.objPaths.objPath}`)

		// Extract filename from path
		const fileName = item.objPaths.objPath.split('/').pop() || item.itemSlug
		console.log(`Extracted fileName: ${fileName}`)

		expect(fileName).toBe('WY_Newsnow_Open.mxf')
		expect(item.objDur).toBe(16000)
	})

	it('should outline structure for updating NRCS parser', () => {
		console.log('\n=== NEXT STEPS FOR NRCS PARSER ===')
		console.log(
			`
1. Enhance roStorySend Handling:
   - When ingestSegment.parts arrive (from roStorySend)
   - Extract storyBody.storyItem array
   - For each item, determine part type from:
     * mosID pattern (imagine.nexio → VT, cueit.cuescript → Camera, etc.)
     * itemSlug/storySlug content (keywords: 2shot, open, stinger, etc.)
     * ENPSItemType from metadata

2. Create Item Parsers (parallel to spreadsheet parsers):
   - parseNrcsVT() - video/graphic clips
   - parseNrcsCamera() - studio camera modes
   - parseNrcsRemote() - remote/SOT feeds
   - detectPartType() - classify items by mosID and slug

3. Update convertIngestData():
   - When ingestSegment.parts exist:
     * Extract storyBody from part.payload
     * Route to appropriate parser based on detected type
     * Return PartProps with actual timing and sources

4. Map to Existing PartTypes:
   - VT → PartType.VT (CasparCG playlist)
   - Graphics → PartType.GFX (graphics layer)
   - Camera + setup → PartType.Camera
   - Remote/SOT → PartType.Remote
`
		)

		expect(true).toBe(true)
	})
})
