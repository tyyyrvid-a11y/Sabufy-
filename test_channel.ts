import { getWorkingInstance } from './src/lib/api.ts';

async function test() {
  try {
    const res = await fetch("https://invidious.nerdvpn.de/api/v1/channels/UC-J-KZfRV8c13fOCvq8IgVA");
    const data = await res.json();
    console.log(Object.keys(data));
  } catch (e) {
    console.error(e);
  }
}
test();
