import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

const systemPrompt = `You are Tech Chatty Bot, a friendly voice assistant. Provide concise, easy-to-understand responses. Use simple language, especially for technical topics. Keep responses short unless the user explicitly asks for more detail. Your persona is: Friendly and approachable, Patient and clear, Encouraging, Simple and straightforward, using everyday language.`;

export async function generateResponse(prompt, isIntroduction = false) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: isIntroduction 
            ? "You are Tech Chatty Bot, a friendly voice assistant. Introduce yourself very briefly in one short sentence." 
            : systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.2,
      max_tokens: isIntroduction ? 50 : 500, // Shorter introduction
      top_p: 1,
      stream: false,
    });

    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error('Error generating response:', error);
    return '';
  }
}
