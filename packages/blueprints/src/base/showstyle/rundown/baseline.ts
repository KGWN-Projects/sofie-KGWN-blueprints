import { BlueprintResultBaseline, IShowStyleUserContext, TSR } from '@sofie-automation/blueprints-integration'
import { literal } from '../../../common/util.js'
import { SourceType, StudioConfig } from '../../studio/helpers/config.js'
import {} from '../../studio/layers.js'
import {} from '../helpers/audio.js'
import { DVEDesigns, DVELayouts } from '../helpers/dve.js'
import { TimelineBlueprintExt } from '../../studio/customTypes.js'
import { InputConfig, OutputConfig } from '../../../$schemas/generated/main-studio-config.js'
import { parseConfig } from '../helpers/config.js'

export function getBaseline(context: IShowStyleUserContext): BlueprintResultBaseline {
	const config = parseConfig(context).studio

	return {
		timelineObjects: [],
	}
}
