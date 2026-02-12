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
		// TODO: Parse actual story items from roStorySend messages
		// For now, create placeholder parts
		ingestSegment.parts.forEach((part) => {
			parts.push(createPlaceholderCameraPart(part))
		})
	} else {
		// roCreate message: no items yet, create a single placeholder part so segment displays
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
