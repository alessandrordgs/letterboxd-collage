import { IRecommendation } from "@/interfaces/IRecommendation"
import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { JSDOM } from "jsdom"
import { NextRequest } from "next/server"
import { z } from "zod"

const TMDB_BASE = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342"

async function tmdbFetch(path: string): Promise<Response | null> {
  const key = process.env.TMDB_API_KEY
  if (!key) return null
  if (key.startsWith("eyJ")) {
    return fetch(`${TMDB_BASE}${path}`, { headers: { Authorization: `Bearer ${key}` } })
  }
  const sep = path.includes("?") ? "&" : "?"
  return fetch(`${TMDB_BASE}${path}${sep}api_key=${key}`)
}

const RSS_HEADERS = {
  "User-Agent": "RSS Reader/1.0",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
}

function extractTitlesFromRss(xml: string): string[] {
  const dom = new JSDOM(xml, { contentType: "text/xml" })
  const items = Array.from(dom.window.document.getElementsByTagName("item"))
  const titles: string[] = []
  for (const item of items) {
    const titleEl =
      item.getElementsByTagName("letterboxd:filmTitle")[0] ||
      item.getElementsByTagName("filmTitle")[0]
    const name = titleEl?.textContent
    if (name) titles.push(name.toLowerCase())
  }
  return titles
}

async function fetchWatchedTitles(username: string): Promise<Set<string>> {
  const feeds = [
    `https://letterboxd.com/${username}/rss/`,
    `https://letterboxd.com/${username}/reviews/rss/`,
    `https://letterboxd.com/${username}/likes/films/rss/`,
  ]

  const results = await Promise.allSettled(
    feeds.map((url) =>
      fetch(url, { headers: RSS_HEADERS })
        .then((r) => (r.ok ? r.text() : ""))
        .then((xml) => (xml ? extractTitlesFromRss(xml) : []))
    )
  )

  const titles = new Set<string>()
  for (const result of results) {
    if (result.status === "fulfilled") {
      result.value.forEach((t) => titles.add(t))
    }
  }
  return titles
}

async function searchTmdb(title: string): Promise<{ genres: string[]; director: string | null } | null> {
  const searchRes = await tmdbFetch(`/search/movie?query=${encodeURIComponent(title)}`)
  if (!searchRes?.ok) return null

  const searchData = await searchRes.json()
  const movie = searchData.results?.[0]
  if (!movie) return null

  const creditsRes = await tmdbFetch(`/movie/${movie.id}/credits`)
  const creditsData = creditsRes?.ok ? await creditsRes.json() : { crew: [] }
  const director = creditsData.crew?.find((c: { job: string; name: string }) => c.job === "Director")?.name ?? null

  const genreMap: Record<number, string> = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
    99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
    27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance",
    878: "Science Fiction", 10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
  }
  const genres = (movie.genre_ids ?? []).map((id: number) => genreMap[id] ?? "").filter(Boolean)

  return { genres, director }
}

async function getMovieDetails(title: string): Promise<{ posterUrl: string | null; director: string | null }> {
  const res = await tmdbFetch(`/search/movie?query=${encodeURIComponent(title)}`)
  if (!res?.ok) return { posterUrl: null, director: null }

  const data = await res.json()
  const movie = data.results?.[0]
  if (!movie) return { posterUrl: null, director: null }

  const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null

  const creditsRes = await tmdbFetch(`/movie/${movie.id}/credits`)
  const creditsData = creditsRes?.ok ? await creditsRes.json() : { crew: [] }
  const director = creditsData.crew?.find((c: { job: string; name: string }) => c.job === "Director")?.name ?? null

  return { posterUrl, director }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const films: { title: string; rating: number }[] = body.films ?? []
  const username: string = body.username ?? ""

  const topFilms = films
    .filter((f) => f.rating >= 3.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10)

  if (topFilms.length === 0) {
    return Response.json({ error: "no_highly_rated_films" }, { status: 400 })
  }

  const [filmMetadata, watchedTitles] = await Promise.all([
    Promise.all(topFilms.map((f) => searchTmdb(f.title))),
    username ? fetchWatchedTitles(username) : Promise.resolve(new Set<string>()),
  ])

  const diaryTitles = films.map((f) => f.title.toLowerCase())
  diaryTitles.forEach((t) => watchedTitles.add(t))

  const tasteProfile = topFilms
    .map((f, i) => {
      const meta = filmMetadata[i]
      const genres = meta?.genres.join(", ") || "unknown genre"
      const director = meta?.director ? `, directed by ${meta.director}` : ""
      return `- "${f.title}" (${f.rating}★, ${genres}${director})`
    })
    .join("\n")

  const schema = z.object({
    recommendations: z.array(
      z.object({
        title: z.string(),
        year: z.number(),
        explanation: z.string(),
      })
    ).min(5),
  })

  const watchedList = Array.from(watchedTitles).slice(0, 300).join(", ")

  let generated
  try {
    generated = await generateObject({
      model: google("gemini-2.5-flash"),
      schema,
      prompt: `You are a film critic and recommender. Based on the user's highly-rated films, recommend exactly 12 films they would enjoy and have NOT already seen.

This user is an active film enthusiast, so they have likely already seen the most popular and widely-known titles in their preferred genres. Prioritize films that are critically acclaimed but less mainstream — hidden gems, underseen classics, or films from directors and countries underrepresented in their taste profile. Avoid recommending obvious blockbusters or films that are universally known to cinephiles.

Highly rated films (use these to infer taste):
${tasteProfile}

Films the user has already watched — DO NOT recommend any of these under any circumstances:
${watchedList}

For each recommendation, write 1-2 sentences explaining why it matches their taste, referencing specific films they rated highly. Be specific and personal, not generic.`,
    })
  } catch {
    return Response.json({ error: "recommendation_failed" }, { status: 502 })
  }

  const filtered = generated.object.recommendations
    .filter((rec) => !watchedTitles.has(rec.title.toLowerCase()))
    .slice(0, 5)

  const recommendations: IRecommendation[] = await Promise.all(
    filtered.map(async (rec) => {
      const { posterUrl, director } = await getMovieDetails(rec.title)
      return { ...rec, posterUrl, director }
    })
  )

  return Response.json({ recommendations })
}
