import {
	Accessor,
	BlueprintConfigCoreConfig,
	BlueprintParentDeviceSettings,
	BlueprintResultApplyStudioConfig,
	ICommonContext,
	TSR,
} from '@sofie-automation/blueprints-integration'
import { BlueprintConfig, StudioConfig, VisionMixerDevice } from '../helpers/config.js'
import { getMappingsDefaults } from './mappings/index.js'
import { preprocessConfig } from '../preprocessConfig.js'
import { literal } from '../../../common/util.js'
// eslint-disable-next-line n/no-missing-import
import { StudioPackageContainer } from '@sofie-automation/shared-lib/dist/core/model/PackageContainer.js'

export function applyConfig(
	context: ICommonContext,
	config: StudioConfig,
	coreConfig: BlueprintConfigCoreConfig
): BlueprintResultApplyStudioConfig {}

export function generateParentDevices(): Record<string, BlueprintParentDeviceSettings> {
  const parentDevices: BlueprintResultApplyStudioConfig['parentDevices'] = {}

	return parentDevices
}

function generatePlayoutDevices(config: BlueprintConfig): BlueprintResultApplyStudioConfig['playoutDevices'] {
	const playoutDevices: BlueprintResultApplyStudioConfig['playoutDevices'] = {}

  playoutDevices[config.studio.audioMixer.deviceId] = {}

	return playoutDevices
}

function generateIngestDevices(): BlueprintResultApplyStudioConfig['ingestDevices'] {
  const ingestDevices: BlueprintResultApplyStudioConfig['ingestDevices'] = {}

	return ingestDevices
}

function generatePackageContainers(): Record<string, StudioPackageContainer> {
	return {}
}
