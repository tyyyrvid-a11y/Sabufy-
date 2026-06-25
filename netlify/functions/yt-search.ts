import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const query = event.queryStringParameters?.q;

  if (!query) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Missing query' }),
    };
  }

  try {
    const ytRes = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(query));
    const html = await ytRes.text();
    const match = html.match(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/);
    
    if (match && match[1]) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: match[1] }),
      };
    } else {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Video not found' }),
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: String(e) }),
    };
  }
};
