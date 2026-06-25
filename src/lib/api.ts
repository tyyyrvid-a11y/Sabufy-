import { Track } from '../store/playerStore';

let cachedInstance: string | null = null;

const FALLBACK_INSTANCES = [
  'https://invidious.flokinet.to',
  'https://invidious.nerdvpn.de',
  'https://invidious.lunar.icu',
  'https://yt.artemislena.eu',
  'https://invidious.darkness.services'
];

let cachedInstancesList: string[] = [];

export async function getWorkingInstancesList(): Promise<string[]> {
  if (cachedInstancesList.length > 0) {
    return [...cachedInstancesList].sort(() => 0.5 - Math.random());
  }

  try {
    const res = await fetch('https://api.invidious.io/instances.json');
    const data = await res.json();
    const healthyInstances = data
      .filter((inst: any) => 
        inst[1].type === 'https' && 
        inst[1].api === true
      )
      .map((inst: any) => inst[1].uri);

    if (healthyInstances.length > 0) {
      cachedInstancesList = healthyInstances;
      // Shuffle array
      return [...cachedInstancesList].sort(() => 0.5 - Math.random());
    }
  } catch (error) {
    console.warn('Failed to fetch instances list from api.invidious.io, using fallback.', error);
  }

  return FALLBACK_INSTANCES.sort(() => 0.5 - Math.random());
}

export async function getWorkingInstance(): Promise<string> {
  if (cachedInstance) return cachedInstance;
  const list = await getWorkingInstancesList();
  cachedInstance = list[0];
  return cachedInstance;
}

export async function searchTracks(query: string): Promise<Track[]> {
  const instance = await getWorkingInstance();
  try {
    const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    
    return data.map((item: any) => ({
      id: item.videoId,
      title: item.title,
      artist: item.author,
      thumbnail: item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || item.videoThumbnails?.[0]?.url || '',
      duration: item.lengthSeconds,
    }));
  } catch (e) {
    console.error('API Error', e);
    cachedInstance = null;
    throw e;
  }
}

export async function getAudioStreamUrl(trackOrVideoId: Track | string): Promise<string> {
  const isItunes = typeof trackOrVideoId === 'object' && /^\d+$/.test(trackOrVideoId.id);
  const query = isItunes ? `${(trackOrVideoId as Track).artist} ${(trackOrVideoId as Track).title} audio` : '';
  const initialVideoId = typeof trackOrVideoId === 'string' ? trackOrVideoId : trackOrVideoId.id;

  if (isItunes) {
    try {
      const res = await fetch(`/api/yt-search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.videoId) return `youtube:${data.videoId}`;
        }
      }
    } catch (e) {
      console.error('YouTube search proxy failed:', e);
    }

    // Fallback if backend proxy fails (e.g., Netlify Drop where functions aren't deployed)
    try {
      const invidiousSearch = async (instanceUrl: string) => {
        try {
          const res = await fetch(`${instanceUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
          if (!res.ok) throw new Error('Invidious error');
          const data = await res.json();
          if (data && data.length > 0) return data[0].videoId;
          throw new Error('No results from Invidious');
        } catch (e) {
          if (cachedInstance === instanceUrl) cachedInstance = null;
          throw e;
        }
      };

      const pipedSearch = async () => {
        const res = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=music_songs`);
        if (!res.ok) throw new Error('Piped error');
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const url = data.items[0].url;
          return url.includes('v=') ? url.split('v=')[1] : url.split('/').pop();
        }
        throw new Error('No results from Piped');
      };

      const allOriginsSearch = async () => {
        const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(ytUrl)}`;
        const res = await fetch(allOriginsUrl);
        if (!res.ok) throw new Error('AllOrigins error');
        const data = await res.json();
        const html = data.contents;
        const match = html?.match(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (match && match[1]) return match[1];
        throw new Error('No results from AllOrigins');
      };

      const instances = await getWorkingInstancesList();
      const instance1 = instances[0] || await getWorkingInstance();
      const instance2 = instances[1];

      const promises = [
        pipedSearch(),
        invidiousSearch(instance1),
        allOriginsSearch()
      ];
      if (instance2) promises.push(invidiousSearch(instance2));

      const videoId = await Promise.any(promises);
      return `youtube:${videoId}`;
    } catch (e) {
      console.error('All fallbacks failed:', e);
    }
  }

  // Fallback if not iTunes (return youtube format directly for existing video IDs)
  return `youtube:${initialVideoId}`;
}

export async function searchPlaylists(query: string) {
  const instance = await getWorkingInstance();
  try {
    const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=playlist`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    
    return data.map((item: any) => ({
      id: item.playlistId,
      title: item.title,
      author: item.author,
      thumbnail: item.playlistThumbnail || item.videos?.[0]?.videoThumbnails?.[0]?.url || '',
      trackCount: item.videoCount,
    }));
  } catch (e) {
    console.error('API Error', e);
    cachedInstance = null;
    throw e;
  }
}

export async function searchArtists(query: string) {
  const instance = await getWorkingInstance();
  try {
    const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=channel`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    
    return data.map((item: any) => ({
      id: item.authorId,
      name: item.author,
      thumbnail: item.authorThumbnails?.[item.authorThumbnails.length - 1]?.url || item.authorThumbnails?.[0]?.url || '',
    }));
  } catch (e) {
    console.error('API Error', e);
    cachedInstance = null;
    throw e;
  }
}

export async function getPlaylistDetails(playlistId: string) {
  const instance = await getWorkingInstance();
  try {
    const res = await fetch(`${instance}/api/v1/playlists/${playlistId}`);
    if (!res.ok) throw new Error('Failed to fetch playlist details');
    const data = await res.json();
    
    return {
      id: data.playlistId,
      title: data.title,
      author: data.author,
      thumbnail: data.playlistThumbnail || data.videos?.[0]?.videoThumbnails?.[0]?.url || '',
      trackCount: data.videoCount,
      tracks: (data.videos || []).map((item: any) => ({
        id: item.videoId,
        title: item.title,
        artist: item.author,
        thumbnail: item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || item.videoThumbnails?.[0]?.url || '',
        duration: item.lengthSeconds,
      })),
    };
  } catch (e) {
    console.error('API Error', e);
    cachedInstance = null;
    throw e;
  }
}

export async function getArtistDetails(artistId: string) {
  const instance = await getWorkingInstance();
  try {
    const res = await fetch(`${instance}/api/v1/channels/${artistId}`);
    if (!res.ok) throw new Error('Failed to fetch artist details');
    const data = await res.json();
    
    return {
      id: data.authorId,
      name: data.author,
      thumbnail: data.authorThumbnails?.[data.authorThumbnails.length - 1]?.url || data.authorThumbnails?.[0]?.url || '',
      banner: data.authorBanners?.[data.authorBanners.length - 1]?.url || '',
      tracks: (data.latestVideos || []).map((item: any) => ({
        id: item.videoId,
        title: item.title,
        artist: item.author,
        thumbnail: item.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || item.videoThumbnails?.[0]?.url || '',
        duration: item.lengthSeconds,
      })),
    };
  } catch (e) {
    console.error('API Error', e);
    cachedInstance = null;
    throw e;
  }
}

// ==========================================
// iTunes API Catalog Functions
// ==========================================

function fetchJsonp(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = 'itunes_jsonp_' + Math.round(1000000 * Math.random());
    const script = document.createElement('script');
    
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
    script.onerror = () => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      reject(new Error('JSONP Request failed'));
    };
    
    document.body.appendChild(script);
  });
}

export async function searchTracksItunes(query: string): Promise<Track[]> {
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=25`;
    const data = await fetchJsonp(itunesUrl);
    
    return data.results.map((item: any) => ({
      id: item.trackId.toString(),
      title: item.trackName,
      artist: item.artistName,
      thumbnail: item.artworkUrl100.replace('100x100bb', '600x600bb'), // high-res
      duration: Math.floor(item.trackTimeMillis / 1000),
    }));
  } catch (e) {
    console.error('iTunes API Error', e);
    return [];
  }
}

export async function searchAlbumsItunes(query: string) {
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=20`;
    const data = await fetchJsonp(itunesUrl);
    
    return data.results.map((item: any) => ({
      id: item.collectionId.toString(),
      title: item.collectionName,
      author: item.artistName,
      thumbnail: item.artworkUrl100.replace('100x100bb', '600x600bb'), // high-res
      trackCount: item.trackCount,
    }));
  } catch (e) {
    console.error('iTunes API Error', e);
    return [];
  }
}

export async function searchArtistsItunes(query: string) {
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=musicArtist&limit=15`;
    const data = await fetchJsonp(itunesUrl);
    
    return data.results.map((item: any) => ({
      id: item.artistId.toString(),
      name: item.artistName,
      thumbnail: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.artistName)}&background=random&size=600`,
    }));
  } catch (e) {
    console.error('iTunes API Error', e);
    return [];
  }
}

export async function getAlbumDetailsItunes(albumId: string) {
  try {
    const itunesUrl = `https://itunes.apple.com/lookup?id=${albumId}&entity=song`;
    const data = await fetchJsonp(itunesUrl);
    
    if (data.results.length === 0) throw new Error('Album not found');
    
    const albumData = data.results.find((r: any) => r.wrapperType === 'collection');
    const tracksData = data.results.filter((r: any) => r.wrapperType === 'track');
    
    const highResThumbnail = albumData.artworkUrl100.replace('100x100bb', '600x600bb');

    return {
      id: albumData.collectionId.toString(),
      title: albumData.collectionName,
      author: albumData.artistName,
      thumbnail: highResThumbnail,
      trackCount: albumData.trackCount,
      tracks: tracksData.map((item: any) => ({
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName,
        thumbnail: highResThumbnail,
        duration: Math.floor(item.trackTimeMillis / 1000),
      })),
    };
  } catch (e) {
    console.error('iTunes API Error', e);
    throw e;
  }
}

export async function getArtistDetailsItunes(artistId: string) {
  try {
    const itunesUrl = `https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=20`;
    const data = await fetchJsonp(itunesUrl);
    
    if (data.results.length === 0) throw new Error('Artist not found');
    
    const artistData = data.results.find((r: any) => r.wrapperType === 'artist');
    const tracksData = data.results.filter((r: any) => r.wrapperType === 'track');
    
    return {
      id: artistData.artistId.toString(),
      name: artistData.artistName,
      thumbnail: `https://ui-avatars.com/api/?name=${encodeURIComponent(artistData.artistName)}&background=random&size=600`,
      banner: '',
      tracks: tracksData.map((item: any) => ({
        id: item.trackId.toString(),
        title: item.trackName,
        artist: item.artistName,
        thumbnail: item.artworkUrl100.replace('100x100bb', '600x600bb'),
        duration: Math.floor(item.trackTimeMillis / 1000),
      })),
    };
  } catch (e) {
    console.error('iTunes API Error', e);
    throw e;
  }
}

// ==========================================
// AutoPlay Recommendation Algorithm
// ==========================================

export async function getRecommendations(historyTracks: Track[]): Promise<Track | null> {
  if (!historyTracks || historyTracks.length === 0) return null;

  try {
    // 1. Get the most recently played track
    const seedTrack = historyTracks[0];
    let videoId = seedTrack.id;

    // 2. If it's an iTunes ID (numeric), resolve to a YouTube video ID first
    if (/^\d+$/.test(videoId)) {
      const url = await getAudioStreamUrl(seedTrack);
      videoId = url.replace('youtube:', '');
    }

    // 3. Fetch recommended videos from Invidious API
    const instance = await getWorkingInstance();
    const res = await fetch(`${instance}/api/v1/videos/${videoId}`);
    if (!res.ok) throw new Error('Failed to fetch video details for recommendations');
    
    const data = await res.json();
    const recommendations = data.recommendedVideos || [];

    // 4. Create a set of already played track titles/IDs to filter out repeats
    const historyIds = new Set(historyTracks.map(t => t.id));
    const historyTitles = new Set(historyTracks.map(t => t.title.toLowerCase()));

    // 5. Find the first recommended video that hasn't been played recently
    for (const rec of recommendations) {
      if (!historyIds.has(rec.videoId) && !historyTitles.has(rec.title.toLowerCase())) {
        return {
          id: rec.videoId,
          title: rec.title,
          artist: rec.author,
          thumbnail: rec.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || rec.videoThumbnails?.[0]?.url || '',
          duration: rec.lengthSeconds,
        };
      }
    }
    
    // Fallback: If all are in history, just return the first recommendation anyway
    if (recommendations.length > 0) {
      const rec = recommendations[0];
      return {
        id: rec.videoId,
        title: rec.title,
        artist: rec.author,
        thumbnail: rec.videoThumbnails?.find((t: any) => t.quality === 'medium')?.url || rec.videoThumbnails?.[0]?.url || '',
        duration: rec.lengthSeconds,
      };
    }
    
    return null;
  } catch (e) {
    console.error('AutoPlay Recommendation Error', e);
    return null;
  }
}
