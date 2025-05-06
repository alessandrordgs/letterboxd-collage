import { Imovies } from '@/interfaces/IMovies';
import { JSDOM } from 'jsdom'
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {

  const { username } = await params;
  const period = request?.nextUrl?.searchParams.get('period')
  console.log(period)
  const url = `https://letterboxd.com/${username}/films/diary/for/2025/04`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }
  });

  if (!response.ok) {
    return new Response('Error fetching data', { status: response.status });
  }

  const data = await response.text();
  const dom = new JSDOM(data)
  const table = dom.window.document.querySelector('table')
  const rows = table?.querySelectorAll('.diary-entry-row')
  const films: Imovies[] = []

  for (const row of rows ?? []) {
    const details = row.querySelector('.td-film-details');
    const name = details?.querySelector('h3 > a')?.textContent;
    const film = details?.querySelector('h3 > a')?.getAttribute('href')?.split('/film')[1];

    const filmResponse = await fetch(`https://letterboxd.com/film/${film}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
      }
    });

    const dataFilm = await filmResponse.text();
    const domFilm = new JSDOM(dataFilm);
    const scripts = domFilm.window.document.querySelectorAll('script[type="application/ld+json"]');
    const data = JSON.parse(scripts[0]?.textContent?.split(' */')[1].split('/* ]]>')[0] as string);

    films.push({
      name,
      img: data.image
    });
  }

  return Response.json(films, { status: 200 })
}