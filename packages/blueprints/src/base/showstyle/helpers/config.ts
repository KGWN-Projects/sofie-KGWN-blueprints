import { IShowStyleContext, IShowStyleUserContext } from '@sofie-automation/blueprints-integration'
import { BlueprintConfig as BlueprintConfigBase, StudioConfig } from '../../studio/helpers/config.js'
import {
	DVELayoutConfig,
	ShowStyleConfig as ShowStyleConfig0,
} from '../../../$schemas/generated/main-showstyle-config.js'

export interface BlueprintConfig extends BlueprintConfigBase {}

export type ShowStyleConfig = ShowStyleConfig0

export function parseConfig(context: IShowStyleContext | IShowStyleUserContext){
	const showStyle = context.getShowStyleConfig() as ShowStyleConfig
}
