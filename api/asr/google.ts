import { NextApiRequest, NextApiResponse } from 'next';

// Placeholder ASR endpoint — wire to Google STT if needed.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // For now, return empty result; we can hook Google STT (Speech-to-Text) later
    return res.status(200).json({ text: '' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'ASR failed' });
  }
}


