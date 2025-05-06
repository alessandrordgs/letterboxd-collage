'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  async function getDiary() {
    if (!username) return alert('preencha o campo de úsuario')
    setIsLoading(true)
    const response = await fetch(`/api/letterboxd/diary/${username}`)
    const data = await response.json()
    setMovies(data)
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col  items-center justify-center py-6">
      <div>
        <h1 className="text-center">Letterboxd Month</h1>
        <span className="text-center">Create letterboxd collage for month</span>
      </div>
      <div>
        <Card>
          <CardContent>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="email">Username</Label>
              <Input onChange={(e) => setUsername(e.target.value)} type="text" id="username" placeholder="alessandrordgs" />
            </div>

            <Button onClick={getDiary}>Generate</Button>
          </CardContent>
        </Card>

        {isLoading ? 'carregando' : (
          <div className="grid grid-cols-1 mt-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {movies.map((item) => {
              return (
                <div key={item.name} className="flex flex-col items-center">
                  <Image src={item.img} alt={item.name} height={200} width={200} />
                  <span>{item.name}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}
