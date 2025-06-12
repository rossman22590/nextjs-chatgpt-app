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
      console.log('=== RESPONSES API PARSER START ===');
      console.log('Raw response text length:', responseText.length);
      console.log('Raw response text preview:', responseText.substring(0, 200));
      
      // Parse the response
      const response = JSON.parse(responseText);
      
      console.log('Parsed response keys:', Object.keys(response));
      console.log('Response model:', response.model);
      console.log('Response output length:', response.output?.length);
      
      // Set model name if available
      if (response.model) {
        pt.setModelName(response.model);
        console.log('Set model name:', response.model);
      }
      
      // Extract the message content from the output array
      let messageContent = '';
      if (response.output && Array.isArray(response.output)) {
        console.log('Processing output array with', response.output.length, 'items');
        
        for (let i = 0; i < response.output.length; i++) {
          const output = response.output[i];
          console.log(`Output[${i}] type:`, output.type);
          
          if (output.type === 'message' && output.content && Array.isArray(output.content)) {
            console.log(`Found message with ${output.content.length} content items`);
            
            for (let j = 0; j < output.content.length; j++) {
              const content = output.content[j];
              console.log(`Content[${j}] type:`, content.type, 'has text:', !!content.text);
              
              if (content.type === 'output_text' && content.text) {
                messageContent += content.text;
                console.log('Added text content, total length now:', messageContent.length);
              }
            }
          }
        }
      } else {
        console.log('No output array found or not an array');
      }
      
      console.log('Final message content length:', messageContent.length);
      console.log('Final message content preview:', messageContent.substring(0, 100));
      
      // Send the message content
      if (messageContent) {
        pt.appendText(messageContent);
        console.log('Successfully appended text to transmitter');
      } else {
        console.log('ERROR: No message content found to append!');
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
        console.log('Updated metrics:', metrics);
      }
      
      // Set token stop reason to 'ok' since we completed successfully
      pt.setTokenStopReason('ok');
      console.log('Set token stop reason to ok');
      
      console.log('=== RESPONSES API PARSER END ===');
      
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
            if (content.type === 'output_text' && content.text) {
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