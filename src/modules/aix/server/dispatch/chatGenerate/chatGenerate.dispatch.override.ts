// File: chatGenerate.dispatch.override.ts

import type { AixAPI_Access, AixAPI_Model, AixAPIChatGenerate_Request } from '../../api/aix.wiretypes';
import type { AixDemuxers } from '../stream.demuxers';
import { createChatGenerateDispatch as originalCreateChatGenerateDispatch } from './chatGenerate.dispatch';
import { ChatGenerateParseFunction } from './chatGenerate.dispatch';
import { usesResponsesAPI } from './adapters/openai.responsesAPI.override';
import { createOpenAIResponsesAPIParserNS, createOpenAIResponsesAPIChunkParser } from './parsers/openai.responsesAPI.parser';

// Override the createChatGenerateDispatch function
export function createChatGenerateDispatch(
  access: AixAPI_Access, 
  model: AixAPI_Model, 
  chatGenerate: AixAPIChatGenerate_Request, 
  streaming: boolean
): {
  request: { url: string, headers: HeadersInit, body: object },
  demuxerFormat: AixDemuxers.StreamDemuxerFormat;
  chatGenerateParse: ChatGenerateParseFunction;
} {
  // Check if we should use the Responses API
  if (access.dialect === 'openai' && usesResponsesAPI(model)) {
    console.log(`Using Responses API dispatch for model: ${model.id}`);
    
    // Get the OpenAI access configuration
    const openAIAccess = require('~/modules/llms/server/openai/openai.router').openAIAccess;
    
    // Create the request using the responses API endpoint
    const request = {
      ...openAIAccess(access, model.id, '/v1/responses'),
      body: require('./adapters/openai.responsesAPI.override').aixToOpenAIChatCompletions(
        access.dialect, 
        model, 
        chatGenerate, 
        false, 
        streaming
      )
    };
    
    // Remove the special property if it exists
    if ((request.body as any).__useResponsesAPI) {
      const { __useResponsesAPI, ...body } = request.body as any;
      request.body = body;
    }
    
    return {
      request,
      demuxerFormat: streaming ? 'fast-sse' : null,
      chatGenerateParse: streaming 
        ? createOpenAIResponsesAPIChunkParser() 
        : createOpenAIResponsesAPIParserNS()
    };
  }
  
  // For all other cases, use the original function
  return originalCreateChatGenerateDispatch(access, model, chatGenerate, streaming);
}
