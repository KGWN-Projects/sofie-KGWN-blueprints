import {
	ExtendedIngestRundown,
	IBlueprintActionManifest,
	IShowStyleUserContext,
} from '@sofie-automation/blueprints-integration'
import { literal, t } from '../../../common/util.js'
import { getOutputLayerForSourceLayer, SourceLayer } from '../applyconfig/layers.js'
import { ActionId } from '../executeActions/actionDefinitions.js'
import { exampleGraphicNextStepAdlibAction } from '../executeActions/steppedGraphicExample.js'

export function getGlobalActions(
	_context: IShowStyleUserContext,
	ingestRundown: ExtendedIngestRundown
): IBlueprintActionManifest[] {
	return [
		literal<IBlueprintActionManifest>({
			actionId: ActionId.LastRemote,
			userData: {},
			userDataManifest: {},
			display: {
				label: t('Last Remote'),
				sourceLayerId: SourceLayer.Remote,
				outputLayerId: getOutputLayerForSourceLayer(SourceLayer.Remote),
			},
			externalId: ingestRundown.externalId,
		}),
		literal<IBlueprintActionManifest>({
			actionId: ActionId.LastDVE,
			userData: {},
			userDataManifest: {},
			display: {
				label: t('Last DVE'),
				sourceLayerId: SourceLayer.DVE,
				outputLayerId: getOutputLayerForSourceLayer(SourceLayer.DVE),
			},
			externalId: ingestRundown.externalId,
		}),

		// New: end VT1 early (cuts immediately)
		literal<IBlueprintActionManifest>({
			actionId: ActionId.EndVT1,
			userData: {},
			userDataManifest: {},
			display: {
				label: t('END VT1'),
				sourceLayerId: SourceLayer.VT1,
				outputLayerId: getOutputLayerForSourceLayer(SourceLayer.VT1),
			},
			externalId: ingestRundown.externalId,
		}),

		// New: end VT2 early (cuts immediately)
		literal<IBlueprintActionManifest>({
			actionId: ActionId.EndVT2,
			userData: {},
			userDataManifest: {},
			display: {
				label: t('END VT2'),
				sourceLayerId: SourceLayer.VT2,
				outputLayerId: getOutputLayerForSourceLayer(SourceLayer.VT2),
			},
			externalId: ingestRundown.externalId,
		}),

		exampleGraphicNextStepAdlibAction(ingestRundown),
	]
}
