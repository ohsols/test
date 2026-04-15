import { Category } from '../types';

const API_BASE = 'https://infamous.qzz.io'; // Discovered music API domain

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string | null;
  source: 'tidal' | 'soundcloud';
  useBackend: boolean;
}

export async function searchMusic(query: string, source: string = 'all'): Promise<Track[]> {
  const tracks: Track[] = [];
  
  try {
    if (source === 'all' || source === 'tidal') {
      const tidalTracks = await fetchTidal(query);
      tracks.push(...tidalTracks);
    }
    
    if (source === 'all' || source === 'soundcloud') {
      const scTracks = await fetchSoundCloud(query);
      tracks.push(...scTracks);
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
  
  return tracks;
}

async function fetchTidal(query: string): Promise<Track[]> {
  try {
    const response = await fetch(`/api/music/infamous/tidal/search/${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title || 'Unknown Title',
      artist: item.artist || 'Unknown Artist',
      duration: item.duration || 0,
      thumbnail: item.thumbnail || null,
      source: 'tidal',
      useBackend: true
    }));
  } catch {
    return [];
  }
}

async function fetchSoundCloud(query: string): Promise<Track[]> {
  try {
    const response = await fetch(`/api/music/infamous/soundcloud/search/${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title || 'Unknown Title',
      artist: item.artist || 'Unknown Artist',
      duration: item.duration || 0,
      thumbnail: item.thumbnail || null,
      source: 'soundcloud',
      useBackend: true
    }));
  } catch {
    return [];
  }
}

export function getStreamUrl(track: Track): string {
  const path = track.source === 'tidal' ? `/api/music/infamous/tidal/stream/${track.id}` : `/api/music/infamous/soundcloud/stream/${track.id}`;
  let url = path;
  const title = `${track.title}${track.artist ? ` - ${track.artist}` : ''}`;
  url += (url.includes('?') ? '&' : '?') + `t=${encodeURIComponent(title)}`;
  return url;
}
