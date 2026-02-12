import { IRundownUserContext } from '@sofie-automation/blueprints-integration'
import { PartInfo, PartProps, PartType, VTProps, CameraProps } from '../definitions/index.js'
import { RawSourceInfo } from '../helpers/sources.js'
import { SourceType } from '../../studio/helpers/config.js'
import { ClipProps } from '../helpers/clips.js'

/**
 * Represents a parsed NRCS story item from roStorySend
 */
export interface NrcsStoryItem {
	mosID: string
	mosAbstract?: string
	itemSlug: string
	objID: string
	objDur: number // In deciseconds with timebase
	objTB?: number // Timebase (e.g., 60)
	objSlug: string
	objPaths?: {
		objPath?: string
	}
	mosDurationSeconds?: number // Duration in seconds from MOSItemDurations (authoritative)
}

/**
 * Detect the part type based on mosID pattern and item slug
 */
export function detectNrcsPartType(item: NrcsStoryItem, storySlug: string): PartType | null {
	const mosID = item.mosID.toLowerCase()
	const itemSlugLower = (item.itemSlug + item.objSlug).toLowerCase()
	const storySlugLower = storySlug.toLowerCase()

	// Graphics/VT sources (video files)
	if (mosID.includes('imagine.nexio')) {
		// Check if it's a stinger/animation vs regular VT
		if (itemSlugLower.match(/stinger|bump|animation|open/) || storySlugLower.match(/stinger|bump|open/)) {
			return PartType.GFX
		}
		return PartType.VT
	}

	// Camera/studio sources
	if (mosID.includes('cueit.cuescript') || mosID.includes('sofie.mos')) {
		return PartType.Camera
	}

	// Remote/SOT sources
	if (mosID.includes('nverzion')) {
		return PartType.Remote
	}

	// Unknown
	return PartType.Invalid
}

/**
 * Parse a VT (video) item from NRCS
 */
export function parseNrcsVT(_context: IRundownUserContext, item: NrcsStoryItem): PartProps<VTProps> {
	// Extract filename from objPath or use itemSlug
	let fileName = item.itemSlug
	if (item.objPaths?.objPath) {
		fileName = item.objPaths.objPath.split('/').pop() || item.itemSlug
	}

	// Use mosDurationSeconds (from MOSItemDurations) as authoritative source
	// If not available, calculate from objDur/objTB
	const durationSeconds = item.mosDurationSeconds || (item.objDur && item.objTB ? item.objDur / item.objTB : 0)
	const durationMs = durationSeconds * 1000

	const clipProps: ClipProps = {
		fileName,
		duration: durationSeconds, // ClipProps expects seconds
	}

	const vtProps: VTProps = {
		externalId: item.objID,
		duration: durationMs, // PartProps expects milliseconds
		name: item.itemSlug,
		clipProps,
	}

	return {
		type: PartType.VT,
		rawType: 'vt',
		rawTitle: item.itemSlug,
		info: PartInfo.NORMAL,
		objects: [],
		payload: vtProps,
	}
}

/**
 * Parse a Camera item from NRCS
 * This is typically a studio setup with a camera number embedded in the item slug
 */
export function parseNrcsCamera(_context: IRundownUserContext, item: NrcsStoryItem): PartProps<CameraProps> {
	// Try to extract camera number from slug (e.g., "2SHOT" -> camera 2)
	const cameraMatch = (item.itemSlug + item.objSlug).match(/(\d+)/)
	const cameraNum = cameraMatch ? Math.min(Math.max(parseInt(cameraMatch[1]), 1), 5) : 1 // Clamp between 1-5

	// Use mosDurationSeconds (from MOSItemDurations) as authoritative source
	// If not available, calculate from objDur/objTB
	const durationSeconds = item.mosDurationSeconds || (item.objDur && item.objTB ? item.objDur / item.objTB : 0)
	const durationMs = durationSeconds * 1000

	const source: RawSourceInfo = {
		type: SourceType.Camera,
		id: cameraNum, // 1-based
	}

	const cameraProps: CameraProps = {
		externalId: item.objID,
		duration: durationMs,
		name: item.itemSlug,
		input: source,
	}

	return {
		type: PartType.Camera,
		rawType: 'camera',
		rawTitle: item.itemSlug,
		info: PartInfo.NORMAL,
		objects: [],
		payload: cameraProps,
	}
}

/**
 * Parse a Graphics/Stinger item from NRCS
 * These are typically short animations or overlays
 * For now, treat as camera placeholder - will be refined with graphics details later
 */
export function parseNrcsGfx(_context: IRundownUserContext, item: NrcsStoryItem): PartProps<CameraProps> {
	// Use mosDurationSeconds (from MOSItemDurations) as authoritative source
	// If not available, calculate from objDur/objTB
	const durationSeconds = item.mosDurationSeconds || (item.objDur && item.objTB ? item.objDur / item.objTB : 0)
	const durationMs = durationSeconds * 1000

	// Placeholder: Graphics items will be properly parsed when detailed item properties arrive
	// For now, return a camera part so the segment displays
	const source: RawSourceInfo = {
		type: SourceType.Camera,
		id: 1,
	}

	const gfxProps: any = {
		externalId: item.objID,
		duration: durationMs,
		name: item.itemSlug,
		input: source,
	}

	return {
		type: PartType.GFX,
		rawType: 'gfx',
		rawTitle: item.itemSlug,
		info: PartInfo.NORMAL,
		objects: [],
		payload: gfxProps,
	}
}

/**
 * Parse a Remote/SOT (Sound on Tape) item from NRCS
 * This is typically a remote feed with audio
 */
export function parseNrcsRemote(_context: IRundownUserContext, item: NrcsStoryItem): PartProps<CameraProps> {
	// Use mosDurationSeconds (from MOSItemDurations) as authoritative source
	// If not available, calculate from objDur/objTB
	const durationSeconds = item.mosDurationSeconds || (item.objDur && item.objTB ? item.objDur / item.objTB : 0)
	const durationMs = durationSeconds * 1000

	const source: RawSourceInfo = {
		type: SourceType.Remote,
		id: 1, // Default remote source
	}

	const remoteProps: CameraProps = {
		externalId: item.objID,
		duration: durationMs,
		name: item.itemSlug,
		input: source,
	}

	return {
		type: PartType.Remote,
		rawType: 'remote',
		rawTitle: item.itemSlug,
		info: PartInfo.NORMAL,
		objects: [],
		payload: remoteProps,
	}
}

/**
 * Route an NRCS story item to the appropriate parser
 */
export function parseNrcsItem(context: IRundownUserContext, item: NrcsStoryItem, storySlug: string): PartProps<any> {
	const partType = detectNrcsPartType(item, storySlug)

	context.logDebug(`NRCS item "${item.itemSlug}" detected as type: ${partType}`)

	switch (partType) {
		case PartType.VT:
			return parseNrcsVT(context, item)
		case PartType.GFX:
			return parseNrcsGfx(context, item)
		case PartType.Camera:
			return parseNrcsCamera(context, item)
		case PartType.Remote:
			return parseNrcsRemote(context, item)
		default:
			// Return as camera by default to ensure segment displays
			context.logWarning(`Unknown NRCS item type for "${item.itemSlug}", defaulting to camera`)
			return parseNrcsCamera(context, item)
	}
}
