export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  releaseYear?: number;
  spotifyId?: string;
  youtubeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SongAnalysis {
  id: string;
  songId: string;
  meaning: string;
  writingProcess: string;
  trivia: string;
  themes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  apiKey: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchRequest {
  query: string;
  platform?: 'spotify' | 'youtube' | 'all';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; release_date: string };
  duration_ms: number;
}

export interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
  };
}