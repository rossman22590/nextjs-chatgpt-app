// File: openai.responsesAPI.parser.ts

import { safeErrorString } from '~/server/wire';
import { serverSideId } from '~/server/trpc/trpc.nanoid';

import type { AixWire_Particles } from '../../../api/aix.wiretypes';
import type { ChatGenerateParseFunction } from '../chatGenerate.dispatch';
import type { IParticleTransmitter } from '../IParticleTransmitter';
import { IssueSymbols } from '../ChatGenerateTransmitter';

// Parser for non-streaming Responses API responses
export function createOpenAIResponsesAPIParserNS(): ChatGenerateParseFunction {
  const parserCreationTimestamp = Date.now();

  return function(pt: IParticleTransmitter, responseText: string) {
    try {
      // Parse the response
      const response = JSON.parse(responseText);
      
      console.log('Responses API response:', response);
      
      // Set model name if available
      if (response.model) {
        pt.setModelName(response.model);
      }
      
      // Extract the message content
      let messageContent = '';
      if (response.output && Array.isArray(response.output)) {
        for (const output of response.output) {
          if (output.type === 'message' && output.content && Array.isArray(output.content)) {
            for (const content of output.content) {
              if (content.type === 'output_text') {
                messageContent += content.text;
              }
            }
          }
        }
      }
      
      // Send the message content
      if (messageContent) {
        pt.appendText(messageContent);
      }
      
      // Add usage information if available
      if (response.usage) {
        const metrics: AixWire_Particles.CGSelectMetrics = {
          TIn: response.usage.input_tokens || 0,
          TOut: response.usage.output_tokens || 0,
          dtAll: Date.now() - parserCreationTimestamp,
        };
        
        // Add reasoning tokens if available
        if (response.usage.output_tokens_details?.reasoning_tokens) {
          metrics.TOutR = response.usage.output_tokens_details.reasoning_tokens;
        }
        
        pt.updateMetrics(metrics);
      }
      
      // Set token stop reason to 'ok' since we completed successfully
      pt.setTokenStopReason('ok');
      
    } catch (error) {
      console.error('Error parsing Responses API response:', error);
      pt.setDialectTerminatingIssue(safeErrorString(error) || 'unknown.', IssueSymbols.Generic);
    }
  };
}

// Parser for streaming Responses API responses
export function createOpenAIResponsesAPIChunkParser(): ChatGenerateParseFunction {
  const parserCreationTimestamp = Date.now();
  let hasBegun = false;
  let timeToFirstEvent: number | undefined;
  
  return function(pt: IParticleTransmitter, eventData: string) {
    try {
      // Time to first event
      if (!hasBegun && timeToFirstEvent === undefined) {
        timeToFirstEvent = Date.now() - parserCreationTimestamp;
      }
      
      // Parse the chunk
      const chunk = JSON.parse(eventData);
      
      console.log('Responses API chunk:', chunk);
      
      // Set model name if available and not set yet
      if (!hasBegun && chunk.model) {
        hasBegun = true;
        pt.setModelName(chunk.model);
      }
      
      // Handle different chunk types
      if (chunk.type === 'message_start') {
        // Message start, nothing to do
        console.log('Message start');
      } else if (chunk.type === 'message_delta') {
        // Message delta, extract the text
        if (chunk.delta && chunk.delta.content && Array.isArray(chunk.delta.content)) {
          for (const content of chunk.delta.content) {
            if (content.type === 'output_text') {
              pt.appendAutoText_weak(content.text);
              console.log('Text content:', content.text);
            }
          }
        }
      } else if (chunk.type === 'message_stop') {
        console.log('Message stop');
      } else if (chunk.type === 'response_completed') {
        // Response completed, update usage information
        if (chunk.usage) {
          const metrics: AixWire_Particles.CGSelectMetrics = {
            TIn: chunk.usage.input_tokens || 0,
            TOut: chunk.usage.output_tokens || 0,
            dtAll: Date.now() - parserCreationTimestamp,
          };
          
          if (timeToFirstEvent !== undefined) {
            metrics.dtStart = timeToFirstEvent;
          }
          
          // Add reasoning tokens if available
          if (chunk.usage.output_tokens_details?.reasoning_tokens) {
            metrics.TOutR = chunk.usage.output_tokens_details.reasoning_tokens;
          }
          
          pt.updateMetrics(metrics);
          console.log('Usage information:', chunk.usage);
        }
        
        // Set token stop reason to 'ok' since we completed successfully
        pt.setTokenStopReason('ok');
      }
      
    } catch (error) {
      console.error('Error parsing Responses API chunk:', error);
      pt.setDialectTerminatingIssue(safeErrorString(error) || 'unknown.', IssueSymbols.Generic);
    }
  };
}
