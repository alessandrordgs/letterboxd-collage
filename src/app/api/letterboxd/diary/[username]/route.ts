import { Imovies } from "@/interfaces/IMovies"
import { JSDOM } from "jsdom"
import { NextRequest } from "next/server"
type DiaryEntryElement = Element & {
  querySelector: (selector: string) => Element | null
}

async function handleFetchRowsLetterboxd(
  url: string
): Promise<DiaryEntryElement[]> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  })

  const data = await response.text()
  const dom = new JSDOM(data)
  const paginate = dom.window.document?.querySelectorAll(
    ".paginate-pages > ul li"
  )
  const pages: number[] = []
  paginate?.forEach((item) => {
    pages.push(parseInt(item.textContent as string))
  })

  const table = dom.window.document.querySelector("table")
  const rows = table?.querySelectorAll(".diary-entry-row")
  const currentRows: DiaryEntryElement[] = rows
    ? Array.from(rows).map((row) => row as DiaryEntryElement)
    : []
  if (pages.length > 0) {
    let allRows: DiaryEntryElement[] = []
    pages.shift()

    for (const page of pages) {
      const rowsOfpage = await handleFetchRowsLetterboxd(`${url}/page/${page}`)

      allRows = [...allRows, ...rowsOfpage]
    }

    return [...allRows, ...currentRows]
  }
  return rows ? currentRows : []
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const period = request?.nextUrl?.searchParams.get("period")
  const rows = []
  let url: string = ""
  if (parseInt(period as string) === 1) {
    const date = new Date()
    const month = date.getMonth() + 1

    url = `https://letterboxd.com/${username}/films/diary/for/2025/${month}`

    const rowsResponse = await handleFetchRowsLetterboxd(url)
    rows.push(...rowsResponse)
  }

  if (parseInt(period as string) === 3) {
    const date = new Date()
    const currentMonth = date.getMonth() + 1
    const year = date.getFullYear()

    for (let i = 0; i < 3; i++) {
      let targetMonth = currentMonth - i
      let targetYear = year

      if (targetMonth <= 0) {
        targetMonth = 12 + targetMonth
        targetYear--
      }

      console.log(`Buscando dados de ${targetMonth}/${targetYear}`)
      url = `https://letterboxd.com/${username}/films/diary/for/${targetYear}/${targetMonth}`

      const rowsResponse = await handleFetchRowsLetterboxd(url)
      rows.push(...rowsResponse)
    }
  }
  if (parseInt(period as string) === 12) {
    url = `https://letterboxd.com/${username}/films/diary/for/2025/`

    const rowsResponse = await handleFetchRowsLetterboxd(url)
    rows.push(...rowsResponse)
  }

  const films: Imovies[] = []

  for (const row of rows ?? []) {
    const details = row.querySelector(".td-film-details")
    const name = details?.querySelector("h3 > a")?.textContent
    const film = details
      ?.querySelector("h3 > a")
      ?.getAttribute("href")
      ?.split("/film")[1]
      ?.replace("/1", "")

    const filmResponse = await fetch(`https://letterboxd.com/film/${film}`, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    })

    const dataFilm = await filmResponse.text()
    const domFilm = new JSDOM(dataFilm)
    const scripts = domFilm.window.document.querySelectorAll(
      'script[type="application/ld+json"]'
    )
    const data = JSON.parse(
      scripts[0]?.textContent?.split(" */")[1].split("/* ]]>")[0] as string
    )

    films.push({
      name,
      img: `/api/letterboxd/proxy-image?url=${encodeURIComponent(data.image)}`,
    })
  }

  return Response.json(films, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(JSON.stringify(films)).toString(),
    },
  })
}
