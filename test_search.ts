import { searchPlaylists } from './src/lib/api.ts';

async function test() {
  try {
    const rawData = await searchPlaylists('John Coltrane Giant Steps album');
    console.log("Total playlists found:", rawData.length);
    rawData.forEach(p => {
      console.log(`- ${p.title} | Author: "${p.author}"`);
    });
  } catch (e) {
    console.error(e);
  }
}
test();
