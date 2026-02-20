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
import NextImage from "next/image";
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
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    function close() { setContextMenu(null) }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  async function copyToClipboard() {
    if (!finalImage) return;
    try {
      const blob = await fetch(finalImage).then(r => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    } catch {
      downloadCollage();
    }
    setContextMenu(null);
  }

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
    setError(null)
    try {
      const response = await axios.get(`/api/letterboxd/diary/${username}?period=${period}`)
      const data = response.data
      if (data.length === 0) {
        setError('No films found for this period.')
      } else {
        setProgress(100)
        setMovies(data)
      }
      setIsLoading(false)
    } catch (err) {
      setProgress(0);
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError(`User "${username}" not found on Letterboxd.`)
      } else {
        setError('Something went wrong. Please try again.')
      }
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

      const HEADER_HEIGHT = Math.round(totalWidth * 0.12);
      const FOOTER_HEIGHT = Math.round(totalWidth * 0.065);
      const cx = totalWidth / 2;

      canvas.width = totalWidth;
      canvas.height = totalHeight + HEADER_HEIGHT + FOOTER_HEIGHT;

      if (!ctx) return;

      // Background
      ctx.fillStyle = '#14181C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- HEADER ---
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Brand label "● LETTERBOXD"
      const labelSize = Math.max(10, Math.round(totalWidth * 0.018));
      ctx.font = `500 ${labelSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#00E054';
      ctx.letterSpacing = `${Math.round(totalWidth * 0.004)}px`;
      ctx.fillText('● LETTERBOXD', cx, HEADER_HEIGHT * 0.28);

      // Title "THIS IS MY DIARY"
      const titleSize = Math.max(18, Math.round(totalWidth * 0.055));
      ctx.font = `700 ${titleSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.letterSpacing = `${Math.round(totalWidth * 0.002)}px`;
      ctx.fillText('THIS IS MY DIARY', cx, HEADER_HEIGHT * 0.58);

      // Period subtitle
      const now = new Date();
      const periodLabel = period === 1
        ? now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
        : period === 3
          ? 'LAST 3 MONTHS'
          : 'LAST 12 MONTHS';
      const subtitleSize = Math.max(10, Math.round(totalWidth * 0.022));
      ctx.font = `600 ${subtitleSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#FF8000';
      ctx.letterSpacing = `${Math.round(totalWidth * 0.003)}px`;
      ctx.fillText(periodLabel, cx, HEADER_HEIGHT * 0.84);

      // Reset letterSpacing for images
      ctx.letterSpacing = '0px';

      // --- GRID (offset by HEADER_HEIGHT) ---
      // Center last row when it has fewer images than columns
      const lastRowCount = images.length % columns || columns;
      const lastRowStartIndex = images.length - lastRowCount;
      const lastRowWidth = imageWidths.slice(0, lastRowCount).reduce((sum, w) => sum + w + padding, 0);
      const lastRowOffset = Math.floor((totalWidth - lastRowWidth) / 2);

      let x = lastRowStartIndex === 0 ? lastRowOffset : 0;
      let y = HEADER_HEIGHT;
      let col = 0;
      let row = 0;

      images.forEach((img, i) => {
        ctx.drawImage(img, x, y, img.width, img.height);

        x += imageWidths[col] + padding;
        col++;

        if (col === columns) {
          col = 0;
          row++;
          y += rowHeights[row - 1] + padding;
          x = i + 1 === lastRowStartIndex ? lastRowOffset : 0;
        }
      });

      // --- FOOTER ---
      const footerY = HEADER_HEIGHT + totalHeight;

      // Separator line
      ctx.strokeStyle = '#2C3440';
      ctx.lineWidth = Math.max(1, Math.round(totalWidth * 0.002));
      ctx.beginPath();
      ctx.moveTo(totalWidth * 0.05, footerY + FOOTER_HEIGHT * 0.22);
      ctx.lineTo(totalWidth * 0.95, footerY + FOOTER_HEIGHT * 0.22);
      ctx.stroke();

      // Green accent dots flanking the line
      const dotR = Math.max(2, Math.round(totalWidth * 0.004));
      ctx.fillStyle = '#00E054';
      ctx.beginPath();
      ctx.arc(totalWidth * 0.05, footerY + FOOTER_HEIGHT * 0.22, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(totalWidth * 0.95, footerY + FOOTER_HEIGHT * 0.22, dotR, 0, Math.PI * 2);
      ctx.fill();

      // URL
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const footerSize = Math.max(12, Math.round(totalWidth * 0.026));
      ctx.font = `500 ${footerSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#89A398';
      ctx.letterSpacing = `${Math.round(totalWidth * 0.002)}px`;
      ctx.fillText('collage.alessandrordgs.com.br', cx, footerY + FOOTER_HEIGHT * 0.65);

      const dataUrl = canvas.toDataURL("image/png");
      setFinalImage(dataUrl);
    });
  }, [movies, period]);

  function reset() {
    setUsername('')
    setPeriod(1)
    setMovies([])
    setFinalImage('')
    setError(null)
  }

  function downloadCollage() {
    if (!finalImage) return
    const a = document.createElement('a')
    a.href = finalImage
    a.download = 'my-letterboxd-diary.png'
    a.click()
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
        {error && !isLoading && (
          <div className="border border-foreground bg-card px-4 py-3 mb-4 flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-widest text-destructive">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

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

            <div
              className="border border-foreground shadow-[3px_3px_0px_0px_rgba(30,10,60,1)] w-full relative"
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY });
              }}
            >
              <NextImage
                src={finalImage}
                alt="Movie collage"
                height={500}
                width={500}
                style={{ width: '100%', height: 'auto' }}
                className="block select-none"
              />
            </div>

            {contextMenu && (
              <div
                className="fixed z-50 min-w-44 border border-foreground bg-card py-1"
                style={{ top: contextMenu.y, left: contextMenu.x }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => { downloadCollage(); setContextMenu(null); }}
                >
                  ↓ Download PNG
                </button>
                <div className="h-px bg-border mx-2" />
                <button
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={copyToClipboard}
                >
                  ⎘ Copy to Clipboard
                </button>
              </div>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={downloadCollage}
            >
              Download
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
