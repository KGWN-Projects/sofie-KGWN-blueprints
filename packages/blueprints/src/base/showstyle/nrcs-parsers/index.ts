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
 * This version only generates Parts for VIDEO items (VT/GFX/etc derived from MOS storyItems),
 * and does not create placeholder Camera parts.
 */
export function convertIngestData(_context: IRundownUserContext, ingestSegment: SofieIngestSegment): SegmentProps {
	const parts: PartProps<AllProps>[] = []
	let type = SegmentType.NORMAL

	if (ingestSegment.name?.match(/open|intro|title/i)) {
		type = SegmentType.OPENING
	}

	// If there are parts in the ingestSegment (from roStorySend), parse them:
	if (ingestSegment.parts && ingestSegment.parts.length > 0) {
		_context.logInfo(`📦 Story Update Received: "${ingestSegment.name}" (${ingestSegment.parts.length} parts)`)

		for (const [idx, part] of ingestSegment.parts.entries()) {
			_context.logDebug(`  Part ${idx + 1}: ${part.name || 'Untitled'}`)

			const payload = part.payload as any

			// Support multiple known payload shapes
			const body: any[] | undefined =
				(Array.isArray(payload?.Body) && payload.Body) ||
				(Array.isArray(payload?.story?.Body) && payload.story.Body) ||
				(Array.isArray(payload?.Story?.Body) && payload.Story.Body)

			if (!body) {
				_context.logDebug(`    No Body array found (checked payload.Body, payload.story.Body, payload.Story.Body)`)
				continue
			}

			// Only take media items ("storyItem"), ignore script/other entries
			const storyItems = body.filter((item: any) => {
				if (!item) return false

				// mosFullStory-like
				if (item.itemType === 'storyItem' || item.Type === 'storyItem') return true

				// older/flat shape (assume it's a media item if it has mosID/itemSlug/objID)
				return !!(item.mosID || item.itemSlug || item.objID)
			})

			if (storyItems.length === 0) {
				_context.logDebug(`    No media items found`)
				continue
			}

			_context.logInfo(`  📹 Found ${storyItems.length} media items in "${part.name}"`)

			for (const item of storyItems) {
				const nrcsItem = normalizeToNrcsStoryItem(item)
				if (!nrcsItem) continue

				// Only show videos: in your environment, videos are Nexio items
				// (imagine.nexio.*). Everything else is ignored.
				if (!nrcsItem.mosID?.toLowerCase().includes('imagine.nexio')) {
					_context.logDebug(`    Skipping non-video mosID: ${nrcsItem.mosID}`)
					continue
				}

				const parsedPart = parseNrcsItem(_context, nrcsItem, part.name || '')

				// parseNrcsItem() may still return Invalid/Camera/etc depending on mosID,
				// so enforce "videos only" at the PartType level too:
				if (parsedPart.type !== PartType.VT && parsedPart.type !== PartType.GFX) {
					_context.logDebug(`    Skipping non-video PartType: ${parsedPart.type}`)
					continue
				}

				parts.push(parsedPart)
			}
		}
	} else {
		// roCreate message: don't create placeholders. Just return an empty segment for now.
		_context.logDebug(`📋 Initial Story (no items yet): "${ingestSegment.name}"`)
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

function normalizeToNrcsStoryItem(item: any): NrcsStoryItem | undefined {
	if (!item) return undefined

	// Case 1: already-flat
	if (item.mosID || item.itemSlug || item.objID) {
		return {
			mosID: item.mosID || '',
			itemSlug: item.itemSlug || item.objSlug || 'Untitled',
			objID: item.objID,
			objDur: item.objDur,
			objTB: item.objTB,
			objSlug: item.objSlug,
			objPaths: item.objPaths,
			mosAbstract: item.mosAbstract,
		}
	}

	// Case 2: mosFullStory shape
	const content = item.Content || item.content
	if (!content) return undefined

	const paths: any[] = Array.isArray(content.Paths) ? content.Paths : []
	const bestPath =
		paths.find((p) => (p?.Type || p?.type) === 'PATH') ??
		paths.find((p) => (p?.Type || p?.type) === 'PROXY PATH') ??
		paths[0]

	const objPath = bestPath?.Target || bestPath?.target

	const mosID: string = (content.MOSID || content.mosID || '').toString()
	const itemSlug: string = (content.Slug || content.slug || content.ObjectSlug || 'Untitled').toString()
	const objID: string = (content.ObjectID || content.objID || content.ObjID || '').toString()
	const objSlug: string = (content.ObjectSlug || content.objSlug || itemSlug || '').toString()

	const objDur: number = typeof content.Duration === 'number' ? content.Duration : Number(content.Duration)
	const objTB: number | undefined =
		typeof content.TimeBase === 'number'
			? content.TimeBase
			: content.TimeBase != null
				? Number(content.TimeBase)
				: undefined

	return {
		mosID,
		itemSlug,
		objID,
		objDur: Number.isFinite(objDur) ? objDur : 0,
		objTB: objTB && Number.isFinite(objTB) ? objTB : undefined,
		objSlug,
		objPaths: objPath ? { objPath } : undefined,
		mosAbstract: content.mosAbstract,
	}
}

/* NOTE: createPlaceholderCameraPart() no longer used, but leaving it here in case you want to re-enable it.
function createPlaceholderCameraPart(
	ingestData: SofieIngestSegment | { externalId?: string; name?: string }
): PartProps<CameraProps> {
	const defaultSource: RawSourceInfo = {
		type: SourceType.Camera,
		id: 1,
	}

	const cameraProps: CameraProps = {
		externalId: ingestData.externalId || 'unknown',
		duration: 0,
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
*/
