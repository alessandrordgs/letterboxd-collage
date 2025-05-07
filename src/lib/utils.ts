import { Imovies } from "@/interfaces/IMovies"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateGridColumns(movies: Imovies[]) {
  const total = movies.length
  const squareRoot = Math.ceil(Math.sqrt(total))
  return squareRoot
}
