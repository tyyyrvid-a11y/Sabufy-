import { getAudioStreamUrl, searchTracks } from './src/lib/api';

async function test() {
  try {
    console.log("Searching tracks...");
    const tracks = await searchTracks("Despacito");
    console.log("Found tracks:", tracks.length);
    if (tracks.length > 0) {
      console.log("Getting stream url for:", tracks[0].id);
      const url = await getAudioStreamUrl(tracks[0].id);
      console.log("Stream URL:", url.substring(0, 50) + "...");
    }
  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
