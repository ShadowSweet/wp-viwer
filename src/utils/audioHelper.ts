import { OggOpusDecoder } from 'ogg-opus-decoder';
import { Attachment } from '../types/chat';

// Cache for converted playable URLs to prevent re-decoding
const playableUrlCache = new Map<string, string>();
const decodingPromises = new Map<string, Promise<string>>();

/**
 * Check if the current browser natively supports playing OGG Opus in an <audio> element
 */
export function canBrowserPlayOggOpus(): boolean {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return true;
  const a = new Audio();
  const canOgg = a.canPlayType('audio/ogg; codecs=opus');
  return canOgg === 'probably' || canOgg === 'maybe';
}

/**
 * Encodes Float32Array PCM channel buffers into a valid RIFF WAV Blob (16-bit PCM)
 */
export function pcmToWavBlob(channelData: Float32Array[], sampleRate: number): Blob {
  const numChannels = channelData.length;
  const numSamples = channelData[0].length;
  const byteLength = numSamples * numChannels * 2;
  const buffer = new ArrayBuffer(44 + byteLength);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + byteLength, true); // chunkSize
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // audioFormat (1 = PCM)
  view.setUint16(22, numChannels, true); // numChannels
  view.setUint32(24, sampleRate, true); // sampleRate
  view.setUint32(28, sampleRate * numChannels * 2, true); // byteRate
  view.setUint16(32, numChannels * 2, true); // blockAlign
  view.setUint16(34, 16, true); // bitsPerSample

  // data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, byteLength, true); // subchunk2Size

  // Write interleaved 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channelData[ch][i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Ensures an audio attachment has a URL that is 100% playable on the current device/browser.
 * If the browser (like Safari on iOS) cannot play Ogg/Opus natively, it decodes it to a WAV Blob URL.
 */
export async function getPlayableAudioUrl(attachment: Attachment): Promise<string> {
  // If already in cache
  if (playableUrlCache.has(attachment.url)) {
    return playableUrlCache.get(attachment.url)!;
  }

  const ext = (attachment.extension || '').toLowerCase();
  const isOpusOrOgg = ext === 'opus' || ext === 'ogg' || attachment.fileName.toLowerCase().endsWith('.opus') || attachment.fileName.toLowerCase().endsWith('.ogg');

  // If the browser can play it natively, use the original URL directly
  if (!isOpusOrOgg || canBrowserPlayOggOpus()) {
    return attachment.url;
  }

  // Deduplicate concurrent decode calls for the same file
  if (decodingPromises.has(attachment.url)) {
    return decodingPromises.get(attachment.url)!;
  }

  const decodePromise = (async () => {
    try {
      let arrayBuffer: ArrayBuffer;
      if (attachment.blob) {
        arrayBuffer = await attachment.blob.arrayBuffer();
      } else {
        const resp = await fetch(attachment.url);
        arrayBuffer = await resp.arrayBuffer();
      }

      const decoder = new OggOpusDecoder();
      await decoder.ready;
      const { channelData, sampleRate } = await decoder.decodeFile(new Uint8Array(arrayBuffer));
      await decoder.free();

      if (channelData && channelData.length > 0 && channelData[0].length > 0) {
        const wavBlob = pcmToWavBlob(channelData, sampleRate);
        const wavUrl = URL.createObjectURL(wavBlob);
        playableUrlCache.set(attachment.url, wavUrl);
        return wavUrl;
      }
    } catch (err) {
      console.warn('Fallback decode for audio failed:', err);
    }
    // Return original url if decoding failed
    return attachment.url;
  })();

  decodingPromises.set(attachment.url, decodePromise);

  try {
    const result = await decodePromise;
    return result;
  } finally {
    decodingPromises.delete(attachment.url);
  }
}
