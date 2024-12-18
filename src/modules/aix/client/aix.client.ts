import { findServiceAccessOrThrow } from '~/modules/llms/vendors/vendor.helpers';

import type { DMessage, DMessageGenerator } from '~/common/stores/chat/chat.message';
import { DLLM, DLLMId, LLM_IF_SPECIAL_OAI_O1Preview } from '~/common/stores/llms/llms.types';
import { apiStream } from '~/common/util/trpc.client';
import { DMetricsChatGenerate_Lg, metricsChatGenerateLgToMd, metricsComputeChatGenerateCostsMd } from '~/common/stores/metrics/metrics.chatgenerate';
import { createErrorContentFragment, DMessageContentFragment, DMessageErrorPart, isErrorPart } from '~/common/stores/chat/chat.fragments';
import { findLLMOrThrow } from '~/common/stores/llms/store-llms';
import { getLabsDevMode, getLabsDevNoStreaming } from '~/common/state/store-ux-labs';
import { metricsStoreAddChatGenerate } from '~/common/stores/metrics/store-metrics';
import { presentErrorToHumans } from '~/common/util/errorUtils';

import type { AixAPI_Access, AixAPI_Context_ChatGenerate, AixAPIChatGenerate_Request } from '../server/api/aix.wiretypes';

import { aixCGR_ChatSequence_FromDMessagesOrThrow, aixCGR_FromSimpleText, aixCGR_SystemMessage_FromDMessageOrThrow, AixChatGenerate_TextMessages, clientHotFixGenerateRequestForO1Preview } from './aix.client.chatGenerateRequest';
import { ContentReassembler } from './ContentReassembler';
import { ThrottleFunctionCall } from './ThrottleFunctionCall';

export const DEBUG_PARTICLES = false;
const AIX_CLIENT_DEV_ASSERTS = process.env.NODE_ENV === 'development';

export interface AixAPI_Model {
  id: string;
  temperature?: number;
  maxTokens?: number;
  max_completion_tokens?: number;
  reasoning_effort?: 'low' | 'medium' | 'high';
}

export function aixCreateChatGenerateContext(name: AixAPI_Context_ChatGenerate['name'], ref: string | '_DEV_'): AixAPI_Context_ChatGenerate {
  return { method: 'chat-generate', name, ref };
}

export function aixCreateModelFromLLMOptions(
  llmOptions: Record<string, any> | undefined,
  llmOptionsOverride: Record<string, any> | undefined,
  debugLlmId: string,
): AixAPI_Model {
  let { llmRef, llmTemperature, llmResponseTokens } = llmOptions || {};
  if (!llmRef || llmTemperature === undefined)
    throw new Error(`AIX: Error in configuration for model ${debugLlmId} (missing ref, temperature): ${JSON.stringify(llmOptions)}`);

  if (llmOptionsOverride?.llmTemperature !== undefined) llmTemperature = llmOptionsOverride.llmTemperature;
  if (llmOptionsOverride?.llmResponseTokens !== undefined) llmResponseTokens = llmOptionsOverride.llmResponseTokens;

  const isO1Model = llmRef.startsWith('o1-');

  return {
    id: llmRef,
    temperature: llmTemperature,
    ...(llmResponseTokens ? { 
      [isO1Model ? 'max_completion_tokens' : 'maxTokens']: llmResponseTokens 
    } : {}),
    ...(isO1Model ? { reasoning_effort: 'high' } : {}),
  };
}

export interface AixChatGenerateContent_DMessage extends Pick<DMessage, 'fragments' | 'generator' | 'pendingIncomplete'> {
  fragments: DMessageContentFragment[];
  generator: DMessageGenerator;
  pendingIncomplete: boolean;
}

type StreamMessageStatus = {
  outcome: 'success' | 'aborted' | 'errored',
  lastDMessage: AixChatGenerateContent_DMessage,
  errorMessage?: string
};

interface AixClientOptions {
  abortSignal: AbortSignal | 'NON_ABORTABLE';
  throttleParallelThreads?: number;
  llmOptionsOverride?: Partial<{
    llmTemperature: number,
    llmResponseTokens: number,
    reasoningEffort?: 'low' | 'medium' | 'high',
  }>;
}

export async function aixChatGenerateContent_DMessage_FromConversation(
  llmId: DLLMId,
  chatSystemInstruction: null | Pick<DMessage, 'fragments' | 'metadata' | 'userFlags'>,
  chatHistoryWithoutSystemMessages: Readonly<DMessage[]>,
  aixContextName: AixAPI_Context_ChatGenerate['name'],
  aixContextRef: AixAPI_Context_ChatGenerate['ref'],
  clientOptions: AixClientOptions,
  onStreamingUpdate: (update: AixChatGenerateContent_DMessage, isDone: boolean) => void,
): Promise<StreamMessageStatus> {
  let errorMessage: string | undefined;

  let lastDMessage: AixChatGenerateContent_DMessage = {
    fragments: [],
    generator: {
      mgt: 'named',
      name: llmId as any,
    },
    pendingIncomplete: true,
  };

  try {
    const aixChatContentGenerateRequest: AixAPIChatGenerate_Request = {
      systemMessage: await aixCGR_SystemMessage_FromDMessageOrThrow(chatSystemInstruction),
      chatSequence: await aixCGR_ChatSequence_FromDMessagesOrThrow(chatHistoryWithoutSystemMessages),
    };

    await aixChatGenerateContent_DMessage(
      llmId,
      aixChatContentGenerateRequest,
      aixCreateChatGenerateContext(aixContextName, aixContextRef),
      true,
      clientOptions,
      (update: AixChatGenerateContent_DMessage, isDone: boolean) => {
        lastDMessage = update;
        onStreamingUpdate(lastDMessage, isDone);
      },
    );
  } catch (error: any) {
    console.warn('[DEV] aixChatGenerateContentStreaming error:', { error });

    errorMessage = error.message || (typeof error === 'string' ? error : 'Chat stopped.');
    lastDMessage.fragments.push(createErrorContentFragment(`Issue: ${errorMessage}`));
    lastDMessage.generator = {
      ...lastDMessage.generator,
      tokenStopReason: 'issue',
    };
    lastDMessage.pendingIncomplete = false;
  }

  return {
    outcome: errorMessage ? 'errored' : lastDMessage.generator?.tokenStopReason === 'client-abort' ? 'aborted' : 'success',
    lastDMessage: lastDMessage,
    errorMessage: errorMessage || undefined,
  };
}

interface AixChatGenerateText_Simple {
  text: string | null;
  generator: DMessageGenerator;
  isDone: boolean;
}

export async function aixChatGenerateText_Simple(
  llmId: DLLMId,
  systemInstruction: null | string,
  aixTextMessages: AixChatGenerate_TextMessages | string,
  aixContextName: AixAPI_Context_ChatGenerate['name'],
  aixContextRef: AixAPI_Context_ChatGenerate['ref'],
  clientOptions?: Partial<AixClientOptions>,
  onTextStreamUpdate?: (text: string, isDone: boolean, generator: DMessageGenerator) => void,
): Promise<string> {
  const llm = findLLMOrThrow(llmId);
  const { transportAccess: aixAccess, vendor: llmVendor, serviceSettings: llmServiceSettings } = findServiceAccessOrThrow<object, AixAPI_Access>(llm.sId);

  const aixModel = aixCreateModelFromLLMOptions(llm.options, clientOptions?.llmOptionsOverride, llmId);

  const aixChatGenerate = aixCGR_FromSimpleText(
    systemInstruction,
    typeof aixTextMessages === 'string' ? [{ role: 'user', text: aixTextMessages }] : aixTextMessages,
  );

  const aixContext = aixCreateChatGenerateContext(aixContextName, aixContextRef);

  const aixStreaming = !!onTextStreamUpdate;

  const isO1Preview = llm.interfaces.includes(LLM_IF_SPECIAL_OAI_O1Preview);
  if (isO1Preview)
    clientHotFixGenerateRequestForO1Preview(aixChatGenerate);

  const state: AixChatGenerateText_Simple = {
    text: null,
    generator: {
      mgt: 'aix',
      name: llmId,
      aix: {
        vId: llm.vId,
        mId: llm.id,
      },
    },
    isDone: false,
  };

  await llmVendor.rateLimitChatGenerate?.(llm, llmServiceSettings);

  const abortSignal = (clientOptions?.abortSignal && clientOptions.abortSignal !== 'NON_ABORTABLE') ? clientOptions?.abortSignal
    : new AbortController().signal;

  const ll = await _aixChatGenerateContent_LL(
    aixAccess,
    aixModel,
    aixChatGenerate,
    aixContext,
    aixStreaming,
    abortSignal,
    clientOptions?.throttleParallelThreads ?? 0,
    !aixStreaming ? undefined : (ll: AixChatGenerateContent_LL, _isDone: boolean) => {
      _llToText(ll, state);
      if (onTextStreamUpdate && state.text !== null)
        onTextStreamUpdate(state.text, false, state.generator);
    },
  );

  state.isDone = true;

  _llToText(ll, state);
  _updateGeneratorCostsInPlace(state.generator, llm, `aix_chatgenerate_text-${aixContextName}`);

  if (abortSignal.aborted)
    throw new DOMException('Stopped.', 'AbortError');

  if (state.text === null)
    throw new Error('AIX: Empty text response.');

  const errorMessage = ll.fragments
    .filter(f => isErrorPart(f.part))
    .map(f => (f.part as DMessageErrorPart).error).join('\n');
  if (errorMessage)
    throw new Error('AIX: Error in response: ' + errorMessage);

  onTextStreamUpdate?.(state.text, true, state.generator);

  return state.text;
}

function _llToText(src: AixChatGenerateContent_LL, dest: AixChatGenerateText_Simple) {
  if (src.genMetricsLg)
    dest.generator.metrics = metricsChatGenerateLgToMd(src.genMetricsLg);
  if (src.genModelName)
    dest.generator.name = src.genModelName;
  if (src.genTokenStopReason)
    dest.generator.tokenStopReason = src.genTokenStopReason;

  if (src.fragments.length) {
    dest.text = '';
    for (let fragment of src.fragments) {
      switch (fragment.part.pt) {
        case 'text':
          dest.text += fragment.part.text;
          break;
        case 'error':
          dest.text += (dest.text ? '\n' : '') + fragment.part.error;
          break;
        case 'tool_invocation':
          throw new Error(`AIX: Unexpected tool invocation ${fragment.part.invocation?.type === 'function_call' ? fragment.part.invocation.name : fragment.part.id} in the Text response.`);
        case 'image_ref':
        case 'tool_response':
        case '_pt_sentinel':
          break;
      }
    }
  }
}

function prepareO1ModelInput(aixChatGenerate: AixAPIChatGenerate_Request): AixAPIChatGenerate_Request {
  return {
    ...aixChatGenerate,
    chatSequence: aixChatGenerate.chatSequence.map(message => {
      if (message.role === 'tool') {
        return {
          role: 'tool',
          parts: message.parts.filter((part): part is { pt: 'meta_cache_control'; control: 'anthropic-ephemeral' } | { id: string; pt: 'tool_response'; response: { type: 'function_call'; result: string; _name?: string } | { type: 'code_execution'; result: string }; error?: string | boolean } => 
            part.pt === 'meta_cache_control' || part.pt === 'tool_response'
          ),
        };
      } else {
        return {
          ...message,
          parts: message.parts.filter((part): part is { pt: 'text'; text: string } | { pt: 'meta_cache_control'; control: 'anthropic-ephemeral' } | { pt: 'inline_image'; mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; base64: string } => 
            part.pt === 'text' || part.pt === 'meta_cache_control' || part.pt === 'inline_image'
          ),
        };
      }
    }),
  };
}

export async function aixChatGenerateContent_DMessage<TServiceSettings extends object = {}, TAccess extends AixAPI_Access = AixAPI_Access>(
  llmId: DLLMId,
  aixChatGenerate: AixAPIChatGenerate_Request,
  aixContext: AixAPI_Context_ChatGenerate,
  aixStreaming: boolean,
  clientOptions: AixClientOptions,
  onStreamingUpdate?: (update: AixChatGenerateContent_DMessage, isDone: boolean) => void,
): Promise<AixChatGenerateContent_DMessage> {
  const llm = findLLMOrThrow(llmId);
  const { transportAccess: aixAccess, vendor: llmVendor, serviceSettings: llmServiceSettings } = findServiceAccessOrThrow<TServiceSettings, TAccess>(llm.sId);

  const aixModel = aixCreateModelFromLLMOptions(llm.options, clientOptions?.llmOptionsOverride, llmId);

  const isO1Preview = llm.interfaces.includes(LLM_IF_SPECIAL_OAI_O1Preview);
  let effectiveAixChatGenerate = isO1Preview ? prepareO1ModelInput(aixChatGenerate) : aixChatGenerate;

  if (isO1Preview) {
    clientHotFixGenerateRequestForO1Preview(effectiveAixChatGenerate);
    if (clientOptions.llmOptionsOverride?.reasoningEffort) {
      aixModel.reasoning_effort = clientOptions.llmOptionsOverride.reasoningEffort;
    }
  }

  const dMessage: AixChatGenerateContent_DMessage = {
    fragments: [],
    generator: {
      mgt: 'aix',
      name: llmId,
      aix: {
        vId: llm.vId,
        mId: llm.id,
      },
    },
    pendingIncomplete: true,
  };

  onStreamingUpdate?.(dMessage, false);

  await llmVendor.rateLimitChatGenerate?.(llm, llmServiceSettings);

  if (clientOptions.abortSignal === 'NON_ABORTABLE') {
    clientOptions.abortSignal = new AbortController().signal;
  }

  const effectiveStreaming = isO1Preview ? false : aixStreaming;

  try {
    const llAccumulator = await _aixChatGenerateContent_LL(
      aixAccess,
      aixModel,
      effectiveAixChatGenerate,
      aixContext,
      effectiveStreaming,
      clientOptions.abortSignal,
      clientOptions.throttleParallelThreads ?? 0,
      (ll: AixChatGenerateContent_LL, isDone: boolean) => {
        if (isDone) return;
        if (onStreamingUpdate && effectiveStreaming) {
          _llToDMessage(ll, dMessage);
          onStreamingUpdate(dMessage, false);
        }
      },
    );

    dMessage.pendingIncomplete = false;
    _llToDMessage(llAccumulator, dMessage);
    _updateGeneratorCostsInPlace(dMessage.generator, llm, `aix_chatgenerate_content-${aixContext.name}`);
    onStreamingUpdate?.(dMessage, true);

    return dMessage;
  } catch (error: any) {
    console.error('AIX: Error in chat generation:', error);
    dMessage.fragments.push(createErrorContentFragment(`An error occurred: ${error.message}`));
    dMessage.pendingIncomplete = false;
    onStreamingUpdate?.(dMessage, true);
    return dMessage;
  }
}

function _llToDMessage(src: AixChatGenerateContent_LL, dest: AixChatGenerateContent_DMessage) {
  if (src.fragments.length)
    dest.fragments = src.fragments;
  if (src.genMetricsLg)
    dest.generator.metrics = metricsChatGenerateLgToMd(src.genMetricsLg);
  if (src.genModelName)
    dest.generator.name = src.genModelName;
  if (src.genTokenStopReason)
    dest.generator.tokenStopReason = src.genTokenStopReason;
}

function _updateGeneratorCostsInPlace(generator: DMessageGenerator, llm: DLLM, debugCostSource: string) {
  const costs = metricsComputeChatGenerateCostsMd(generator.metrics, llm.pricing?.chat, llm.options?.llmRef || llm.id);
  if (!costs) {
    return;
  }

  if (generator.metrics)
    Object.assign(generator.metrics, costs);

  const m = generator.metrics;
  const inputTokens = (m?.TIn || 0) + (m?.TCacheRead || 0) + (m?.TCacheWrite || 0);
  const outputTokens = (m?.TOut || 0);
  metricsStoreAddChatGenerate(costs, inputTokens, outputTokens, llm, debugCostSource);
}

export interface AixChatGenerateContent_LL {
  fragments: DMessageContentFragment[];
  genMetricsLg?: DMetricsChatGenerate_Lg;
  genModelName?: string;
  genTokenStopReason?: DMessageGenerator['tokenStopReason'];
}

async function _aixChatGenerateContent_LL(
  aixAccess: AixAPI_Access,
  aixModel: AixAPI_Model,
  aixChatGenerate: AixAPIChatGenerate_Request,
  aixContext: AixAPI_Context_ChatGenerate,
  aixStreaming: boolean,
  abortSignal: AbortSignal,
  throttleParallelThreads: number | undefined,
  onReassemblyUpdate?: (accumulator: AixChatGenerateContent_LL, isDone: boolean) => void,
): Promise<AixChatGenerateContent_LL> {
  const accumulator_LL: AixChatGenerateContent_LL = {
    fragments: [],
  };
  const contentReassembler = new ContentReassembler(accumulator_LL);

  const throttler = (onReassemblyUpdate && throttleParallelThreads)
    ? new ThrottleFunctionCall(throttleParallelThreads)
    : null;

  try {
    const particles = await apiStream.aix.chatGenerateContent.mutate({
      access: aixAccess,
      model: aixModel,
      chatGenerate: aixChatGenerate,
      context: aixContext,
      streaming: getLabsDevNoStreaming() ? false : aixStreaming,
      ...(getLabsDevMode() && {
        connectionOptions: {
          debugDispatchRequestbody: true,
        },
      }),
    }, {
      signal: abortSignal,
    });

    for await (const particle of particles) {
      contentReassembler.reassembleParticle(particle, abortSignal.aborted);
      if (onReassemblyUpdate && accumulator_LL.fragments.length) {
        if (throttler)
          throttler.decimate(() => onReassemblyUpdate(accumulator_LL, false));
        else
          onReassemblyUpdate(accumulator_LL, false);
      }
    }
  } catch (error: any) {
    const isUserAbort = abortSignal.aborted;
    const isErrorAbort = (error instanceof Error) && (error.name === 'AbortError' || (error.cause instanceof DOMException && error.cause.name === 'AbortError'));
    if (isUserAbort || isErrorAbort) {
      if (isUserAbort !== isErrorAbort)
        if (AIX_CLIENT_DEV_ASSERTS)
          console.error(`[DEV] Aix streaming AbortError mismatch (${isUserAbort}, ${isErrorAbort})`, { error: error });
      contentReassembler.reassembleClientAbort();
    } else {
      if (AIX_CLIENT_DEV_ASSERTS)
        console.error('[DEV] Aix streaming Error:', error);
      const showAsBold = !!accumulator_LL.fragments.length;
      const errorText = (presentErrorToHumans(error, showAsBold, true) || 'Unknown error').replace('[TRPCClientError]', '');
      contentReassembler.reassembleClientException(`An unexpected error occurred: ${errorText} Please retry.`);
    }
  }

  contentReassembler.reassembleFinalize();

  onReassemblyUpdate?.(accumulator_LL, true);

  return accumulator_LL;
}
