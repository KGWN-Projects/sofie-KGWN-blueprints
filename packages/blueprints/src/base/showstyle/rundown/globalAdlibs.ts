import { IBlueprintAdLibPiece, IShowStyleUserContext, PieceLifespan } from '@sofie-automation/blueprints-integration'
import { assertUnreachable, literal } from '../../../common/util.js'
import { AudioSourceType, SourceType } from '../../studio/helpers/config.js'
import { getAudioObjectOnLayer, getAudioPrimaryObject } from '../helpers/audio.js'
import { createVisionMixerObjects } from '../helpers/visionMixer.js'
import { getOutputLayerForSourceLayer, SourceLayer } from '../applyconfig/layers.js'
import { InputConfig, VisionMixerDevice } from '../../../$schemas/generated/main-studio-config.js'
import { parseConfig } from '../helpers/config.js'
import {} from '../../studio/layers.js'

export function getGlobalAdlibs(context: IShowStyleUserContext){
	const config = parseConfig(context).studio
}
