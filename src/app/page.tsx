'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ProgressCircle } from "@/components/ui/CircularProgressIndicator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Logo } from "@/components/ui/Logo";
import { Imovies } from "@/interfaces/IMovies";
import { IRecommendation } from "@/interfaces/IRecommendation";
import { calculateGridColumns, cn } from "@/lib/utils";
import axios from "axios";
import { ExternalLink } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import NextImage from "next/image";
import { type CarouselApi } from "@/components/ui/carousel";
import { useEffect, useRef, useState } from "react";

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  posterX: number,
  posterY: number,
  posterWidth: number,
  posterHeight: number,
  rating: number
) {
  const starSize = Math.max(8, Math.round(posterWidth * 0.09));
  const outerR = starSize / 2;
  const innerR = outerR * 0.4;
  const gap = Math.round(starSize * 0.15);
  const totalW = 5 * starSize + 4 * gap;
  const startX = posterX + (posterWidth - totalW) / 2;
  const stripH = Math.round(starSize * 1.4);
  const stripY = posterY + posterHeight - stripH;
  const centerY = stripY + stripH / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(20,24,28,0.75)';
  ctx.fillRect(posterX, stripY, posterWidth, stripH);

  for (let i = 0; i < 5; i++) {
    const cx = startX + i * (starSize + gap) + outerR;
    const filled = i + 1 <= rating;
    const half = !filled && Math.abs(i + 0.5 - rating) < 0.01;

    if (filled) {
      ctx.fillStyle = '#89A398';
      starPath(ctx, cx, centerY, outerR, innerR);
      ctx.fill();
    } else if (half) {
      ctx.strokeStyle = '#89A398';
      ctx.lineWidth = Math.max(1, Math.round(outerR * 0.2));
      starPath(ctx, cx, centerY, outerR, innerR);
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - outerR, centerY - outerR, outerR, outerR * 2);
      ctx.clip();
      ctx.fillStyle = '#89A398';
      starPath(ctx, cx, centerY, outerR, innerR);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.strokeStyle = '#89A398';
      ctx.lineWidth = Math.max(1, Math.round(outerR * 0.2));
      starPath(ctx, cx, centerY, outerR, innerR);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export default function Home() {
  const [movies, setMovies] = useState<Imovies[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [period, setPeriod] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finalImageUrlRef = useRef<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isGeneratingStories, setIsGeneratingStories] = useState(false);
  const [recommendations, setRecommendations] = useState<IRecommendation[]>([]);
  const [isLoadingRec, setIsLoadingRec] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [recIndex, setRecIndex] = useState(0);
  const [showRec, setShowRec] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [recMessage, setRecMessage] = useState(0);
  const [mode, setMode] = useState<'collage' | 'recommendations'>('collage');

  function switchMode(next: 'collage' | 'recommendations') {
    setMode(next);
    setRecommendations([]);
    setRecError(null);
    setShowRec(false);
    setRecMessage(0);
  }

  const recMessages = [
    'Analyzing your taste…',
    'Finding hidden gems…',
    "Checking what you've watched…",
    'Exploring undiscovered classics…',
    'Matching directors you love…',
    'Almost there…',
  ];

  useEffect(() => {
    if (!isLoadingRec) { setRecMessage(0); return; }
    const id = setInterval(() => setRecMessage((i) => (i + 1) % recMessages.length), 2500);
    return () => clearInterval(id);
  }, [isLoadingRec]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setRecIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => { carouselApi.off("select", onSelect); };
  }, [carouselApi]);

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
      const pairs = results
        .map((r, i) => ({
          img: r.status === 'fulfilled' ? (r as PromiseFulfilledResult<HTMLImageElement>).value : null,
          movie: movies[i],
        }))
        .filter((p): p is { img: HTMLImageElement; movie: Imovies } =>
          p.img !== null && p.img.width > 0 && p.img.height > 0
        );

      if (!pairs.length) return;
      const imageWidths: number[] = [];
      const rowHeights: number[] = [];

      let currentRow = 0;
      let currentCol = 0;
      let maxRowHeight = 0;

      pairs.forEach(({ img }, i) => {
        if (!imageWidths[currentCol] || img.width > imageWidths[currentCol]) {
          imageWidths[currentCol] = img.width;
        }

        if (img.height > maxRowHeight) {
          maxRowHeight = img.height;
        }

        currentCol++;
        if (currentCol === columns || i === pairs.length - 1) {
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

      ctx.fillStyle = '#14181C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const labelSize = Math.max(10, Math.round(totalWidth * 0.018));
      ctx.font = `500 ${labelSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#00E054';
      ctx.letterSpacing = `${Math.round(totalWidth * 0.004)}px`;
      ctx.fillText('● LETTERBOXD', cx, HEADER_HEIGHT * 0.28);

      const titleSize = Math.max(18, Math.round(totalWidth * 0.055));
      ctx.font = `700 ${titleSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.letterSpacing = `${Math.round(totalWidth * 0.002)}px`;
      ctx.fillText('THIS IS MY DIARY', cx, HEADER_HEIGHT * 0.58);

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

      ctx.letterSpacing = '0px';

      const lastRowCount = pairs.length % columns || columns;
      const lastRowStartIndex = pairs.length - lastRowCount;
      const lastRowWidth = imageWidths.slice(0, lastRowCount).reduce((sum, w) => sum + w + padding, 0);
      const lastRowOffset = Math.floor((totalWidth - lastRowWidth) / 2);

      let x = lastRowStartIndex === 0 ? lastRowOffset : 0;
      let y = HEADER_HEIGHT;
      let col = 0;
      let row = 0;

      pairs.forEach(({ img, movie }, i) => {
        ctx.drawImage(img, x, y, img.width, img.height);

        if (movie.rating != null) {
          drawStars(ctx, x, y, img.width, img.height, movie.rating);
        }

        x += imageWidths[col] + padding;
        col++;

        if (col === columns) {
          col = 0;
          row++;
          y += rowHeights[row - 1] + padding;
          x = i + 1 === lastRowStartIndex ? lastRowOffset : 0;
        }
      });

      const footerY = HEADER_HEIGHT + totalHeight;

      ctx.strokeStyle = '#2C3440';
      ctx.lineWidth = Math.max(1, Math.round(totalWidth * 0.002));
      ctx.beginPath();
      ctx.moveTo(totalWidth * 0.05, footerY + FOOTER_HEIGHT * 0.22);
      ctx.lineTo(totalWidth * 0.95, footerY + FOOTER_HEIGHT * 0.22);
      ctx.stroke();

      const dotR = Math.max(2, Math.round(totalWidth * 0.004));
      ctx.fillStyle = '#00E054';
      ctx.beginPath();
      ctx.arc(totalWidth * 0.05, footerY + FOOTER_HEIGHT * 0.22, dotR, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(totalWidth * 0.95, footerY + FOOTER_HEIGHT * 0.22, dotR, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const footerSize = Math.max(12, Math.round(totalWidth * 0.026));
      ctx.font = `500 ${footerSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#89A398';
      ctx.letterSpacing = `${Math.round(totalWidth * 0.002)}px`;
      ctx.fillText('collage.alessandrordgs.com.br', cx, footerY + FOOTER_HEIGHT * 0.65);

      canvas.toBlob((blob) => {
        if (!blob) return;
        if (finalImageUrlRef.current) URL.revokeObjectURL(finalImageUrlRef.current);
        const url = URL.createObjectURL(blob);
        finalImageUrlRef.current = url;
        setProgress(100);
        setFinalImage(url);
      }, 'image/png');
    });
  }, [movies, period]);

  function reset() {
    if (finalImageUrlRef.current) {
      URL.revokeObjectURL(finalImageUrlRef.current);
      finalImageUrlRef.current = null;
    }
    setUsername('')
    setPeriod(1)
    setMovies([])
    setFinalImage('')
    setError(null)
    setRecommendations([])
    setRecError(null)
    setShowRec(false)
    setRecIndex(0)
    setMode('collage')
  }

  function downloadCollage() {
    if (!finalImage) return
    const a = document.createElement('a')
    a.href = finalImage
    a.download = 'my-letterboxd-diary.png'
    a.click()
  }

  async function getRecommendations() {
    if (!username) return;
    setIsLoadingRec(true);
    setRecError(null);
    setRecommendations([]);
    try {
      const diaryRes = await axios.get(`/api/letterboxd/diary/${username}?period=12`);
      const films = (diaryRes.data as Imovies[])
        .filter((m) => m.rating != null)
        .map((m) => ({ title: m.name as string, rating: m.rating as number }));
      const response = await axios.post('/api/recommendations', { films, username });
      setRecommendations(response.data.recommendations);
      setShowRec(true);
    } catch {
      setRecError('Could not load recommendations. Please try again.');
    } finally {
      setIsLoadingRec(false);
    }
  }

  function downloadStoriesCollage() {
    if (!finalImage || isGeneratingStories) return;
    setIsGeneratingStories(true);

    const img = new Image();
    img.onerror = () => setIsGeneratingStories(false);
    img.onload = () => {
      const SW = img.width;
      const SH = Math.round(SW * 16 / 9);

      const sc = document.createElement('canvas');
      sc.width = SW;
      sc.height = SH;
      const sctx = sc.getContext('2d');
      if (!sctx) { setIsGeneratingStories(false); return; }

      sctx.fillStyle = '#14181C';
      sctx.fillRect(0, 0, SW, SH);

      let drawW = img.width;
      let drawH = img.height;
      if (drawH > SH) {
        const scale = SH / drawH;
        drawW = Math.round(drawW * scale);
        drawH = SH;
      }

      const ox = Math.round((SW - drawW) / 2);
      const oy = Math.round((SH - drawH) / 2);
      sctx.drawImage(img, ox, oy, drawW, drawH);

      sc.toBlob((blob) => {
        setIsGeneratingStories(false);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-letterboxd-diary-stories.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');
    };
    img.src = finalImage;
  }

  return (
    <div className="min-h-svh bg-background flex flex-col items-center justify-center px-4 py-10">

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

      <div className="w-full max-w-sm">
        {error && !isLoading && (
          <div className="border border-foreground bg-card px-4 py-3 mb-4 flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-widest text-destructive">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!finalImage && !isLoading && !(mode === 'recommendations' && (isLoadingRec || recommendations.length > 0)) && (
          <>
            <Card>
              <CardContent className="flex flex-col gap-4 pt-4">

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

                {mode === 'collage' && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                )}

                {mode === 'collage' && (
                  <Button className="w-full mt-2" onClick={getDiary}>
                    Generate
                  </Button>
                )}

                {mode === 'recommendations' && (
                  <div className="flex flex-col gap-1.5">
                    <Button className="w-full" onClick={getRecommendations} disabled={isLoadingRec}>
                      Get Recommendations
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Based on your last 12 months of diary
                    </p>
                  </div>
                )}

              </CardContent>
            </Card>
            <div className="flex items-center gap-3 mt-4">
              <Button
                className="flex-1"
                variant={mode === 'collage' ? 'default' : 'outline'}
                onClick={() => switchMode('collage')}
              >
                Collage
              </Button>
              <span className="text-xs text-muted-foreground uppercase tracking-widest shrink-0">or</span>
              <Button
                className="flex-1"
                variant={mode === 'recommendations' ? 'default' : 'outline'}
                onClick={() => switchMode('recommendations')}
              >
                Recommend
              </Button>
            </div>
          </>
        )}

        {mode === 'recommendations' && !finalImage && isLoadingRec && (
          <div className="flex flex-col gap-4">
            <div className="w-full flex flex-col gap-2">
              <div className="flex gap-3 border border-foreground bg-card p-3 animate-pulse">
                <div className="w-28 flex-none aspect-[2/3] bg-foreground/15" />
                <div className="flex flex-col gap-2.5 flex-1 justify-center">
                  <div className="h-3 bg-foreground/15 w-3/4" />
                  <div className="h-2.5 bg-foreground/10 w-1/3" />
                  <div className="h-2.5 bg-foreground/10 w-full" />
                  <div className="h-2.5 bg-foreground/10 w-full" />
                  <div className="h-2.5 bg-foreground/10 w-2/3" />
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground uppercase tracking-widest">
                {recMessages[recMessage]}
              </p>
            </div>
          </div>
        )}

        {mode === 'recommendations' && !finalImage && recommendations.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
              You might also like
            </p>
            <Carousel className="w-full" setApi={setCarouselApi}>
              <CarouselContent>
                {recommendations.map((rec, i) => (
                  <CarouselItem key={i}>
                    <div className="flex gap-3 border border-foreground bg-card p-3">
                      <div className="w-28 flex-none aspect-[2/3] overflow-hidden bg-muted">
                        {rec.posterUrl ? (
                          <NextImage
                            src={rec.posterUrl}
                            alt={rec.title}
                            width={112}
                            height={168}
                            unoptimized
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-2">
                            <p className="text-xs text-muted-foreground text-center leading-tight">{rec.title}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 justify-center min-w-0">
                        <div className="flex items-start gap-1.5">
                          <p className="text-sm font-bold text-foreground leading-tight">{rec.title}</p>
                          <a
                            href={`https://letterboxd.com/search/films/${encodeURIComponent(rec.title)}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 flex-none text-muted-foreground hover:text-primary transition-colors"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {rec.year}{rec.director ? ` · ${rec.director}` : ''}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{rec.explanation}</p>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex items-center justify-between mt-2">
                <CarouselPrevious className="static translate-y-0" />
                <p className="text-xs text-muted-foreground">{recIndex + 1} / {recommendations.length}</p>
                <CarouselNext className="static translate-y-0" />
              </div>
            </Carousel>
            {recError && (
              <div className="border border-foreground bg-card px-4 py-3 w-full flex flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-widest text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{recError}</p>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => { setRecommendations([]); setRecError(null); }}>
              New Search
            </Button>
          </div>
        )}

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

        <canvas ref={canvasRef} style={{ display: "none" }} />
        {finalImage && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
              {showRec ? 'You might also like' : 'Your collage is ready'}
            </p>

            {isLoadingRec && (
              <div className="w-full flex flex-col gap-2">
                <div className="flex gap-3 border border-foreground bg-card p-3 animate-pulse">
                  <div className="w-28 flex-none aspect-[2/3] bg-foreground/15" />
                  <div className="flex flex-col gap-2.5 flex-1 justify-center">
                    <div className="h-3 bg-foreground/15 w-3/4" />
                    <div className="h-2.5 bg-foreground/10 w-1/3" />
                    <div className="h-2.5 bg-foreground/10 w-full" />
                    <div className="h-2.5 bg-foreground/10 w-full" />
                    <div className="h-2.5 bg-foreground/10 w-2/3" />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground uppercase tracking-widest transition-all">
                  {recMessages[recMessage]}
                </p>
              </div>
            )}

            {!showRec && !isLoadingRec && (
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
                  unoptimized
                  style={{ width: '100%', height: 'auto' }}
                  className="block select-none"
                />
              </div>
            )}

            {showRec && recommendations.length > 0 && (
              <Carousel className="w-full" setApi={setCarouselApi}>
                <CarouselContent>
                  {recommendations.map((rec, i) => (
                    <CarouselItem key={i}>
                      <div className="flex gap-3 border border-foreground bg-card p-3">
                        <div className="w-28 flex-none aspect-[2/3] overflow-hidden bg-muted">
                          {rec.posterUrl ? (
                            <NextImage
                              src={rec.posterUrl}
                              alt={rec.title}
                              width={112}
                              height={168}
                              unoptimized
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-2">
                              <p className="text-xs text-muted-foreground text-center leading-tight">{rec.title}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 justify-center min-w-0">
                          <div className="flex items-start gap-1.5">
                            <p className="text-sm font-bold text-foreground leading-tight">
                              {rec.title}
                            </p>
                            <a
                              href={`https://letterboxd.com/search/films/${encodeURIComponent(rec.title)}/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 flex-none text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink size={13} />
                            </a>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {rec.year}{rec.director ? ` · ${rec.director}` : ''}
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{rec.explanation}</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex items-center justify-between mt-2">
                  <CarouselPrevious className="static translate-y-0" />
                  <p className="text-xs text-muted-foreground">{recIndex + 1} / {recommendations.length}</p>
                  <CarouselNext className="static translate-y-0" />
                </div>
              </Carousel>
            )}

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
                <div className="h-px bg-border mx-2" />
                <button
                  className="w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  disabled={isGeneratingStories}
                  onClick={() => { downloadStoriesCollage(); setContextMenu(null); }}
                >
                  {isGeneratingStories ? '… Generating…' : '↕ Download for Stories'}
                </button>
              </div>
            )}

            {!showRec && !isLoadingRec && (
              <div className="w-full flex flex-col gap-1.5">
                <Tooltip content={recommendations.length > 0 ? 'See your personalized film picks' : 'Get picks based on your diary'}>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={recommendations.length > 0 ? () => setShowRec(true) : getRecommendations}
                  >
                    {recommendations.length > 0 ? 'View Recommendations' : 'Get Recommendations'}
                  </Button>
                </Tooltip>
                {recommendations.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground">
                    Based on your last 12 months of diary
                  </p>
                )}
              </div>
            )}

            {showRec && (
              <Tooltip content="Return to your collage">
                <Button variant="secondary" className="w-full" onClick={() => setShowRec(false)}>
                  ← Back to Collage
                </Button>
              </Tooltip>
            )}

            {recError && (
              <div className="border border-foreground bg-card px-4 py-3 w-full flex flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-widest text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{recError}</p>
              </div>
            )}

            {!showRec && !isLoadingRec && (
              <div className="grid grid-cols-3 gap-2 w-full">
                <Tooltip content="Save collage as PNG">
                  <Button variant="secondary" onClick={downloadCollage}>
                    Download
                  </Button>
                </Tooltip>
                <Tooltip content="Download formatted for Instagram Stories (9:16)">
                  <Button
                    variant="secondary"
                    onClick={downloadStoriesCollage}
                    disabled={isGeneratingStories}
                  >
                    {isGeneratingStories ? '…' : 'Stories'}
                  </Button>
                </Tooltip>
                <Tooltip content="Start a new search">
                  <Button variant="outline" onClick={reset}>
                    New Search
                  </Button>
                </Tooltip>
              </div>
            )}

            {showRec && (
              <Tooltip content="Start a new search">
                <Button variant="outline" className="w-full" onClick={reset}>
                  New Search
                </Button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
