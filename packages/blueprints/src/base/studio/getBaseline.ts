import { BlueprintResultStudioBaseline, IStudioContext, TSR } from '@sofie-automation/blueprints-integration'
import { literal } from '../../common/util.js'
import { AudioSourceType, StudioConfig } from './helpers/config.js'
import { TimelineBlueprintExt } from './customTypes.js'
import { OutputConfig } from '../../$schemas/generated/main-studio-config.js'

export function getBaseline(context: IStudioContext): BlueprintResultStudioBaseline {
	const config = (context.getStudioConfig() as any).studio as StudioConfig
	context.logError('getBaseline - config' + JSON.stringify(config))

	return {
		timelineObjects: [],
		expectedPackages: [],
	}
}
