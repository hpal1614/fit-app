import { NextApiRequest, NextApiResponse } from 'next';
import { getGoogleTTSClient } from '../_lib/googleTTSClient';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { text, voice = 'en-AU-WilliamNeural', rate = 1.05, pitch = 1.05 } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text' });
    }
    const client = getGoogleTTSClient();

    const request: any = {
      input: { text },
      // Try Aussie male voice; fallback handled by Google
      voice: {
        languageCode: 'en-AU',
        name: 'en-AU-Wavenet-D' // Male; adjust if you prefer
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: rate,
        pitch
      }
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent as Buffer | Uint8Array | string;
    const buf = Buffer.isBuffer(audioContent) ? audioContent : Buffer.from(audioContent as any);
    // Simple data URL to avoid file IO
    const audioUrl = `data:audio/mpeg;base64,${buf.toString('base64')}`;
    return res.status(200).json({ audioUrl });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'TTS failed' });
  }
}


