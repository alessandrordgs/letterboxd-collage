'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Imovies } from "@/interfaces/IMovies";

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
    const imageSize = 100; // Width & height per image
    const columns = 4;
    const rows = Math.ceil(movies.length / columns);

    canvas.width = columns * imageSize;
    canvas.height = rows * imageSize;

    Promise.all(
      movies.map((movie) => {
        return new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          // img.crossOrigin = "anonymous"; // Prevent CORS issues
          img.src = movie.img as string;
          img.onload = () => resolve(img);
        });
      })
    ).then((images) => {
      console.log(images)
      images.forEach((img, index) => {
        const x = (index % columns) * imageSize;
        const y = Math.floor(index / columns) * imageSize;
        ctx?.drawImage(img, x, y, imageSize, imageSize);
      });

      // Export canvas to data URL
      const dataUrl = canvas.toDataURL("image/png");
      setFinalImage(dataUrl);
    });
  }, [movies]);

  console.log(finalImage)
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
        </Card> : <Button>
          Regerate
        </Button>}

        {/* {isLoading ? 'carregando' : (
          <div className="grid grid-cols-1 mt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {movies.map((item) => {
              return (
                <div key={item.name} className="flex flex-col items-center">
                  <Image src={item.img as string} alt={item.name as string} height={100} width={100} />
                </div>
              )
            })}
          </div>
        )} */}
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
