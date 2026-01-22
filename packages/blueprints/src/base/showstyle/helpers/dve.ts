import {
	IShowStyleContext,
	SourceLayerType,
	SplitsContent,
	SplitsContentBoxContent,
	SplitsContentBoxProperties,
	TSR,
} from '@sofie-automation/blueprints-integration'
import { literal } from '../../../common/util.js'
import { SourceType, StudioConfig } from '../../studio/helpers/config.js'
import { DVEProps } from '../definitions/index.js'
import { getClipPlayerInput } from './clips.js'
import { parseConfig } from './config.js'
import { getSourceInfoFromRaw } from './sources.js'
