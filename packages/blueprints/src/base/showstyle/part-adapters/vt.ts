import {
	BlueprintResultPart,
	ExpectedPackage,
	IBlueprintPiece,
	PieceLifespan,
	TSR,
} from '@sofie-automation/blueprints-integration'
import { PartContext } from '../../../common/context.js'
import { changeExtension, literal, stripExtension } from '../../../common/util.js'
import { AudioSourceType } from '../../studio/helpers/config.js'
import { CasparCGLayers } from '../../studio/layers.js'
import { PartProps, VTProps } from '../definitions/index.js'
import { getAudioPrimaryObject } from '../helpers/audio.js'
import { getClipPlayerInput } from '../helpers/clips.js'
import { parseGraphicsFromObjects } from '../helpers/graphics.js'
import { createScriptPiece } from '../helpers/script.js'
import { createVisionMixerObjects } from '../helpers/visionMixer.js'
import { getOutputLayerForSourceLayer, SourceLayer } from '../applyconfig/layers.js'
import { TimelineBlueprintExt } from '../../studio/customTypes.js'
import { parseConfig } from '../helpers/config.js'

/** Sequential A/B: even vtIndex → player 1, odd vtIndex → player 2 */
function pickClipLayerForVT(vtIndex: number): CasparCGLayers {
	return vtIndex % 2 === 0 ? CasparCGLayers.CasparCGClipPlayer1 : CasparCGLayers.CasparCGClipPlayer2
}

export function generateVTPart(context: PartContext, part: PartProps<VTProps>): BlueprintResultPart {
	const config = parseConfig(context).studio
	const visionMixerInput = getClipPlayerInput(config)

	// Use vtIndex if present; default to 0 so we always have a number
	const vtIndex = part.payload.vtIndex ?? 0
	const clipLayer = pickClipLayerForVT(vtIndex)
	context.logInfo(
		`VT routing debug: extId=${part.payload.externalId}, file=${part.payload.clipProps.fileName}, vtIndex=${vtIndex}, clipLayer=${clipLayer}`
	)
	const audioTlObj = getAudioPrimaryObject(config, [{ type: AudioSourceType.Playback, index: 0 }])

	const vtPiece: IBlueprintPiece = {
		enable: {
			start: 0,
		},
		externalId: part.payload.externalId,
		name: `${part.payload.clipProps?.fileName || 'Missing file name'}`,
		lifespan: PieceLifespan.WithinPart,
		sourceLayerId: SourceLayer.VT,
		outputLayerId: getOutputLayerForSourceLayer(SourceLayer.VT),

		// No AB for VT; we route directly based on vtIndex
		content: {
			fileName: part.payload.clipProps.fileName,

			timelineObjects: [
				// Vision mixer routing to the media player input
				...createVisionMixerObjects(config, visionMixerInput?.input || 0, config.casparcgLatency),

				// CASPARCG media object: directly on chosen clip player layer
				literal<TimelineBlueprintExt<TSR.TimelineContentCCGMedia>>({
					id: '',
					enable: { start: 0 },
					layer: clipLayer,
					content: {
						deviceType: TSR.DeviceType.CASPARCG,
						type: TSR.TimelineContentTypeCasparCg.MEDIA,
						file: stripExtension(part.payload.clipProps.fileName),
					},
					priority: 1,
				}),

				// Primary audio for VT
				audioTlObj,
			],

			sourceDuration: part.payload.clipProps.sourceDuration,
		},

		// Expected media package: match to the same layer we playout on
		expectedPackages: [
			literal<ExpectedPackage.ExpectedPackageMediaFile>({
				_id: context.getHashId(part.payload.clipProps.fileName, true),
				layers: [clipLayer],
				type: ExpectedPackage.PackageType.MEDIA_FILE,
				content: {
					filePath: part.payload.clipProps.fileName,
				},
				version: {},
				contentVersionHash: '',
				sources: [],
				sideEffect: {
					previewPackageSettings: {
						path: `previews/${changeExtension(part.payload.clipProps.fileName, 'webm')}`,
					},
					thumbnailPackageSettings: {
						path: `thumbnails/${changeExtension(part.payload.clipProps.fileName, 'jpg')}`,
						seekTime: 0,
					},
				},
			}),
		],
	}

	const pieces = [vtPiece]

	const scriptPiece = createScriptPiece(part.payload.script, part.payload.externalId)
	if (scriptPiece) pieces.push(scriptPiece)

	const graphics = parseGraphicsFromObjects(config, part.objects)
	if (graphics.pieces) pieces.push(...graphics.pieces)

	return {
		part: {
			externalId: part.payload.externalId,
			title: part.payload.name,
			expectedDuration: part.payload.duration,
			autoNext: true,
		},
		pieces,
		adLibPieces: [...graphics.adLibPieces],
		actions: [],
	}
}
