const axios = require('axios');
const FormData = require('form-data');
const { createClient } = require("@deepgram/sdk");
const fs = require('fs');
require('dotenv').config();

async function transcribeAudioWithOpenAI(filePath) {
  const formData = new FormData();
  const audioBuffer = fs.readFileSync(filePath);
  formData.append('file', audioBuffer, { filename: filePath });
  formData.append('model', process.env.WHISPER_MODEL || 'whisper-1');
  formData.append('response_format', 'json');
  formData.append('prompt', 'The transcript should have natural paragraph breaks and bullet points for any action steps. The output should be easy to read and follow.');

  const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
    headers: {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
  });

  console.log('Response from OpenAI:', response.data);

  return response.data;
}

async function transcribeAudioWithDeepgram(filePath) {
  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  const deepgram = createClient(deepgramApiKey);
  const audioBuffer = fs.readFileSync(filePath);

  try {
    const { result } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
      model: process.env.DEEPGRAM_MODEL || 'nova-2',
      language: 'de',
      smart_format: true,
      punctuate: true,
      paragraphs: true,
      utterances: true,
      diarize: true
    });

    if (
      !result ||
      !result.results ||
      !result.results.channels ||
      !result.results.channels.length ||
      !result.results.channels[0].alternatives ||
      !result.results.channels[0].alternatives.length ||
      !result.results.channels[0].alternatives[0].paragraphs ||
      !result.results.channels[0].alternatives[0].paragraphs.transcript
    ) {
      console.error('Error: Necessary structure missing from Deepgram response');
      return null;
    }

    const transcript = result.results.channels[0].alternatives[0].paragraphs.transcript;

    console.log("Directly accessed Transcript:", transcript);

    return transcript;
  } catch (error) {
    console.error("Error processing Deepgram transcription:", error);
    return null;
  }
}

async function transcribeAudio(filePath) {
  const VOICE_TRANSCRIPTION_SERVICE = process.env.VOICE_TRANSCRIPTION_SERVICE || 'OPENAI';

  if (VOICE_TRANSCRIPTION_SERVICE === 'OPENAI') {
    return transcribeAudioWithOpenAI(filePath);
  } else if (VOICE_TRANSCRIPTION_SERVICE === 'DEEPGRAM') {
    return transcribeAudioWithDeepgram(filePath);
  } else {
    throw new Error(`Unsupported voice transcription service: ${VOICE_TRANSCRIPTION_SERVICE}`);
  }
}

module.exports = { transcribeAudio };