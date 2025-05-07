'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Imovies } from "@/interfaces/IMovies";
import { calculateGridColumns } from "@/lib/utils";

import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [movies, setMovies] = useState<Imovies[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [period, setPeriod] = useState(1)

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  async function getDiary() {
    if (!username) return alert('preencha o campo de úsuario')
    setIsLoading(true)
    const response = await fetch(`/api/letterboxd/diary/${username}?period=${period}`)
    const data = await response.json()
    setMovies(data)
    setIsLoading(false)
  }

  useEffect(() => {
    if (!movies.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const columns = calculateGridColumns(movies);
    const padding = 0; // Se quiser espaço entre imagens

    Promise.all(
      movies.map((movie) => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.src = movie.img as string;
          img.onload = () => resolve(img);
        });
      })
    ).then((images) => {
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

      
      let x = 0;
      let y = 0;
      let col = 0;
      let row = 0;

      images.forEach((img) => {
        ctx?.drawImage(img, x, y, img.width, img.height);

        x += imageWidths[col] + padding;
        col++;

        if (col === columns) {
          col = 0;
          x = 0;
          y += rowHeights[row] + padding;
          row++;
        }
      });

      const dataUrl = canvas.toDataURL("image/png");
      setFinalImage(dataUrl);
    });
  }, [movies]);

  function reset() {
    setUsername('')
    setPeriod(1)
    setMovies([])
    setFinalImage('')
  }
  return (
    <div className="flex max-w-3xl h-svh flex-col mx-auto items-center justify-center py-6">
      <div className="flex flex-col justify-center items-center ">
        <NextImage className="mb-4" src="https://a.ltrbxd.com/logos/letterboxd-decal-dots-pos-rgb-500px.png" alt="letterboxd logo" width={150} height={50} />
        <h1 className="text-center text-5xl font-bold">Letterboxd collage</h1>
        <p className="text-center font-light my-3 text-2xl">Make a collage of your Letterboxd movies each month</p>
      </div>
      <div>
        {movies.length === 0 ? <Card className="w-[30rem] h-[20rem] flex items-center justify-center">
          <CardContent>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label className="text-xl" htmlFor="email">Username</Label>
              <Input className="w-[20rem] p-4 py-6 mb-2 text-3xl" onChange={(e) => setUsername(e.target.value)} type="text" id="username" placeholder="alessandrordgs" />
              <Select onValueChange={(value) => setPeriod(parseInt(value))}>
                <SelectTrigger className="w-[20rem] ">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 ">1 Month</SelectItem>
                  <SelectItem value="3 ">3 Months</SelectItem>
                  <SelectItem value="12 ">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-[20rem] cursor-pointer mt-3" onClick={getDiary}>Generate</Button>
          </CardContent>
        </Card> : <Button onClick={reset}>
          Regerate
        </Button>}

        {isLoading ? 'carregando' : ''}
        <div className="mt-4">
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {finalImage ? (
            <NextImage src={finalImage} alt="Combined Grid" height={500} width={500} />
          ) : (
            <p>Processando imagem...</p>
          )}
        </div>
      </div>
    </div>
  );
}
