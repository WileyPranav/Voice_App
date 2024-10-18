import Groq from "groq-sdk";

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Only use this for development/demo purposes
});

export async function transcribeAudio(audioBlob) {
  try {
    // Create a File object from the audioBlob
    const file = new File([audioBlob], "audio.wav", { type: "audio/wav" });

    // Create a translation job
    const transcriptions = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3-turbo",
      prompt: "Transcribe the following audio",
      response_format: "json",
      temperature: 0.0,
    });

    // Return the transcribed text
    return transcriptions.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return '';
  }
}
