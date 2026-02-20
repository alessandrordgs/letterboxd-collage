import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import axios, { AxiosError } from "axios"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const formData = await request.formData()
  const file = formData.get("media") as File | null
  try {
    let mediaId: string | null = null

    if (file) {
      const mediaForm = new FormData()
      mediaForm.append("media", file)

      const uploadRes = await axios.post(
        "https://api.twitter.com/2/media/upload",
        mediaForm,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      )
      console.log(uploadRes.data)
      mediaId = uploadRes.data.id
    }
    const twitterUsername = session.user?.username as string | undefined
    const tweetPayload: {
      text: string
      media?: { media_ids: string[] }
    } = {
      text: `Collage created using https://colagge.alessandrordgs.com.br based on diary of ${twitterUsername ?? "letterboxd"}`,
    }
    if (mediaId) {
      tweetPayload.media = { media_ids: [mediaId] }
    }

    if (!mediaId) {
      return NextResponse.json({ error: "No media found" }, { status: 400 })
    }
    const tweetRes = await axios.post(
      "https://api.twitter.com/2/tweets",
      tweetPayload,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    )

    return NextResponse.json({ success: true, data: tweetRes.data })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      {
        error: (error as AxiosError).response?.data || (error as Error).message,
      },
      { status: 500 }
    )
  }
}
