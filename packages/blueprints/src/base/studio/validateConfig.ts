import { ICommonContext, IConfigMessage, NoteSeverity } from '@sofie-automation/blueprints-integration'
import { StudioConfig } from './helpers/config.js'
import { t } from '../../common/util.js'

export function validateConfig(_context: ICommonContext, config: StudioConfig): Array<IConfigMessage> {
	const messages: IConfigMessage[] = []
}
