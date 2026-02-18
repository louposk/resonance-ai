import axios from 'axios';
import { SpotifyTrack } from '../types';

export class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${credentials}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer

      return this.accessToken!;
    } catch (error) {
      throw new Error(`Failed to get Spotify access token: ${error}`);
    }
  }

  async searchTrack(query: string): Promise<any | null> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: query,
          type: 'track',
          limit: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const tracks = response.data.tracks.items;
      if (tracks.length === 0) {
        return null;
      }

      const track = tracks[0];
      return this.formatTrackData(track);
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.accessToken = null;
        throw new Error('Spotify authentication failed');
      }
      throw error;
    }
  }

  async getTrackDetails(spotifyId: string): Promise<any | null> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`https://api.spotify.com/v1/tracks/${spotifyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        ...this.formatTrackData(response.data),
        popularity: response.data.popularity,
        externalUrl: response.data.external_urls.spotify
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      if (error.response?.status === 401) {
        this.accessToken = null;
        throw new Error('Spotify authentication failed');
      }
      throw error;
    }
  }

  private formatTrackData(track: SpotifyTrack): any {
    const releaseDate = new Date(track.album.release_date);
    const releaseYear = releaseDate.getFullYear();

    return {
      id: track.id,
      title: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      duration: track.duration_ms,
      releaseYear: isNaN(releaseYear) ? undefined : releaseYear,
      spotifyId: track.id
    };
  }

  async getAlbumTracks(albumId: string, limit: number = 50): Promise<any[]> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
        params: { limit },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.items.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((artist: any) => artist.name).join(', '),
        duration: track.duration_ms,
        spotifyId: track.id
      }));
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  async searchArtist(artistName: string): Promise<any | null> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: artistName,
          type: 'artist',
          limit: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const artists = response.data.artists.items;
      if (artists.length === 0) {
        return null;
      }

      const artist = artists[0];
      return {
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        spotifyId: artist.id,
        externalUrl: artist.external_urls.spotify
      };
    } catch (error) {
      throw error;
    }
  }
}