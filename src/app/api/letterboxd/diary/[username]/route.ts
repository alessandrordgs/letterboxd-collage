import { Imovies } from "@/interfaces/IMovies"
import { JSDOM } from "jsdom"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const period = parseInt(
    request?.nextUrl?.searchParams.get("period") as string
  )

  const rssUrl = `https://letterboxd.com/${username}/rss/`

  let xmlText: string
  try {
    const response = await fetch(rssUrl, {
      method: "GET",
      headers: {
        "User-Agent": "RSS Reader/1.0",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
    })
    if (!response.ok) {
      console.error(`RSS fetch failed: ${response.status}`)
      return Response.json([], { status: 200 })
    }
    xmlText = await response.text()
  } catch (err) {
    console.error("RSS fetch error:", err)
    return Response.json([], { status: 200 })
  }

  const dom = new JSDOM(xmlText, { contentType: "text/xml" })
  const doc = dom.window.document
  const items = Array.from(doc.getElementsByTagName("item"))
  console.log(`RSS items found: ${items.length}`)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const films: Imovies[] = []

  for (const item of items) {
    // Get watched date — letterboxd:watchedDate or pubDate fallback
    const watchedDateText =
      item.getElementsByTagName("letterboxd:watchedDate")[0]?.textContent ||
      item.getElementsByTagName("watchedDate")[0]?.textContent ||
      item.getElementsByTagName("pubDate")[0]?.textContent

    if (!watchedDateText) continue

    const watchedDate = new Date(watchedDateText)
    const watchedYear = watchedDate.getFullYear()
    const watchedMonth = watchedDate.getMonth() + 1

    // Filter by period
    if (period === 1) {
      if (watchedYear !== currentYear || watchedMonth !== currentMonth) continue
    } else if (period === 3) {
      const cutoff = new Date(now)
      cutoff.setMonth(cutoff.getMonth() - 3)
      if (watchedDate < cutoff) continue
    } else if (period === 12) {
      if (watchedYear !== currentYear) continue
    }

    // Get film title
    const filmTitleEl =
      item.getElementsByTagName("letterboxd:filmTitle")[0] ||
      item.getElementsByTagName("filmTitle")[0]
    const name =
      filmTitleEl?.textContent ||
      item.getElementsByTagName("title")[0]?.textContent ||
      undefined

    // Get poster image from description CDATA
    const descriptionEl = item.getElementsByTagName("description")[0]
    const descText = descriptionEl?.textContent || ""
    const imgMatch = descText.match(/<img[^>]+src="([^"]+)"/)
    const imageUrl = imgMatch?.[1]

    if (imageUrl && name) {
      films.push({
        name,
        img: `/api/letterboxd/proxy-image?url=${encodeURIComponent(imageUrl)}`,
      })
    }
  }

  console.log(`Films extracted for period ${period}: ${films.length}`)

  return Response.json(films, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
