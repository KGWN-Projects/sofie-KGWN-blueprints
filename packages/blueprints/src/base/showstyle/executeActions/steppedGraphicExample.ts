import {
	IActionExecutionContext,
	WithTimeline,
	NoraContent,
	IAdLibFilterLink,
	IBlueprintTriggeredActions,
	IGUIContextFilterLink,
	IRundownPlaylistFilterLink,
	PlayoutActions,
	TriggerType,
	IBlueprintActionManifest,
	JSONBlobStringify,
	ExtendedIngestRundown,
} from '@sofie-automation/blueprints-integration'
import { literal, t } from '../../../common/util.js'
import { SourceLayer } from '../applyconfig/layers.js'
import { ActionId } from './actionDefinitions.js'
import { getResolvedCurrentlyPlayingPieceInstances } from '../helpers/pieces.js'
