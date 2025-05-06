import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const imageUrl = req.nextUrl.searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing image URL', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      return new Response('Failed to fetch image', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('Image proxy error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
