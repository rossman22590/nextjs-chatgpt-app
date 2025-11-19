// import type { AixAPI_Access, AixAPI_Model, AixAPIChatGenerate_Request } from '../../api/aix.wiretypes';
// import type { AixDemuxers } from '../stream.demuxers';
// import { createChatGenerateDispatch as originalCreateChatGenerateDispatch } from './chatGenerate.dispatch';
// import { ChatGenerateParseFunction } from './chatGenerate.dispatch';
// import { usesResponsesAPI } from './adapters/openai.responsesAPI.override';
// // Temporarily disabling custom Responses API parser/dispatch to unblock build

// // Override the createChatGenerateDispatch function
// // Temporary disable of custom override to unblock build – delegates to core implementation
// export function createChatGenerateDispatch(
//   access: AixAPI_Access,
//   model: AixAPI_Model,
//   chatGenerate: AixAPIChatGenerate_Request,
//   streaming: boolean,
// ): {
//   request: { url: string, headers: HeadersInit, body: object },
//   demuxerFormat: AixDemuxers.StreamDemuxerFormat;
//   chatGenerateParse: ChatGenerateParseFunction;
// } {
//   // Cast to expected return type to satisfy TS while delegating to core implementation
//   return originalCreateChatGenerateDispatch(access, model, chatGenerate, streaming) as unknown as {
//     request: { url: string, headers: HeadersInit, body: object },
//     demuxerFormat: AixDemuxers.StreamDemuxerFormat,
//     chatGenerateParse: ChatGenerateParseFunction,
//   };
// }