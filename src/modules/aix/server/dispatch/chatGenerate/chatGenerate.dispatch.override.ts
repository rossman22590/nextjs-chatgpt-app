import type { AixAPI_Access, AixAPI_Model, AixAPIChatGenerate_Request } from '../../api/aix.wiretypes';
import type { AixDemuxers } from '../stream.demuxers';
import { createChatGenerateDispatch as originalCreateChatGenerateDispatch } from './chatGenerate.dispatch';
import { ChatGenerateParseFunction } from './chatGenerate.dispatch';
import { usesResponsesAPI } from './adapters/openai.responsesAPI.override';
import { createOpenAIResponsesAPIParserNS, createOpenAIResponsesAPIChunkParser } from './parsers/openai.responsesAPI.parser';
import { openAIAccess } from '~/modules/llms/server/openai/openai.router';

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
    // Create the request using the responses API endpoint
    const { aixToOpenAIChatCompletions } = require('./adapters/openai.responsesAPI.override');
    const requestBody = aixToOpenAIChatCompletions(
      access.dialect,
      model,
      chatGenerate,
      false,
      streaming  // Use the original streaming parameter
    );
    
    // Remove the special property if it exists
    if (requestBody.__useResponsesAPI) {
      const { __useResponsesAPI, __forceNonStreaming, ...body } = requestBody;
      
      // Check if we should force non-streaming for this specific model
      const shouldForceNonStreaming = __forceNonStreaming || false;
      const finalStreaming = shouldForceNonStreaming ? false : streaming;
      
      console.log(`Using Responses API dispatch for model: ${model.id}, streaming: ${finalStreaming} (original: ${streaming}, forced: ${shouldForceNonStreaming})`);
      
      return {
        request: {
          ...openAIAccess(access, model.id, '/v1/responses'),
          body: { ...body, stream: finalStreaming }
        },
        // Use appropriate demuxer based on streaming mode
        demuxerFormat: finalStreaming ? 'fast-sse' : null,
        chatGenerateParse: finalStreaming ? createOpenAIResponsesAPIChunkParser() : createOpenAIResponsesAPIParserNS()
      };
    }
  }
  
  // For all other cases, use the original function
  return originalCreateChatGenerateDispatch(access, model, chatGenerate, streaming);
} 