import { IBlueprintAdLibPiece, IBlueprintPiece, PieceLifespan, TSR } from '@sofie-automation/blueprints-integration'
import {
	GraphicObject,
	GraphicObjectBase,
	ObjectType,
	SomeObject,
	SteppedGraphicObject,
} from '../../../common/definitions/objects.js'
import { literal } from '../../../common/util.js'
import { StudioConfig } from '../../studio/helpers/config.js'
import {} from '../../studio/layers.js'
import { getOutputLayerForSourceLayer, SourceLayer } from '../applyconfig/layers.js'
import { getClipPlayerInput } from './clips.js'
import { createVisionMixerObjects } from './visionMixer.js'
import { TimelineBlueprintExt } from '../../studio/customTypes.js'

export interface GraphicsResult {
	pieces: IBlueprintPiece[]
	adLibPieces: IBlueprintAdLibPiece[]
}
