'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { ProgressCircle } from '@/components/ui/CircularProgressIndicator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Logo } from '@/components/ui/Logo'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Activity, ExternalLink, LayoutGrid, Sparkles, Users } from 'lucide-react'
import NextImage from 'next/image'
import { DiaryProvider, useDiary, REC_MESSAGES, type Mode } from '@/context/DiaryContext'

export default function Home() {
  return (
    <DiaryProvider>
      <HomeContent />
    </DiaryProvider>
  )
}

function HomeContent() {
  const {
    movies,
    isLoading,
    username,
    setUsername,
    period,
    setPeriod,
    finalImage,
    progress,
    error,
    contextMenu,
    setContextMenu,
    isGeneratingStories,
    recommendations,
    isLoadingRec,
    recError,
    recIndex,
    showRec,
    setShowRec,
    carouselApi,
    setCarouselApi,
    recMessage,
    mode,
    heatmapData,
    username2,
    setUsername2,
    collaborativeData,
    getDiary,
    getHeatmap,
    getCollaborative,
    getRecommendations,
    reset,
    switchMode,
    downloadCollage,
    downloadStoriesCollage,
    copyToClipboard,
  } = useDiary()

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

      <div className={cn("w-full", mode === 'heatmap' && finalImage ? "max-w-3xl" : "max-w-sm")}>
        {error && !isLoading && (
          <div className="border border-foreground bg-card px-4 py-3 mb-4 flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-widest text-destructive">Error</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {!finalImage && !isLoading && !(mode === 'recommendations' && (isLoadingRec || recommendations.length > 0)) && (
          <Card>
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground" htmlFor="username">
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

              <Tabs value={mode === 'recommendations' ? 'recommendations' : mode} onValueChange={(v) => switchMode(v as Mode)}>
                <TabsList className="w-full grid grid-cols-4 p-1">
                  <Tooltip content="Generate a poster grid from your diary">
                    <TabsTrigger value="collage" className="flex-col py-2.5 gap-1">
                      <LayoutGrid className="size-3.5" />
                      <span className="text-[10px] tracking-widest uppercase font-bold">Collage</span>
                    </TabsTrigger>
                  </Tooltip>
                  <Tooltip content="See your film activity across the year">
                    <TabsTrigger value="heatmap" className="flex-col py-2.5 gap-1">
                      <Activity className="size-3.5" />
                      <span className="text-[10px] tracking-widest uppercase font-bold">Heatmap</span>
                    </TabsTrigger>
                  </Tooltip>
                  <Tooltip content="Compare your diary side by side with a friend's">
                    <TabsTrigger value="collaborative" className="flex-col py-2.5 gap-1">
                      <Users className="size-3.5" />
                      <span className="text-[10px] tracking-widest uppercase font-bold">Compare</span>
                    </TabsTrigger>
                  </Tooltip>
                  <Tooltip content="Get AI film picks tailored to your taste">
                    <TabsTrigger value="recommendations" className="flex-col py-2.5 gap-1">
                      <Sparkles className="size-3.5" />
                      <span className="text-[10px] tracking-widest uppercase font-bold">Picks</span>
                    </TabsTrigger>
                  </Tooltip>
                </TabsList>

                <TabsContent value="collage" className="flex flex-col gap-3 mt-4">
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
                  <Tooltip content="Downloads a PNG grid of your movie posters with star ratings">
                    <Button className="w-full" onClick={getDiary}>
                      Generate Collage
                    </Button>
                  </Tooltip>
                </TabsContent>

                <TabsContent value="heatmap" className="flex flex-col gap-3 mt-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A contribution-style graph showing films watched per day across the current year.
                  </p>
                  <Tooltip content="Generates a GitHub-style activity heatmap for this calendar year">
                    <Button className="w-full" variant="outline" onClick={getHeatmap}>
                      Generate Heatmap
                    </Button>
                  </Tooltip>
                </TabsContent>

                <TabsContent value="collaborative" className="flex flex-col gap-3 mt-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Compare with
                    </Label>
                    <Input
                      onChange={(e) => setUsername2(e.target.value)}
                      value={username2}
                      type="text"
                      placeholder="their username"
                    />
                  </div>
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
                  <Tooltip content={!username2 ? "Enter a second username to compare" : "Side-by-side collage — shared films highlighted in green"}>
                    <Button className="w-full" variant="outline" onClick={getCollaborative} disabled={!username2}>
                      Generate Collaborative
                    </Button>
                  </Tooltip>
                  <p className="text-center text-xs text-muted-foreground">
                    Shared films are highlighted in green
                  </p>
                </TabsContent>

                <TabsContent value="recommendations" className="flex flex-col gap-3 mt-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Gemini analyzes your rated films from the past 12 months and finds picks tailored to your taste.
                  </p>
                  <Tooltip content="Powered by Google Gemini — reads your diary and suggests films you'd likely love">
                    <Button className="w-full" variant="outline" onClick={getRecommendations} disabled={isLoadingRec}>
                      Get Recommendations
                    </Button>
                  </Tooltip>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
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
                {REC_MESSAGES[recMessage]}
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
            <Button variant="outline" className="w-full" onClick={reset}>
              New Search
            </Button>
          </div>
        )}

        {(isLoading || (movies.length > 0 && !finalImage) || (heatmapData !== null && !finalImage) || (collaborativeData !== null && !finalImage)) && (
          <div className="flex flex-col items-center justify-center mt-8 gap-3">
            <ProgressCircle value={progress} className="size-24 text-primary" showValue />
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
              {isLoading
                ? "Fetching your diary…"
                : mode === 'heatmap'
                  ? "Rendering heatmap…"
                  : mode === 'collaborative'
                    ? "Rendering collaborative collage…"
                    : "Rendering collage…"}
            </p>
          </div>
        )}

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
                  {REC_MESSAGES[recMessage]}
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
                  <Button variant="secondary" onClick={downloadStoriesCollage} disabled={isGeneratingStories}>
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
  )
}
