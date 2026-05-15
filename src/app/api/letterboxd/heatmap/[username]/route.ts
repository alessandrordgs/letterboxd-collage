import { JSDOM } from "jsdom"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

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
    if (response.status === 404) {
      return Response.json({ error: "user_not_found" }, { status: 404 })
    }
    if (!response.ok) {
      return Response.json({ error: "fetch_failed" }, { status: 502 })
    }
    xmlText = await response.text()
  } catch {
    return Response.json({ error: "fetch_failed" }, { status: 502 })
  }

  const dom = new JSDOM(xmlText, { contentType: "text/xml" })
  const doc = dom.window.document
  const items = Array.from(doc.getElementsByTagName("item"))

  const now = new Date()
  const cutoff = new Date(now.getFullYear(), 0, 1)

  const counts: Record<string, number> = {}

  for (const item of items) {
    const watchedDateText =
      item.getElementsByTagName("letterboxd:watchedDate")[0]?.textContent ||
      item.getElementsByTagName("watchedDate")[0]?.textContent ||
      item.getElementsByTagName("pubDate")[0]?.textContent

    if (!watchedDateText) continue

    const watchedDate = new Date(watchedDateText)
    if (isNaN(watchedDate.getTime())) continue
    if (watchedDate < cutoff) continue

    const dateKey = watchedDate.toISOString().substring(0, 10)
    counts[dateKey] = (counts[dateKey] || 0) + 1
  }

  const result = Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return Response.json(result)
}
