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
 * Global VT index across the entire rundown.
 * First VT seen → 0, second VT → 1, etc.
 */
let globalVtIndex = 0

/**
 * Parse a VT (video) item from NRCS
 */
export function parseNrcsVT(_context: IRundownUserContext, item: NrcsStoryItem, vtIndex: number): PartProps<VTProps> {
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
		vtIndex, // sequential index across rundown
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
 */
export function parseNrcsCamera(_context: IRundownUserContext, item: NrcsStoryItem): PartProps<CameraProps> {
	const cameraMatch = (item.itemSlug + item.objSlug).match(/(\d+)/)
	const cameraNum = cameraMatch ? Math.min(Math.max(parseInt(cameraMatch[1]), 1), 5) : 1

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
 */
export function parseNrcsGfx(_context: IRundownUserContext, item: NrcsStoryItem): PartProps<CameraProps> {
	const durationSeconds = item.mosDurationSeconds || (item.objDur && item.objTB ? item.objDur / item.objTB : 0)
	const durationMs = durationSeconds * 1000

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
 * Parse a Remote/SOT item from NRCS
 */
export function parseNrcsRemote(_context: IRundownUserContext, item: NrcsStoryItem): PartProps<CameraProps> {
	const durationSeconds = item.mosDurationSeconds || (item.objDur && item.objTB ? item.objDur / item.objTB : 0)
	const durationMs = durationSeconds * 1000

	const source: RawSourceInfo = {
		type: SourceType.Remote,
		id: 1,
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
		case PartType.VT: {
			const currentIndex = globalVtIndex
			globalVtIndex += 1
			context.logInfo(`NRCS VT index debug (global): item="${item.itemSlug}", vtIndex=${currentIndex}`)
			return parseNrcsVT(context, item, currentIndex)
		}
		case PartType.GFX:
			return parseNrcsGfx(context, item)
		case PartType.Camera:
			return parseNrcsCamera(context, item)
		case PartType.Remote:
			return parseNrcsRemote(context, item)
		default:
			context.logWarning(`Unknown NRCS item type for "${item.itemSlug}", defaulting to camera`)
			return parseNrcsCamera(context, item)
	}
}
