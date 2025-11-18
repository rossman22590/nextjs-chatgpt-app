import * as z from 'zod/v4';

import { getImageInformationFromBytes } from '~/modules/t2i/t2i.server';

import type { YouTubeVideoData } from './youtube.types';


/// THIS IS NORMALLY SERVER-SIDE CODE - do not include/invoke in the frontend ///


function extractFromTo(html: string, from: string, to: string, label: string): string {
  const indexStart = html.indexOf(from);
  const indexEnd = html.indexOf(to, indexStart);
  if (indexStart < 0 || indexEnd <= indexStart)
    throw new Error(`[YouTube API Issue] Could not find '${label}'`);
  return html.substring(indexStart, indexEnd);
}


function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': '\'',
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
  };
  return text.replace(/&(?:#x?[0-9a-f]+|[a-z]+);/gi, (match) =>
    entities[match] || match,
  );
}

export async function downloadYouTubeVideoData(videoId: string, fetchTextFn: (url: string) => Promise<string>): Promise<YouTubeVideoData> {

  // 1. find the captions URL within the video HTML page
  const html = await fetchTextFn(`https://www.youtube.com/watch?v=${videoId}`);

  // Robustly extract captions base URL
  let captionsUrl: string | null = null;
  try {
    // Preferred: parse ytInitialPlayerResponse JSON and read captionTracks[0].baseUrl
    const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]*?\});/);
    if (m && m[1]) {
      const pr = JSON.parse(m[1]);
      const tracks = pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length) captionsUrl = tracks[0]?.baseUrl || null;
    }
  } catch {
    // ignore and fallback
  }
  if (!captionsUrl) {
    // Fallback: legacy substring extraction
    try {
      const captionsUrlEnc = extractFromTo(html, 'https://www.youtube.com/api/timedtext', '"', 'Captions URL');
      captionsUrl = decodeURIComponent(captionsUrlEnc.replaceAll('\\u0026', '&'));
    } catch {
      captionsUrl = null;
    }
  }

  // Basic metadata (best-effort)
  let thumbnailUrl = 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
  try {
    thumbnailUrl = extractFromTo(html, 'https://i.ytimg.com/vi/', '"', 'Thumbnail URL').replaceAll('maxres', 'hq');
  } catch {}
  let videoTitle = 'YouTube Video';
  try {
    videoTitle = decodeHtmlEntities(extractFromTo(html, '<title>', '</title>', 'Video Title').slice(7).replaceAll(' - YouTube', '').trim());
  } catch {}
  let videoDescription = '';
  try {
    videoDescription = extractFromTo(html, ',"shortDescription":"', '","', 'Video Description').slice(21);
  } catch {}

  // 2. fetch the captions
  // note: the desktop player appends this much: &fmt=json3&xorb=2&xobt=3&xovt=3&cbr=Chrome&cbrver=114.0.0.0&c=WEB&cver=2.20230628.07.00&cplayer=UNIPLAYER&cos=Windows&cosver=10.0&cplatform=DESKTOP
  if (!captionsUrl)
    throw new Error('[YouTube API Issue] Could not find captions');
  const tryParseTranscript = (body: string): string | null => {
    // JSON (srv3)
    try {
      const json: any = JSON.parse(body);
      const events: any[] | undefined = Array.isArray(json?.events) ? json.events : undefined;
      if (events && events.length)
        return events.flatMap(ev => ev.segs ?? []).map((s: any) => s.utf8).join('');
    } catch {}
    // XML timedtext
    const texts = Array.from(body.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/gi)).map(m => m[1]);
    if (texts.length) {
      return texts
        .map(t => decodeHtmlEntities(t.replace(/\n/g, ' ').replace(/<[^>]+>/g, '')))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    // VTT
    if (/^WEBVTT/m.test(body)) {
      const lines = body.split(/\r?\n/);
      const text = lines.filter(l => !/^\d+$/.test(l) && !/-->/.test(l) && !/^WEBVTT/.test(l) && l.trim().length)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) return text;
    }
    return null;
  };

  // Try multiple formats to maximize success
  const fmtVariants = captionsUrl.includes('fmt=') ? [''] : ['&fmt=srv3', '&fmt=json3', '&fmt=vtt', '&fmt=srv2', '&fmt=srv1'];
  let transcript: string | null = null;
  for (const suffix of fmtVariants) {
    const url = suffix ? captionsUrl + suffix : captionsUrl;
    try {
      const body = await fetchTextFn(url);
      transcript = tryParseTranscript(body);
      if (transcript) break;
    } catch {
      // try next
    }
  }
  if (!transcript)
    throw new Error('[YouTube API Issue] Could not parse the captions');

  // 4. fetch and process the thumbnail image
  let thumbnailImage: YouTubeVideoData['thumbnailImage'] = null;
  try {
    thumbnailImage = await _downloadAndConvertThumbnail(thumbnailUrl);
  } catch (error) {
    console.error('Error fetching or processing thumbnail:', error);
  }

  return {
    videoId,
    videoTitle,
    videoDescription,
    thumbnailUrl,
    thumbnailImage,
    transcript,
  };
}


async function _downloadAndConvertThumbnail(url: string): Promise<YouTubeVideoData['thumbnailImage']> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch thumbnail: HTTP ${response.status}`);
      return null;
    }
    // get low-level image information
    const imageBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imgInfo = getImageInformationFromBytes(imageBuffer);
    // return the image dataurl and its information
    return {
      mimeType: imgInfo.mimeType,
      imgDataUrl: `data:${imgInfo.mimeType};base64,${base64Image}`,
      width: imgInfo.width,
      height: imgInfo.height,
    };
  } catch (error) {
    console.error('Error downloading or processing thumbnail:', error);
    return null;
  }
}
