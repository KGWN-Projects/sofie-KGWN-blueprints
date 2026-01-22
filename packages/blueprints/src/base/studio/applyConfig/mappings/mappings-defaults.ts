import { BlueprintMapping, BlueprintMappings, LookaheadMode, TSR } from '@sofie-automation/blueprints-integration'
import { literal } from '../../../../common/util.js'
import { AudioSourceType, SourceType, StudioConfig } from '../../helpers/config.js'
import { AsbtractLayers } from './layers.js'

export default literal<BlueprintMappings>({
	[AsbtractLayers.CoreAbstract]: {
		device: TSR.DeviceType.ABSTRACT,
		deviceId: 'abstract0',
		lookahead: LookaheadMode.NONE,
		options: {},
	},
})
