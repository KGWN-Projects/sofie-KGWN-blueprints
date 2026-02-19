import {
	ABPlayerDefinition,
	ABResolverConfiguration,
	IShowStyleContext,
} from '@sofie-automation/blueprints-integration'
import { CasparCGLayers } from '../studio/layers.js'

// Basic implementation of the ABResolverConfiguration:
export function getAbResolverConfiguration(_context: IShowStyleContext): ABResolverConfiguration {
	_context.logInfo('KGWN getAbResolverConfiguration: VT AB config active')
	// Use simple IDs for players in the "clip" pool
	const player1: ABPlayerDefinition = {
		playerId: 1,
	}
	const player2: ABPlayerDefinition = {
		playerId: 2,
	}

	function resolveLayerName(playerId: unknown): string {
		// AB library may pass playerId as number or string; handle both
		if (playerId === 2 || playerId === '2') {
			return CasparCGLayers.CasparCGClipPlayer2
		}
		// Default / fallback: player 1
		return CasparCGLayers.CasparCGClipPlayer1
	}

	const config: ABResolverConfiguration = {
		resolverOptions: {
			idealGapBefore: 1000,
			nowWindow: 2000,
		},
		pools: {
			clip: [player1, player2],
		},
		timelineObjectLayerChangeRules: {
			// This must match the base layer used in VT/VO/adlib timelineObjects
			[CasparCGLayers.CasparCGClipPlayer1]: {
				acceptedPoolNames: ['clip'],
				newLayerName: (playerId): string => resolveLayerName(playerId),
				allowsLookahead: true,
			},
		},
	}

	return config
}
