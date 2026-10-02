/**
 * Spotify API Service
 * Handles all Spotify Web API interactions for artist data and tracks
 */

// Spotify API credentials should be stored in environment variables
const SPOTIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET || '';

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid token
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get Spotify access token');
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
    
    return accessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
}

/**
 * Spotify Artist Interface
 */
export interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  genres: string[];
  followers: {
    total: number;
  };
  popularity: number;
  external_urls: {
    spotify: string;
  };
}

/**
 * Spotify Track Interface
 */
export interface SpotifyTrack {
  id: string;
  name: string;
  preview_url: string | null;
  duration_ms: number;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
    release_date: string;
  };
  artists: Array<{
    id: string;
    name: string;
  }>;
  external_urls: {
    spotify: string;
  };
  popularity: number;
}

/**
 * Get artist details from Spotify
 */
export async function getSpotifyArtist(spotifyId: string): Promise<SpotifyArtist | null> {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(`https://api.spotify.com/v1/artists/${spotifyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch artist from Spotify:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Spotify artist:', error);
    return null;
  }
}

/**
 * Get artist's top tracks from Spotify
 * @param spotifyId - Spotify artist ID
 * @param market - ISO 3166-1 alpha-2 country code (default: IN for India)
 */
export async function getArtistTopTracks(
  spotifyId: string,
  market: string = 'IN'
): Promise<SpotifyTrack[]> {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${spotifyId}/top-tracks?market=${market}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch top tracks from Spotify:', response.status);
      return [];
    }

    const data = await response.json();
    return data.tracks || [];
  } catch (error) {
    console.error('Error fetching artist top tracks:', error);
    return [];
  }
}

/**
 * Search for an artist on Spotify
 */
export async function searchSpotifyArtist(artistName: string): Promise<SpotifyArtist[]> {
  try {
    const token = await getAccessToken();
    
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to search artist on Spotify:', response.status);
      return [];
    }

    const data = await response.json();
    return data.artists?.items || [];
  } catch (error) {
    console.error('Error searching Spotify artist:', error);
    return [];
  }
}

/**
 * Format follower count for display (e.g., 1.2M, 500K)
 */
export function formatFollowerCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Format track duration from milliseconds to MM:SS
 */
export function formatDuration(durationMs: number): string {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get Spotify embed URL for a track
 */
export function getSpotifyEmbedUrl(trackId: string): string {
  return `https://open.spotify.com/embed/track/${trackId}`;
}

/**
 * Get Spotify embed URL for an artist
 */
export function getSpotifyArtistEmbedUrl(artistId: string): string {
  return `https://open.spotify.com/embed/artist/${artistId}`;
}
