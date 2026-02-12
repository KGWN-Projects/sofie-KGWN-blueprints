import { IRundownUserContext, SofieIngestSegment } from '@sofie-automation/blueprints-integration'
import {
	AllProps,
	PartInfo,
	PartProps,
	PartType,
	SegmentProps,
	SegmentType,
	CameraProps,
} from '../definitions/index.js'
import { RawSourceInfo } from '../helpers/sources.js'
import { SourceType } from '../../studio/helpers/config.js'
import { parseNrcsItem, NrcsStoryItem } from './items.js'

/**
 * Parse NRCS/MOS ingest data (from ENPS newsroom systems).
 * Each ingestSegment represents one story from the rundown.
 *
 * For the initial roCreate message, we get story metadata but not item details.
 * Item details arrive later via roStorySend messages.
 *
 * This parser creates placeholder camera parts immediately so stories display
 * in the UI. Once roStorySend arrives with item details, parts will be updated.
 *
 * @param context
 * @param ingestSegment The story from NRCS (roCreate or updated via roStorySend)
 * @returns Intermediate data type used to generate parts
 */
export function convertIngestData(_context: IRundownUserContext, ingestSegment: SofieIngestSegment): SegmentProps {
	const parts: PartProps<AllProps>[] = []
	let type = SegmentType.NORMAL

	// Check if this is an opening/show open based on story name
	if (ingestSegment.name?.match(/open|intro|title/i)) {
		type = SegmentType.OPENING
	}

	// If there are parts in the ingestSegment (from roStorySend), parse them
	if (ingestSegment.parts && ingestSegment.parts.length > 0) {
		_context.logInfo(`📦 Story Update Received: "${ingestSegment.name}" (${ingestSegment.parts.length} parts)`)

		// Parse each part to extract storyItems
		ingestSegment.parts.forEach((part, idx) => {
			_context.logDebug(`  Part ${idx + 1}: ${part.name || 'Untitled'}`)

			// Extract storyItems from the Body array
			const payload = part.payload as any
			if (payload?.Body && Array.isArray(payload.Body)) {
				// Filter for actual media items (storyItems) vs script text
				const storyItems = payload.Body.filter((item: any) => {
					// StoryItems have mosID and itemSlug
					return item.mosID || item.itemSlug || item.objID
				})

				if (storyItems.length > 0) {
					_context.logInfo(`  📹 Found ${storyItems.length} media items in "${part.name}"`)

					// Parse each storyItem
					storyItems.forEach((item: any) => {
						_context.logInfo(`    - ${item.itemSlug || item.objSlug} (${item.mosID})`)
						if (item.objDur) {
							_context.logInfo(`      Duration: ${item.objDur}ms`)
						}
						if (item.objPaths?.objPath) {
							_context.logInfo(`      Path: ${item.objPaths.objPath}`)
						}

						// Convert to NrcsStoryItem format and parse
						const nrcsItem: NrcsStoryItem = {
							mosID: item.mosID || '',
							itemSlug: item.itemSlug || item.objSlug || 'Untitled',
							objID: item.objID,
							objDur: item.objDur,
							objSlug: item.objSlug,
							objPaths: item.objPaths,
							mosAbstract: item.mosAbstract,
						}

						const parsedPart = parseNrcsItem(_context, nrcsItem, part.name || '')
						parts.push(parsedPart)
					})
				} else {
					_context.logDebug(`    No media items found, only script text`)
					// Create placeholder camera part for script-only stories
					parts.push(createPlaceholderCameraPart(part))
				}
			} else {
				_context.logDebug(`    No Body array found`)
				parts.push(createPlaceholderCameraPart(part))
			}
		})
	} else {
		// roCreate message: no items yet, create a single placeholder part so segment displays
		_context.logDebug(`📋 Initial Story (no items yet): "${ingestSegment.name}"`)
		parts.push(createPlaceholderCameraPart(ingestSegment))
	}

	return {
		parts,
		type,
		payload: {
			name: ingestSegment.name,
			externalId: ingestSegment.externalId,
		},
	}
}

/**
 * Create a placeholder camera part for an NRCS segment/story.
 * This allows segments to display immediately in the UI even before detailed
 * roStorySend messages arrive with actual clip/item information.
 */
function createPlaceholderCameraPart(
	ingestData: SofieIngestSegment | { externalId?: string; name?: string }
): PartProps<CameraProps> {
	// Default source: Camera 1 (will be refined once actual story data arrives)
	const defaultSource: RawSourceInfo = {
		type: SourceType.Camera,
		id: 1, // 1-based, so this is Camera 1
	}

	const cameraProps: CameraProps = {
		externalId: ingestData.externalId || 'unknown',
		duration: 0, // Will be updated when roStorySend arrives
		name: ingestData.name || 'Untitled',
		input: defaultSource,
	}

	return {
		type: PartType.Camera,
		rawType: 'camera',
		rawTitle: ingestData.name || 'Untitled',
		info: PartInfo.NORMAL,
		objects: [],
		payload: cameraProps,
	}
}
