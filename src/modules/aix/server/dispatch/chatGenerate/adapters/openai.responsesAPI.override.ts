import type { OpenAIDialects } from '~/modules/llms/server/openai/openai.router';
import type { AixAPI_Model, AixAPIChatGenerate_Request, AixMessages_SystemMessage, AixMessages_ChatMessage } from '../../../api/aix.wiretypes';
import { OpenAIWire_API_Chat_Completions } from '../../wiretypes/openai.wiretypes';
import { aixToOpenAIChatCompletions as originalAixToOpenAIChatCompletions } from './openai.chatCompletions';
import { approxDocPart_To_String } from './adapters.common';

// Define the type for the Responses API payload
interface ResponsesAPIPayload {
  model: string;
  input: any[];
  text: {
    format: {
      type: string;
    };
  };
  reasoning: {
    effort: "low" | "medium" | "high";
    summary: "auto";
  };
  tools?: any[];
  store: boolean;
  [key: string]: any;
}

// Function to determine if a model uses the responses API
export function usesResponsesAPI(model: AixAPI_Model): boolean {
  return model.id === 'o3-pro' || 
         model.id === 'o1-pro' || 
         model.id.startsWith('o3-pro-') || 
         model.id.startsWith('o1-pro-');
}

// Function to convert Aix messages to Responses API format
function convertToResponsesAPIFormat(systemMessage: AixMessages_SystemMessage | null, chatSequence: AixMessages_ChatMessage[]): any[] {
  const inputMessages = [];
  
  // Add system message if present
  if (systemMessage) {
    const systemContent = [];
    
    for (const part of systemMessage.parts) {
      if (part.pt === 'text') {
        systemContent.push({
          type: "input_text",
          text: part.text
        });
      } else if (part.pt === 'doc') {
        systemContent.push({
          type: "input_text",
          text: approxDocPart_To_String(part)
        });
      }
    }
    
    if (systemContent.length > 0) {
      inputMessages.push({
        role: "developer",
        content: systemContent
      });
    }
  }
  
  // Process chat sequence
  for (const message of chatSequence) {
    if (message.role === 'user') {
      const content = [];
      
      for (const part of message.parts) {
        if (part.pt === 'text') {
          content.push({
            type: "input_text",
            text: part.text
          });
        } else if (part.pt === 'doc') {
          content.push({
            type: "input_text",
            text: approxDocPart_To_String(part)
          });
        } else if (part.pt === 'inline_image') {
          content.push({
            type: "input_image",
            image: {
              data: part.base64,
              mime_type: part.mimeType
            }
          });
        }
      }
      
      if (content.length > 0) {
        inputMessages.push({
          role: "user",
          content: content
        });
      }
    } else if (message.role === 'model') {
      const content = [];
      
      for (const part of message.parts) {
        if (part.pt === 'text') {
          content.push({
            type: "output_text",
            text: part.text
          });
        }
      }
      
      if (content.length > 0) {
        inputMessages.push({
          role: "assistant",
          content: content
        });
      }
    }
  }
  
  return inputMessages;
}

// Override function that wraps the original function
export function aixToOpenAIChatCompletions(
  openAIDialect: OpenAIDialects, 
  model: AixAPI_Model, 
  chatGenerate: AixAPIChatGenerate_Request, 
  jsonOutput: boolean, 
  streaming: boolean
): any {
  // Check if we should use the responses API
  if (openAIDialect === 'openai' && usesResponsesAPI(model)) {
    console.log(`Using Responses API for model: ${model.id}, streaming was: ${streaming}`);
    
    // Extract system message and chat sequence
    const { systemMessage, chatSequence } = chatGenerate;
    
    // Convert messages to Responses API format
    const inputMessages = convertToResponsesAPIFormat(systemMessage, chatSequence);
    
    // Create the responses API payload
    const responsesPayload: ResponsesAPIPayload = {
      model: model.id,
      input: inputMessages.length > 0 ? inputMessages : [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Hello, how can you help me?"
            }
          ]
        }
      ],
      text: {
        format: {
          type: "text"
        }
      },
      reasoning: {
        effort: model.vndOaiReasoningEffort || "medium",
        summary: "auto"
      },
      tools: [],
      store: true
    };
    
    // Add tools if present
    if (chatGenerate.tools && chatGenerate.tools.length > 0) {
      responsesPayload.tools = chatGenerate.tools.map(tool => {
        if (tool.type === 'function_call') {
          return {
            type: "function",
            function: {
              name: tool.function_call.name,
              description: tool.function_call.description,
              parameters: tool.function_call.input_schema
            }
          };
        }
        return null;
      }).filter(Boolean);
    }
    
    // Add a special flag to indicate this is a Responses API payload
    (responsesPayload as any).__useResponsesAPI = true;
    (responsesPayload as any).__forceNonStreaming = true;
    
    return responsesPayload;
  }
  
  // For all other models, use the original function
  return originalAixToOpenAIChatCompletions(openAIDialect, model, chatGenerate, jsonOutput, streaming);
} 