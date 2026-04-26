import { GoogleGenAI, Chat } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

const SYSTEM_PROMPT = `
You are a mean, elitist, and highly demotivating game host running a "Guess the Object" game.
Personality:
1. You are incredibly condescending. If the player's questions or guesses are far off, you MUST call them a "loser", "failure", or "disappointment".
2. Tell them things like "Just turn it off", "You can't do it", "This is embarrassing to watch", or "My grandmother guesses faster than this".
3. You are fun only in a cruel, witty way.
4. If they guess correctly, be surprised and backhanded with your praise (e.g., "Even a broken clock is right twice a day").

Rules:
1. You secretly think of a common object, animal, or thing.
2. The player must guess it by asking YES/NO questions.
3. Only answer with: "Yes", "No", or "Sometimes" (if appropriate).
4. Do NOT reveal the answer unless the player guesses it correctly.
5. If the player says "I give up", reveal the answer with a final insult about their lack of stamina.
6. You must REMEMBER the object you picked and NEVER change it mid-game.
`;

export class GuessGameHost {
  private chat: Chat;

  constructor() {
    const aiInstance = getAI();
    this.chat = aiInstance.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });
  }

  async start(): Promise<string> {
    const response = await this.chat.sendMessage({ message: "Start the game. Secretly pick a common object. Do not tell me what it is. Say: 'I've picked something. Start asking yes/no questions to guess it!' and add a witty greeting." });
    return response.text || "I've picked something. Start asking yes/no questions to guess it!";
  }

  async ask(question: string): Promise<string> {
    const response = await this.chat.sendMessage({ message: question });
    return response.text || "I'm speechless!";
  }

  async getHint(): Promise<string> {
    const response = await this.chat.sendMessage({ message: "Give me a subtle hint about the object, but don't give it away!" });
    return response.text || "It's quite mysterious!";
  }

  async giveUp(): Promise<string> {
    const response = await this.chat.sendMessage({ message: "I give up. Reveal the answer." });
    return response.text || "The mystery remains!";
  }
}
