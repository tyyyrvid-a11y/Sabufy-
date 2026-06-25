import { searchPlaylists } from './src/lib/api.ts';

async function test() {
  try {
    const rawData = await searchPlaylists('Giant Steps album');
    if (rawData.length > 0) {
       console.log("Fetching details for:", rawData[0].id);
       const res = await fetch(`https://invidious.flokinet.to/api/v1/playlists/${rawData[0].id}`);
       const data = await res.json();
       console.log("Keys in data:", Object.keys(data));
       if (data.videos) {
         console.log("Videos length:", data.videos.length);
       } else {
         console.log("No videos field!");
         console.log(data);
       }
    }
  } catch (e) {
    console.error("Test failed", e);
  }
}
test();
