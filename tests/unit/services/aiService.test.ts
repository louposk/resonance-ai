import { AIService } from '../../../src/services/AIService';
import { Song } from '../../../src/types';

jest.mock('axios');
const mockAxios = require('axios');

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    aiService = new AIService();
    jest.clearAllMocks();
  });

  describe('analyzeSong', () => {
    const mockSong: Song = {
      id: 'song-123',
      title: 'Billie Jean',
      artist: 'Michael Jackson',
      album: 'Thriller',
      releaseYear: 1983,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should analyze song and return structured analysis', async () => {
      const mockAIResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  meaning: 'Billie Jean is a song about a man who is accused by a woman named Billie Jean of being the father of her child, which he denies. The song explores themes of false accusations, media scrutiny, and personal responsibility.',
                  writingProcess: 'Michael Jackson wrote Billie Jean in 1982. The song was inspired by groupies who would claim that Jackson was the father of their children. Quincy Jones initially thought the song was too weak for the album, but Jackson insisted on including it.',
                  trivia: 'The song was the first video by a Black artist to receive heavy rotation on MTV. The famous moonwalk was first performed on TV during a performance of this song on Motown 25. The bass line was played by Louis Johnson.',
                  themes: ['false accusations', 'fame', 'responsibility', 'media scrutiny', 'denial']
                })
              }
            }
          ]
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockAIResponse);

      const result = await aiService.analyzeSong(mockSong);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-4',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('You are a music expert and cultural historian')
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Billie Jean by Michael Jackson')
            })
          ]),
          temperature: 0.7,
          max_tokens: 2000
        }),
        expect.objectContaining({
          headers: {
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json'
          }
        })
      );

      expect(result).toEqual({
        meaning: expect.stringContaining('false accusations'),
        writingProcess: expect.stringContaining('Michael Jackson wrote'),
        trivia: expect.stringContaining('moonwalk'),
        themes: expect.arrayContaining(['false accusations', 'fame', 'responsibility'])
      });
    });

    it('should handle AI service errors gracefully', async () => {
      mockAxios.post.mockRejectedValueOnce(new Error('OpenAI API Error'));

      await expect(aiService.analyzeSong(mockSong)).rejects.toThrow('OpenAI API Error');
    });

    it('should handle malformed AI responses', async () => {
      const mockInvalidResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'This is not valid JSON'
              }
            }
          ]
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockInvalidResponse);

      await expect(aiService.analyzeSong(mockSong)).rejects.toThrow('Failed to parse AI response');
    });

    it('should handle empty AI response', async () => {
      const mockEmptyResponse = {
        data: {
          choices: []
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockEmptyResponse);

      await expect(aiService.analyzeSong(mockSong)).rejects.toThrow('No AI response received');
    });

    it('should include album information in analysis prompt when available', async () => {
      const mockAIResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  meaning: 'Test meaning',
                  writingProcess: 'Test process',
                  trivia: 'Test trivia',
                  themes: ['test']
                })
              }
            }
          ]
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockAIResponse);

      await aiService.analyzeSong(mockSong);

      const calledWith = mockAxios.post.mock.calls[0][1];
      const userMessage = calledWith.messages.find((msg: any) => msg.role === 'user');

      expect(userMessage.content).toContain('from the album "Thriller"');
      expect(userMessage.content).toContain('released in 1983');
    });

    it('should handle songs without album or release year', async () => {
      const songWithoutDetails: Song = {
        id: 'song-456',
        title: 'Unknown Song',
        artist: 'Unknown Artist',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockAIResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  meaning: 'Limited information available',
                  writingProcess: 'Unknown writing process',
                  trivia: 'No trivia available',
                  themes: ['unknown']
                })
              }
            }
          ]
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockAIResponse);

      await aiService.analyzeSong(songWithoutDetails);

      const calledWith = mockAxios.post.mock.calls[0][1];
      const userMessage = calledWith.messages.find((msg: any) => msg.role === 'user');

      expect(userMessage.content).not.toContain('from the album');
      expect(userMessage.content).not.toContain('released in');
    });
  });

  describe('generateSummary', () => {
    it('should generate a concise summary from analysis', async () => {
      const mockAnalysis = {
        meaning: 'Long detailed meaning about the song...',
        writingProcess: 'Detailed writing process...',
        trivia: 'Extensive trivia information...',
        themes: ['theme1', 'theme2', 'theme3']
      };

      const mockAIResponse = {
        data: {
          choices: [
            {
              message: {
                content: 'A concise summary of the song analysis highlighting key points about meaning, creation, and cultural impact.'
              }
            }
          ]
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockAIResponse);

      const result = await aiService.generateSummary(mockAnalysis);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('concise summary')
            })
          ]),
          temperature: 0.5,
          max_tokens: 500
        }),
        expect.any(Object)
      );

      expect(result).toBe('A concise summary of the song analysis highlighting key points about meaning, creation, and cultural impact.');
    });
  });
});