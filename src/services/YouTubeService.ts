import axios from 'axios';
import { YouTubeVideo } from '../types';

export class YouTubeService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
  }

  async searchVideo(query: string): Promise<any | null> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults: 1,
          videoCategoryId: '10', // Music category
          key: this.apiKey
        }
      });

      const videos = response.data.items;
      if (videos.length === 0) {
        return null;
      }

      const video = videos[0];
      return this.formatVideoData(video);
    } catch (error: any) {
      if (error.response?.status === 403) {
        const errorMessage = error.response.data?.error?.message;
        if (errorMessage?.includes('quota')) {
          throw new Error('YouTube API quota exceeded');
        }
      }
      throw error;
    }
  }

  async getVideoDetails(videoId: string): Promise<any | null> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey
        }
      });

      const videos = response.data.items;
      if (videos.length === 0) {
        return null;
      }

      const video = videos[0];
      return {
        ...this.formatVideoData(video),
        duration: this.parseDuration(video.contentDetails.duration),
        tags: video.snippet.tags || [],
        viewCount: parseInt(video.statistics.viewCount || '0'),
        likeCount: parseInt(video.statistics.likeCount || '0'),
        commentCount: parseInt(video.statistics.commentCount || '0')
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('YouTube API quota exceeded');
      }
      throw error;
    }
  }

  async searchMusicVideos(query: string, maxResults: number = 10): Promise<any[]> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          maxResults,
          videoCategoryId: '10',
          order: 'relevance',
          key: this.apiKey
        }
      });

      return response.data.items.map((video: any) => this.formatVideoData(video));
    } catch (error) {
      throw error;
    }
  }

  async getChannelInfo(channelId: string): Promise<any | null> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
          part: 'snippet,statistics',
          id: channelId,
          key: this.apiKey
        }
      });

      const channels = response.data.items;
      if (channels.length === 0) {
        return null;
      }

      const channel = channels[0];
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        viewCount: parseInt(channel.statistics.viewCount || '0')
      };
    } catch (error) {
      throw error;
    }
  }

  private formatVideoData(video: any): any {
    return {
      id: video.id.videoId || video.id,
      title: video.snippet.title,
      artist: video.snippet.channelTitle,
      youtubeId: video.id.videoId || video.id,
      publishedAt: video.snippet.publishedAt,
      description: video.snippet.description || ''
    };
  }

  private parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }

  async getPlaylistVideos(playlistId: string, maxResults: number = 50): Promise<any[]> {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/playlistItems', {
        params: {
          part: 'snippet',
          playlistId,
          maxResults,
          key: this.apiKey
        }
      });

      return response.data.items.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        artist: item.snippet.videoOwnerChannelTitle,
        youtubeId: item.snippet.resourceId.videoId,
        publishedAt: item.snippet.publishedAt
      }));
    } catch (error) {
      throw error;
    }
  }
}