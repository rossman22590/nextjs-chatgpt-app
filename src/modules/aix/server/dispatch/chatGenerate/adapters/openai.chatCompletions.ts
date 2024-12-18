import type { OpenAIDialects } from '~/modules/llms/server/openai/openai.router';

import type { AixAPI_Model, AixAPIChatGenerate_Request, AixMessages_ChatMessage, AixMessages_SystemMessage, AixParts_MetaInReferenceToPart, AixTools_ToolDefinition, AixTools_ToolsPolicy } from '../../../api/aix.wiretypes';
import { OpenAIWire_API_Chat_Completions, OpenAIWire_ContentParts, OpenAIWire_Messages } from '../../wiretypes/openai.wiretypes';

const hotFixOnlySupportN1 = true;
const hotFixPreferArrayUserContent = true;
const hotFixForceImageContentPartOpenAIDetail: 'auto' | 'low' | 'high' = 'high';
const hotFixSquashTextSeparator = '\n\n\n---\n\n\n';

type TRequest = OpenAIWire_API_Chat_Completions.Request;
type TRequestMessages = TRequest['messages'];

export function aixToOpenAIChatCompletions(openAIDialect: OpenAIDialects, model: AixAPI_Model, chatGenerate: AixAPIChatGenerate_Request, jsonOutput: boolean, streaming: boolean): TRequest {
  const hotFixAlternateUserAssistantRoles = openAIDialect === 'perplexity';
  const hotFixRemoveEmptyMessages = openAIDialect === 'perplexity';
  const hotFixRemoveStreamOptions = openAIDialect === 'azure' || openAIDialect === 'mistral';
  const hotFixSquashMultiPartText = openAIDialect === 'deepseek';
  const hotFixThrowCannotFC = openAIDialect === 'deepseek' || openAIDialect === 'openrouter' || openAIDialect === 'perplexity';
  const hotFixOpenAIO1Preview = openAIDialect === 'openai' && (model.id.startsWith('o1-') || model.id === 'o1');

  if (chatGenerate.tools?.length && hotFixThrowCannotFC)
    throw new Error('This service does not support function calls');

  let chatMessages = _toOpenAIMessages(chatGenerate.systemMessage, chatGenerate.chatSequence, hotFixOpenAIO1Preview);

  if (hotFixSquashMultiPartText && !hotFixOpenAIO1Preview)
    chatMessages = _fixSquashMultiPartText(chatMessages);

  if (hotFixRemoveEmptyMessages)
    chatMessages = _fixRemoveEmptyMessages(chatMessages);

  if (hotFixAlternateUserAssistantRoles)
    chatMessages = _fixAlternateUserAssistantRoles(chatMessages);

  let payload: TRequest = {
    model: model.id,
    messages: chatMessages,
    tools: chatGenerate.tools && _toOpenAITools(chatGenerate.tools),
    tool_choice: chatGenerate.toolsPolicy && _toOpenAIToolChoice(openAIDialect, chatGenerate.toolsPolicy),
    parallel_tool_calls: undefined,
    temperature: model.temperature !== undefined ? model.temperature : undefined,
    top_p: undefined,
    n: hotFixOnlySupportN1 ? undefined : 0,
    stream: streaming,
    stream_options: streaming ? { include_usage: true } : undefined,
    response_format: jsonOutput ? { type: 'json_object' } : undefined,
    seed: undefined,
    stop: undefined,
    user: undefined,
  };

  if (hotFixOpenAIO1Preview) {
    if (model.maxTokens !== undefined) {
      payload.max_completion_tokens = model.maxTokens;
    }
  } else {
    if (model.maxTokens !== undefined) {
      payload.max_tokens = model.maxTokens;
    }
  }

  if (hotFixOpenAIO1Preview)
    payload = _fixRequestForOpenAIO1Preview(payload);

  if (hotFixRemoveStreamOptions)
    payload = _fixRemoveStreamOptions(payload);

  const validated = OpenAIWire_API_Chat_Completions.Request_schema.safeParse(payload);
  if (!validated.success) {
    console.warn('OpenAI: invalid chatCompletions payload. Error:', validated.error);
    throw new Error(`Invalid sequence for OpenAI models: ${validated.error.errors?.[0]?.message || validated.error.message || validated.error}.`);
  }

  return validated.data;
}

function _fixAlternateUserAssistantRoles(chatMessages: TRequestMessages): TRequestMessages {
  return chatMessages.reduce((acc, historyItem) => {
    if (acc.length > 0 && historyItem.role === 'system') {
      historyItem = {
        role: 'user',
        content: historyItem.content,
      };
    }

    if (acc.length > 0) {
      const lastItem = acc[acc.length - 1];
      if (lastItem.role === historyItem.role) {
        if (lastItem.role === 'assistant') {
          lastItem.content += hotFixSquashTextSeparator + historyItem.content;
        } else if (lastItem.role === 'user') {
          lastItem.content = [
            ...(Array.isArray(lastItem.content) ? lastItem.content : [OpenAIWire_ContentParts.TextContentPart(lastItem.content)]),
            ...(Array.isArray(historyItem.content) ? historyItem.content : historyItem.content ? [OpenAIWire_ContentParts.TextContentPart(historyItem.content)] : []),
          ];
        }
        return acc;
      }
    }

    acc.push(historyItem);
    return acc;
  }, [] as TRequestMessages);
}

function _fixRemoveEmptyMessages(chatMessages: TRequestMessages): TRequestMessages {
  return chatMessages.filter(message => message.content !== null && message.content !== '');
}

function _fixRequestForOpenAIO1Preview(payload: TRequest): TRequest {
  const { max_tokens, temperature: _removeTemperature, top_p: _removeTopP, ...rest } = payload;
  return rest;
}

function _fixRemoveStreamOptions(payload: TRequest): TRequest {
  const { stream_options, parallel_tool_calls, ...rest } = payload;
  return rest;
}

function _fixSquashMultiPartText(chatMessages: TRequestMessages): TRequestMessages {
  return chatMessages.reduce((acc, message) => {
    if (message.role === 'user' && Array.isArray(message.content))
      acc.push({ role: message.role, content: message.content.filter(part => part.type === 'text').map(textPart => textPart.text).filter(text => !!text).join(hotFixSquashTextSeparator) });
    else
      acc.push(message);
    return acc;
  }, [] as TRequestMessages);
}

function _toOpenAIMessages(systemMessage: AixMessages_SystemMessage | null, chatSequence: AixMessages_ChatMessage[], hotFixOpenAIO1Preview: boolean): TRequestMessages {
  const chatMessages: TRequestMessages = [];

  systemMessage?.parts.forEach((part) => {
    if (part.pt !== 'meta_cache_control')
      chatMessages.push({ role: 'system', content: part.text });
  });

  for (const { parts, role } of chatSequence) {
    switch (role) {
      case 'user':
        for (const part of parts) {
          const currentMessage = chatMessages[chatMessages.length - 1];
          switch (part.pt) {
            case 'doc':
            case 'text':
              const textContentString =
                part.pt === 'text' ? part.text
                  : part.data.text.startsWith('```') ? part.data.text
                    : `\`\`\`${part.ref || ''}\n${part.data.text}\n\`\`\`\n`;

              const textContentPart = OpenAIWire_ContentParts.TextContentPart(textContentString);

              if (currentMessage?.role === 'user' && Array.isArray(currentMessage.content))
                currentMessage.content.push(textContentPart);
              else
                chatMessages.push({ role: 'user', content: hotFixPreferArrayUserContent ? [textContentPart] : textContentPart.text });
              break;

            case 'inline_image':
              const { mimeType, base64 } = part;
              const base64DataUrl = `data:${mimeType};base64,${base64}`;
              const imageContentPart = OpenAIWire_ContentParts.ImageContentPart(base64DataUrl, hotFixForceImageContentPartOpenAIDetail);

              if (currentMessage?.role === 'user' && Array.isArray(currentMessage.content))
                currentMessage.content.push(imageContentPart);
              else
                chatMessages.push({ role: 'user', content: [imageContentPart] });
              break;

            case 'meta_cache_control':
              break;

            case 'meta_in_reference_to':
              chatMessages.push({ role: hotFixOpenAIO1Preview ? 'user' : 'system', content: _toOpenAIInReferenceToText(part) });
              break;

            default:
              throw new Error(`Unsupported part type in User message: ${(part as any).pt}`);
          }
        }
        break;

      case 'model':
        for (const part of parts) {
          const currentMessage = chatMessages[chatMessages.length - 1];
          switch (part.pt) {
            case 'text':
              chatMessages.push({ role: 'assistant', content: part.text });
              break;

            case 'inline_image':
              const { mimeType, base64 } = part;
              const base64DataUrl = `data:${mimeType};base64,${base64}`;
              const imageContentPart = OpenAIWire_ContentParts.ImageContentPart(base64DataUrl, hotFixForceImageContentPartOpenAIDetail);

              if (currentMessage?.role === 'user' && Array.isArray(currentMessage.content))
                currentMessage.content.push(imageContentPart);
              else
                chatMessages.push({ role: 'user', content: [imageContentPart] });
              break;

            case 'tool_invocation':
              const invocation = part.invocation;
              let toolCallPart;
              switch (invocation.type) {
                case 'function_call':
                  toolCallPart = OpenAIWire_ContentParts.PredictedFunctionCall(part.id, invocation.name, invocation.args || '');
                  break;
                case 'code_execution':
                  toolCallPart = OpenAIWire_ContentParts.PredictedFunctionCall(part.id, 'execute_code', invocation.code || '');
                  break;
                default:
                  throw new Error(`Unsupported tool call type in Model message: ${(part as any).pt}`);
              }

              if (currentMessage?.role === 'assistant') {
                if (!Array.isArray(currentMessage.tool_calls))
                  currentMessage.tool_calls = [toolCallPart];
                else
                  currentMessage.tool_calls.push(toolCallPart);
              } else
                chatMessages.push({ role: 'assistant', content: null, tool_calls: [toolCallPart] });
              break;

            case 'meta_cache_control':
              break;

            default:
              throw new Error(`Unsupported part type in Model message: ${(part as any).pt}`);
          }
        }
        break;

      case 'tool':
        for (const part of parts) {
          switch (part.pt) {
            case 'tool_response':
              const toolErrorPrefix = part.error ? (typeof part.error === 'string' ? `[ERROR] ${part.error} - ` : '[ERROR] ') : '';
              if (part.response.type === 'function_call' || part.response.type === 'code_execution')
                chatMessages.push(OpenAIWire_Messages.ToolMessage(part.id, toolErrorPrefix + part.response.result));
              else
                throw new Error(`Unsupported tool response type in Tool message: ${(part as any).pt}`);
              break;

            default:
              throw new Error(`Unsupported part type in Tool message: ${(part as any).pt}`);
          }
        }
        break;
    }
  }

  return chatMessages;
}

function _toOpenAITools(itds: AixTools_ToolDefinition[]): NonNullable<TRequest['tools']> {
  return itds.map(itd => {
    switch (itd.type) {
      case 'function_call':
        const { name, description, input_schema } = itd.function_call;
        return {
          type: 'function',
          function: {
            name: name,
            description: description,
            parameters: {
              type: 'object',
              properties: input_schema?.properties ?? {},
              required: input_schema?.required,
            },
          },
        };

      case 'code_execution':
        throw new Error('Gemini code interpreter is not supported');
    }
  });
}

function _toOpenAIToolChoice(openAIDialect: OpenAIDialects, itp: AixTools_ToolsPolicy): NonNullable<TRequest['tool_choice']> {
  if (openAIDialect === 'mistral' && itp.type !== 'auto') {
    throw new Error('We only support automatic tool selection for Mistral models');
  }

  switch (itp.type) {
    case 'auto':
      return 'auto';
    case 'any':
      return 'required';
    case 'function_call':
      return { type: 'function' as const, function: { name: itp.function_call.name } };
  }
}

function _toOpenAIInReferenceToText(irt: AixParts_MetaInReferenceToPart): string {
  const items = irt.referTo.map(r => r.mText);
  if (items.length === 0)
    return 'CONTEXT: The user provides no specific references.';

  const isShortItem = (text: string): boolean =>
    text.split('\n').length <= 3 && text.length <= 200;

  const formatItem = (text: string, index?: number): string => {
    if (isShortItem(text)) {
      const formatted = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
      return index !== undefined ? `${index + 1}. "${formatted}"` : `"${formatted}"`;
    }
    return `${index !== undefined ? `ITEM ${index + 1}:\n` : ''}---\n${text}\n---`;
  };

  if (items.length === 1)
    return `CONTEXT: The user is referring to this in particular:\n${formatItem(items[0])}`;

  const allShort = items.every(isShortItem);
  return `CONTEXT: The user is referring to these ${items.length} in particular:\n\n${
    items.map((text, index) => formatItem(text, index)).join(allShort ? '\n' : '\n\n')}`;
}
