import type { AixAPI_Access, AixAPI_Model, AixAPIChatGenerate_Request } from '../../api/aix.wiretypes';
import { createChatGenerateDispatch as originalCreateChatGenerateDispatch, ChatGenerateDispatch } from './chatGenerate.dispatch';
import { usesResponsesAPI } from './adapters/openai.responsesAPI.override';
import { createOpenAIResponsesAPIParserNS } from './parsers/openai.responsesAPI.parser';
import { openAIAccess } from '~/modules/llms/server/openai/openai.access';

// Override the createChatGenerateDispatch function
export async function createChatGenerateDispatch(
  access: AixAPI_Access, 
  model: AixAPI_Model, 
  chatGenerate: AixAPIChatGenerate_Request, 
  streaming: boolean,
  enableResumability: boolean
): Promise<ChatGenerateDispatch> {
  // Check if we should use the Responses API
  if (access.dialect === 'openai' && usesResponsesAPI(model)) {
    console.log(`Using Responses API dispatch for model: ${model.id}, forcing streaming=false (was: ${streaming})`);
    
    // Create the request using the responses API endpoint
    const { aixToOpenAIChatCompletions } = require('./adapters/openai.responsesAPI.override');
    const requestBody = aixToOpenAIChatCompletions(
      access.dialect, 
      model, 
      chatGenerate, 
      false  // Force streaming to false for responses API
    );
    
    // Remove the special property if it exists
    if (requestBody.__useResponsesAPI) {
      const { __useResponsesAPI, __forceNonStreaming, ...body } = requestBody;
      
      return {
        request: {
          ...openAIAccess(access, model.id, '/v1/responses'),
          method: 'POST',
          body: body
        },
        // Force null demuxer for responses API since it returns complete JSON
        demuxerFormat: null,
        chatGenerateParse: createOpenAIResponsesAPIParserNS()
      };
    }
  }
  
  // For all other cases, use the original function
  return originalCreateChatGenerateDispatch(access, model, chatGenerate, streaming, enableResumability);
} 
