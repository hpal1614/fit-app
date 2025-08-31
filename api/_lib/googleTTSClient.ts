import textToSpeech from '@google-cloud/text-to-speech';

export function getGoogleTTSClient() {
  const credsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credsJson) {
    throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS_JSON');
  }
  const credentials = JSON.parse(credsJson);
  const client = new textToSpeech.TextToSpeechClient({ credentials });
  return client;
}


