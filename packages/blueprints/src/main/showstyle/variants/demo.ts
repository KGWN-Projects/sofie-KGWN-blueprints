import { ShowStyleConfig } from '../../../base/showstyle/helpers/config.js'
import { IShowStyleVariantConfigPreset } from '@sofie-automation/blueprints-integration'

type VariantsConfig = Pick<ShowStyleConfig, 'dvePresets'>

export const demoVariants: Record<string, IShowStyleVariantConfigPreset<VariantsConfig>> = {
	demo1: {
		name: 'KGWN-1',
		config: {
			dvePresets: {},
		},
	},
	demo2: {
		name: 'KGWN-2',
		config: {
			dvePresets: {},
		},
	},
	demo3: {
		name: 'KGWN-3',
		config: {
			dvePresets: {},
		},
	},
}
