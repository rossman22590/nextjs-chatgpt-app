import * as z from 'zod/v4';

import { createTRPCRouterEdge, edgeProcedure } from '~/server/trpc/trpc.server-edge';

import { ListModelsResponse_schema } from '../llm.server.types';
import { listModelsRunDispatch } from '../listModels.dispatch';

import { bedrockAccessSchema } from './bedrock.access';


// Input Schemas

const _listModelsInputSchema = z.object({
  access: bedrockAccessSchema,
});


// Router

export const llmBedrockRouter = createTRPCRouterEdge({

  /* [Bedrock] list models - fetches from ListFoundationModels + ListInferenceProfiles */
  listModels: edgeProcedure
    .input(_listModelsInputSchema)
    .output(ListModelsResponse_schema)
    .query(async ({ input: { access }, signal }) => {

      const models = await listModelsRunDispatch(access, signal);

      return { models };
    }),

});
