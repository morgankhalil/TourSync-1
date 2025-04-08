
import { OpenAI } from 'openai';
import { Venue, Band } from '@/types';

export class AIRecommendationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async getVenueRecommendations(band: Band, venues: Venue[]): Promise<string> {
    const prompt = `Given this band: ${JSON.stringify(band)} 
                   And these venues: ${JSON.stringify(venues)}
                   Recommend the best venue matches and explain why.`;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    return completion.choices[0].message.content;
  }
}
