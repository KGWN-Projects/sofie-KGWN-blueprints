import {
	BlueprintResultSegment,
	IBlueprintRundown,
	ISegmentUserContext,
	SofieIngestSegment,
} from '@sofie-automation/blueprints-integration'
import { RundownMetadata } from './helpers/metadata.js'
import { SegmentProps } from './definitions/index.js'

// Get segment is called from Core and is the main entry point for the blueprint for receiving segments
export function getSegment(context: ISegmentUserContext, ingestSegment: SofieIngestSegment): BlueprintResultSegment {}
