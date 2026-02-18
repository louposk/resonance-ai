import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { SongModel } from '../models/Song';
import { SongAnalysisModel } from '../models/SongAnalysis';
import { SpotifyService } from '../services/SpotifyService';
import { YouTubeService } from '../services/YouTubeService';
import { AIService } from '../services/AIService';
import { CacheService } from '../services/CacheService';
import { database } from '../config/database';
import Joi from 'joi';

export class SongController {
  private spotifyService: SpotifyService;
  private youtubeService: YouTubeService;
  private aiService: AIService;
  private cacheService: CacheService;

  constructor() {
    this.spotifyService = new SpotifyService();
    this.youtubeService = new YouTubeService();
    this.aiService = new AIService();
    this.cacheService = new CacheService();
  }

  async searchSongs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { q: query, platform } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Query parameter is required'
        });
        return;
      }

      // Check cache first
      const cachedResults = await this.cacheService.getSearchResult(query);
      if (cachedResults) {
        res.json({
          success: true,
          data: cachedResults,
          cached: true
        });
        return;
      }

      const results = [];

      try {
        if (!platform || platform === 'all' || platform === 'spotify') {
          const spotifyResult = await this.spotifyService.searchTrack(query);
          if (spotifyResult) {
            results.push({ ...spotifyResult, source: 'spotify' });
          }
        }

        if (!platform || platform === 'all' || platform === 'youtube') {
          const youtubeResult = await this.youtubeService.searchVideo(query);
          if (youtubeResult) {
            results.push({ ...youtubeResult, source: 'youtube' });
          }
        }
      } catch (serviceError) {
        console.error('Service error during search:', serviceError);
      }

      // Cache the results
      await this.cacheService.cacheSearchResult(query, results);

      res.json({
        success: true,
        data: results,
        cached: false
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search songs'
      });
    }
  }

  async getSongAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: songId } = req.params;

      const client = await database.getClient();
      const songModel = new SongModel(client);
      const analysisModel = new SongAnalysisModel(client);

      try {
        // Find the song
        const song = await songModel.findById(songId);
        if (!song) {
          res.status(404).json({
            success: false,
            error: 'Song not found'
          });
          return;
        }

        // Check cache first
        let analysis = await this.cacheService.getAnalysis(songId);

        if (!analysis) {
          // Check database
          analysis = await analysisModel.findBySongId(songId);
        }

        if (!analysis) {
          try {
            // Generate new analysis
            const aiAnalysis = await this.aiService.analyzeSong(song);

            // Save to database
            analysis = await analysisModel.create({
              songId,
              ...aiAnalysis
            });

            // Cache the analysis
            await this.cacheService.setAnalysis(songId, analysis);
          } catch (aiError) {
            console.error('AI service error:', aiError);
            res.status(500).json({
              success: false,
              error: 'Failed to generate analysis'
            });
            return;
          }
        } else if (!await this.cacheService.getAnalysis(songId)) {
          // Cache the analysis if it wasn't cached
          await this.cacheService.setAnalysis(songId, analysis);
        }

        res.json({
          success: true,
          data: {
            song,
            analysis
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get song analysis'
      });
    }
  }

  async createSong(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        title: Joi.string().required().trim(),
        artist: Joi.string().required().trim(),
        album: Joi.string().optional().trim(),
        releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
        spotifyId: Joi.string().optional(),
        youtubeId: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }

      const client = await database.getClient();
      const songModel = new SongModel(client);
      const analysisModel = new SongAnalysisModel(client);

      try {
        // Check if song already exists
        let song = await songModel.findByTitleAndArtist(value.title, value.artist);

        if (song) {
          // Return existing song
          const analysis = await analysisModel.findBySongId(song.id);
          res.json({
            success: true,
            data: { song, analysis },
            message: 'Song already exists'
          });
          return;
        }

        // Create new song
        song = await songModel.create(value);

        // Generate analysis
        let analysis = null;
        try {
          const aiAnalysis = await this.aiService.analyzeSong(song);
          analysis = await analysisModel.create({
            songId: song.id,
            ...aiAnalysis
          });

          // Cache both song and analysis
          await this.cacheService.setSong(song.title, song.artist, song);
          await this.cacheService.setAnalysis(song.id, analysis);
        } catch (aiError) {
          console.error('AI analysis failed during creation:', aiError);
          // Song is created but analysis failed - that's ok
        }

        res.status(201).json({
          success: true,
          data: { song, analysis }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Create song error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create song'
      });
    }
  }

  async getSong(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const client = await database.getClient();
      const songModel = new SongModel(client);

      try {
        const song = await songModel.findById(id);

        if (!song) {
          res.status(404).json({
            success: false,
            error: 'Song not found'
          });
          return;
        }

        res.json({
          success: true,
          data: song
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Get song error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get song'
      });
    }
  }

  async updateSong(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const schema = Joi.object({
        title: Joi.string().optional().trim(),
        artist: Joi.string().optional().trim(),
        album: Joi.string().optional().trim(),
        releaseYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
        spotifyId: Joi.string().optional(),
        youtubeId: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }

      const client = await database.getClient();
      const songModel = new SongModel(client);

      try {
        const song = await songModel.findById(id);
        if (!song) {
          res.status(404).json({
            success: false,
            error: 'Song not found'
          });
          return;
        }

        // For now, we'll just return the existing song since we don't have an update method
        // In a full implementation, you would add an update method to the model
        res.json({
          success: true,
          data: song,
          message: 'Song update not yet implemented'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Update song error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update song'
      });
    }
  }

  async deleteSong(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const client = await database.getClient();
      const songModel = new SongModel(client);

      try {
        const deleted = await songModel.delete(id);

        if (!deleted) {
          res.status(404).json({
            success: false,
            error: 'Song not found'
          });
          return;
        }

        // Clear cache
        await this.cacheService.deleteAnalysis(id);

        res.json({
          success: true,
          message: 'Song deleted successfully'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Delete song error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete song'
      });
    }
  }
}