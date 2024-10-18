const DEEPGRAM_URL = "https://api.deepgram.com/v1/speak?model=aura-asteria-en";

export async function synthesizeSpeech(text) {
  try {
    const payload = JSON.stringify({ text });

    const response = await fetch(DEEPGRAM_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REACT_APP_DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    return null;
  }
}
