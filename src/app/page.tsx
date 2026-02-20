'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressCircle } from "@/components/ui/CircularProgressIndicator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Logo } from "@/components/ui/Logo";
import { Imovies } from "@/interfaces/IMovies";
import { calculateGridColumns } from "@/lib/utils";
import axios from "axios";
import { signIn, useSession } from "next-auth/react";

import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [movies, setMovies] = useState<Imovies[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [period, setPeriod] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [media, setMedia] = useState<File | null>(null)
  const session = useSession()
  const router = useRouter()

  async function getDiary() {
    if (!username) return alert('preencha o campo de úsuario')
    setIsLoading(true)
    setProgress(0)

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    let currentProgressValue = 0;
    timerRef.current = setInterval(() => {
      if (currentProgressValue < 90) {
        const incrementFactor = period === 12 ? 0.5 : period === 3 ? 1 : 2;
        currentProgressValue = Math.min(90, currentProgressValue + incrementFactor * (100 - currentProgressValue) / 100);
        setProgress(currentProgressValue);
      }
    }, 300);
    try {
      const response = await axios.get(`/api/letterboxd/diary/${username}?period=${period}`)
      const data = response.data
      setProgress(100)
      setMovies(data)
      setIsLoading(false)
    } catch (error) {
      setProgress(0);
      console.error('Erro ao buscar dados:', error);
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!movies.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const columns = calculateGridColumns(movies);
    const padding = 0;

    Promise.allSettled(
      movies.map((movie) => {
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.src = movie.img as string;
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load image: ${movie.img}`));
        });
      })
    ).then((results) => {
      const images = results
        .filter((r): r is PromiseFulfilledResult<HTMLImageElement> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(img => img.width > 0 && img.height > 0);

      if (!images.length) return;
      const imageWidths: number[] = [];
      const rowHeights: number[] = [];

      let currentRow = 0;
      let currentCol = 0;
      let maxRowHeight = 0;

      images.forEach((img, i) => {
        if (!imageWidths[currentCol] || img.width > imageWidths[currentCol]) {
          imageWidths[currentCol] = img.width;
        }

        if (img.height > maxRowHeight) {
          maxRowHeight = img.height;
        }

        currentCol++;
        if (currentCol === columns || i === images.length - 1) {
          rowHeights[currentRow] = maxRowHeight;
          currentRow++;
          currentCol = 0;
          maxRowHeight = 0;
        }
      });

      const totalWidth = imageWidths.reduce((sum, w) => sum + w + padding, 0);
      const totalHeight = rowHeights.reduce((sum, h) => sum + h + padding, 0);

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Center last row when it has fewer images than columns
      const lastRowCount = images.length % columns || columns;
      const lastRowStartIndex = images.length - lastRowCount;
      const lastRowWidth = imageWidths.slice(0, lastRowCount).reduce((sum, w) => sum + w + padding, 0);
      const lastRowOffset = Math.floor((totalWidth - lastRowWidth) / 2);

      let x = lastRowStartIndex === 0 ? lastRowOffset : 0;
      let y = 0;
      let col = 0;
      let row = 0;

      images.forEach((img, i) => {
        ctx?.drawImage(img, x, y, img.width, img.height);

        x += imageWidths[col] + padding;
        col++;

        if (col === columns) {
          col = 0;
          row++;
          y += rowHeights[row - 1] + padding;
          x = i + 1 === lastRowStartIndex ? lastRowOffset : 0;
        }
      });

      const dataUrl = canvas.toDataURL("image/png");

      canvas.toBlob((blob) => {
        const file = new File([blob as Blob], "fileName.jpg", { type: "image/jpeg" })
        setMedia(file)
      }, 'image/jpeg');

      setFinalImage(dataUrl);
    });
  }, [movies]);

  function reset() {
    setUsername('')
    setPeriod(1)
    setMovies([])
    setFinalImage('')
  }

  async function shareTweet() {
    if (!session.data?.user) {
      return signIn("twitter")
    }
    const formData = new FormData()
    if (media) formData.append('media', media)

    const response = await fetch('/api/twitter/tweet', {
      method: 'POST',
      body: formData,
    })
    const data = await response.json()
    router.push(`https://x.com/${session.data.user.username}/status/${data.data.data.id}`)
  }

  return (
    <div className="min-h-svh bg-background flex flex-col items-center justify-center px-4 py-10">

      {/* Hero */}
      <div className="flex flex-col items-center mb-8">
        <Logo size={84} className="mb-5" />

        <h1 className="text-center text-4xl md:text-6xl font-bold tracking-tight uppercase leading-none">
          Letterboxd{" "}
          <span className="text-primary">Collage</span>
        </h1>

        <p className="text-center text-muted-foreground font-medium mt-3 text-sm md:text-base uppercase tracking-widest">
          Make a collage of your monthly movies
        </p>
      </div>

      {/* Form / Result */}
      <div className="w-full max-w-sm">
        {!finalImage && !isLoading && (
          <Card>
            <CardContent className="flex flex-col gap-4 pt-2">

              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  htmlFor="username"
                >
                  Username
                </Label>
                <Input
                  onChange={(e) => setUsername(e.target.value)}
                  value={username}
                  type="text"
                  id="username"
                  placeholder="alessandrordgs"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground"
                >
                  Period
                </Label>
                <Select onValueChange={(value) => setPeriod(parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full mt-2" onClick={getDiary}>
                Generate
              </Button>

            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {(isLoading || (movies.length > 0 && !finalImage)) && (
          <div className="flex flex-col items-center justify-center mt-8 gap-3">
            <ProgressCircle
              value={progress}
              className="size-24 text-primary"
              showValue
            />
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
              {isLoading ? "Fetching your films…" : "Rendering collage…"}
            </p>
          </div>
        )}

        {/* Collage result */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {finalImage && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
              Your collage is ready
            </p>

            <div className="border border-foreground shadow-[3px_3px_0px_0px_rgba(30,10,60,1)]">
              <NextImage
                src={finalImage}
                alt="Movie collage"
                height={500}
                width={500}
                className="block"
              />
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={shareTweet}
            >
              {session.data?.user ? "Share on X" : "Sign in & Share on X"}
            </Button>

            <Button variant="outline" className="w-full" onClick={reset}>
              Regenerate
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
