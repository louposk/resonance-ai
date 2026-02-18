import axios from 'axios';
import { Song } from '../types';

export class AIService {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseURL = 'https://api.openai.com/v1';
  }

  async analyzeSong(song: Song): Promise<{
    meaning: string;
    writingProcess: string;
    trivia: string;
    themes: string[];
  }> {
    const prompt = this.buildAnalysisPrompt(song);

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a music expert and cultural historian with deep knowledge of song meanings,
                       songwriting processes, and music trivia. Provide comprehensive, accurate analysis
                       of songs with historical context and cultural significance. Always respond in JSON format.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const choices = response.data.choices;
      if (!choices || choices.length === 0) {
        throw new Error('No AI response received');
      }

      const content = choices[0].message.content;
      let analysis;

      try {
        analysis = JSON.parse(content);
      } catch (parseError) {
        throw new Error('Failed to parse AI response');
      }

      return {
        meaning: analysis.meaning || 'Analysis not available',
        writingProcess: analysis.writingProcess || 'Writing process information not available',
        trivia: analysis.trivia || 'No trivia available',
        themes: Array.isArray(analysis.themes) ? analysis.themes : []
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('OpenAI API authentication failed');
      }
      if (error.response?.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      }
      if (error.response?.status === 403) {
        throw new Error('OpenAI API access forbidden');
      }
      throw error;
    }
  }

  async generateSummary(analysis: {
    meaning: string;
    writingProcess: string;
    trivia: string;
    themes: string[];
  }): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Create a concise summary (100-150 words) highlighting the key points from the song analysis.'
            },
            {
              role: 'user',
              content: `Create a summary from this song analysis:
                Meaning: ${analysis.meaning}
                Writing Process: ${analysis.writingProcess}
                Trivia: ${analysis.trivia}
                Themes: ${analysis.themes.join(', ')}`
            }
          ],
          temperature: 0.5,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0]?.message?.content || 'Summary not available';
    } catch (error) {
      throw error;
    }
  }

  private buildAnalysisPrompt(song: Song): string {
    let prompt = `Analyze the song "${song.title}" by ${song.artist}`;

    if (song.album) {
      prompt += ` from the album "${song.album}"`;
    }

    if (song.releaseYear) {
      prompt += ` released in ${song.releaseYear}`;
    }

    prompt += `.

Please provide a comprehensive analysis in the following JSON format:
{
  "meaning": "Detailed explanation of the song's meaning, themes, and what the lyrics represent",
  "writingProcess": "Information about how the song was written, who wrote it, inspiration, collaboration details, and the creative process",
  "trivia": "Interesting facts, hidden details, chart performance, cultural impact, recording details, and lesser-known information",
  "themes": ["array", "of", "main", "themes", "covered", "in", "the", "song"]
}

Focus on:
- Lyrical analysis and deeper meaning
- Historical context and cultural significance
- Songwriting credits and creation story
- Recording details and production notes
- Chart performance and commercial success
- Cultural impact and legacy
- Interesting anecdotes and trivia
- Main themes and messages

Ensure all information is accurate and well-researched. If specific details are unknown, indicate this rather than speculating.`;

    return prompt;
  }

  async enhanceAnalysis(existingAnalysis: {
    meaning: string;
    writingProcess: string;
    trivia: string;
    themes: string[];
  }, additionalContext?: string): Promise<{
    meaning: string;
    writingProcess: string;
    trivia: string;
    themes: string[];
  }> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Enhance and expand the existing song analysis with additional insights and details.'
            },
            {
              role: 'user',
              content: `Enhance this song analysis with more details and insights:

                Current Analysis:
                Meaning: ${existingAnalysis.meaning}
                Writing Process: ${existingAnalysis.writingProcess}
                Trivia: ${existingAnalysis.trivia}
                Themes: ${existingAnalysis.themes.join(', ')}

                ${additionalContext ? `Additional Context: ${additionalContext}` : ''}

                Please return enhanced analysis in the same JSON format with more comprehensive information.`
            }
          ],
          temperature: 0.7,
          max_tokens: 2500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        return existingAnalysis;
      }

      try {
        const enhanced = JSON.parse(content);
        return {
          meaning: enhanced.meaning || existingAnalysis.meaning,
          writingProcess: enhanced.writingProcess || existingAnalysis.writingProcess,
          trivia: enhanced.trivia || existingAnalysis.trivia,
          themes: Array.isArray(enhanced.themes) ? enhanced.themes : existingAnalysis.themes
        };
      } catch {
        return existingAnalysis;
      }
    } catch (error) {
      return existingAnalysis;
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}