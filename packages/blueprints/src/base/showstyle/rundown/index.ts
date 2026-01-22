import {
	BlueprintResultRundown,
	ExtendedIngestRundown,
	IBlueprintRundown,
	IShowStyleUserContext,
	PlaylistTimingForwardTime,
	PlaylistTimingType,
} from '@sofie-automation/blueprints-integration'
import { literal } from '../../../common/util.js'
import { RundownMetadata } from '../helpers/metadata.js'
import { getBaseline } from './baseline.js'
import {} from './globalActions.js'
import {} from './globalAdlibs.js'

export function getRundown(
	context: IShowStyleUserContext,
	ingestRundown: ExtendedIngestRundown
): BlueprintResultRundown {
	context.logDebug(
		'------------------------------- getRundown ----------------------------------------------------------------'
	)
	const rundownMetadata: RundownMetadata = {
		ingestType: ingestRundown.type,
	}

	const timing: PlaylistTimingForwardTime = {
		type: PlaylistTimingType.ForwardTime,
		expectedStart: 0,
		expectedDuration: 0,
	}
	const rundown = literal<IBlueprintRundown>({
		// playlistExternalId: 'test-playlist', // Uncomment to test simple playlist grouping. See 'packages/blueprints/src/base/studio/manifest.ts' for more advanced grouping

		externalId: ingestRundown.externalId,
		name: ingestRundown.name,
		privateData: rundownMetadata,
		timing,
	})
	context.logDebug('rundown' + JSON.stringify(rundown))

	const res: BlueprintResultRundown = {
		rundown,
		baseline: getBaseline(context),
	}

	if (ingestRundown.payload) {}

	context.logDebug('res' + JSON.stringify(res))

	return res
}
