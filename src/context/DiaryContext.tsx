'use client'
import { Imovies } from '@/interfaces/IMovies'
import { IRecommendation } from '@/interfaces/IRecommendation'
import { calculateGridColumns } from '@/lib/utils'
import axios from 'axios'
import { type CarouselApi } from '@/components/ui/carousel'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export type Mode = 'collage' | 'recommendations' | 'heatmap' | 'collaborative'

export const REC_MESSAGES: string[] = [
  'Analyzing your taste...',
  'Finding hidden gems...',
  'Consulting the cinephiles...',
  'Crunching the numbers...',
  'Almost there...',
  'Finalizing picks...',
]

export interface DiaryContextValue {
  movies: Imovies[]
  isLoading: boolean
  username: string
  setUsername: (v: string) => void
  period: number
  setPeriod: (v: number) => void
  finalImage: string | null
  progress: number
  error: string | null
  contextMenu: { x: number; y: number } | null
  setContextMenu: (v: { x: number; y: number } | null) => void
  isGeneratingStories: boolean
  recommendations: IRecommendation[]
  isLoadingRec: boolean
  recError: string | null
  recIndex: number
  showRec: boolean
  setShowRec: (v: boolean) => void
  carouselApi: CarouselApi | undefined
  setCarouselApi: (api: CarouselApi | undefined) => void
  recMessage: number
  mode: Mode
  heatmapData: { date: string; count: number }[] | null
  username2: string
  setUsername2: (v: string) => void
  collaborativeData: { user1: Imovies[]; user2: Imovies[]; common: Set<string> } | null
  getDiary: () => Promise<void>
  getHeatmap: () => Promise<void>
  getCollaborative: () => Promise<void>
  getRecommendations: () => Promise<void>
  reset: () => void
  switchMode: (next: Mode) => void
  downloadCollage: () => void
  downloadStoriesCollage: () => void
  copyToClipboard: () => Promise<void>
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
}

function drawStars(ctx: CanvasRenderingContext2D, posterX: number, posterY: number, posterWidth: number, posterHeight: number, rating: number) {
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

const DiaryContext = createContext<DiaryContextValue | null>(null)

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [movies, setMovies] = useState<Imovies[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [period, setPeriod] = useState(1)
  const finalImageUrlRef = useRef<string | null>(null)
  const [finalImage, setFinalImage] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isGeneratingStories, setIsGeneratingStories] = useState(false)
  const [recommendations, setRecommendations] = useState<IRecommendation[]>([])
  const [isLoadingRec, setIsLoadingRec] = useState(false)
  const [recError, setRecError] = useState<string | null>(null)
  const [recIndex, setRecIndex] = useState(0)
  const [showRec, setShowRec] = useState(false)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [recMessage, setRecMessage] = useState(0)
  const [mode, setMode] = useState<Mode>('collage')
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[] | null>(null)
  const [username2, setUsername2] = useState('')
  const [collaborativeData, setCollaborativeData] = useState<{ user1: Imovies[]; user2: Imovies[]; common: Set<string> } | null>(null)

  function switchMode(next: Mode) {
    setMode(next);
    setRecommendations([]);
    setRecError(null);
    setShowRec(false);
    setRecMessage(0);
  }

  async function getDiary() {
    if (!username) return alert('preencha o campo de úsuario')
    setIsLoading(true)
    setProgress(0)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
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
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setIsLoading(false);
    }
  }

  async function getHeatmap() {
    if (!username) return alert('preencha o campo de úsuario')
    setMode('heatmap')
    setIsLoading(true)
    setProgress(0)
    setError(null)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    let p = 0
    timerRef.current = setInterval(() => {
      if (p < 80) { p = Math.min(80, p + 4); setProgress(p); }
    }, 200)
    try {
      const response = await axios.get(`/api/letterboxd/heatmap/${username}`)
      setHeatmapData(response.data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError(`User "${username}" not found on Letterboxd.`)
      } else {
        setError('Something went wrong. Please try again.')
      }
      setMode('collage')
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setIsLoading(false)
    }
  }

  async function getCollaborative() {
    if (!username || !username2) return alert('preencha os dois campos de usuário')
    setMode('collaborative')
    setIsLoading(true)
    setProgress(0)
    setError(null)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    let p = 0
    timerRef.current = setInterval(() => {
      if (p < 75) { p = Math.min(75, p + 2); setProgress(p); }
    }, 300)
    try {
      const [res1, res2] = await Promise.all([
        axios.get(`/api/letterboxd/diary/${username}?period=${period}`),
        axios.get(`/api/letterboxd/diary/${username2}?period=${period}`)
      ])
      const user1 = res1.data as Imovies[]
      const user2 = res2.data as Imovies[]
      const norm = (t: string | null | undefined) => (t ?? '').toLowerCase().trim()
      const titles2 = new Set(user2.map(f => norm(f.name)))
      const common = new Set(user1.map(f => norm(f.name)).filter(t => t && titles2.has(t)))
      setCollaborativeData({ user1, user2, common })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError('One of the users was not found on Letterboxd.')
      } else {
        setError('Something went wrong. Please try again.')
      }
      setMode('collage')
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setIsLoading(false)
    }
  }

  async function getRecommendations() {
    if (!username) return alert('preencha o campo de úsuario');
    setMode('recommendations');
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

  function reset() {
    if (finalImageUrlRef.current) {
      URL.revokeObjectURL(finalImageUrlRef.current);
      finalImageUrlRef.current = null;
    }
    setUsername('')
    setPeriod(1)
    setMovies([])
    setFinalImage(null)
    setError(null)
    setRecommendations([])
    setRecError(null)
    setShowRec(false)
    setRecIndex(0)
    setHeatmapData(null)
    setCollaborativeData(null)
    setUsername2('')
    setMode('collage')
  }

  function downloadCollage() {
    if (!finalImage) return
    const a = document.createElement('a')
    a.href = finalImage
    a.download = 'my-letterboxd-diary.png'
    a.click()
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isLoadingRec) { setRecMessage(0); return; }
    const id = setInterval(() => setRecMessage((i) => (i + 1) % REC_MESSAGES.length), 2500);
    return () => clearInterval(id);
  }, [isLoadingRec]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setRecIndex(carouselApi.selectedScrollSnap());
    carouselApi.on('select', onSelect);
    return () => { carouselApi.off('select', onSelect); };
  }, [carouselApi]);

  useEffect(() => {
    if (!contextMenu) return;
    function close() { setContextMenu(null); }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!movies.length) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const columns = calculateGridColumns(movies);
    const padding = 0;

    Promise.allSettled(
      movies.map((movie) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = movie.img as string;
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${movie.img}`));
      }))
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
      let currentRow = 0, currentCol = 0, maxRowHeight = 0;

      pairs.forEach(({ img }, i) => {
        if (!imageWidths[currentCol] || img.width > imageWidths[currentCol]) imageWidths[currentCol] = img.width;
        if (img.height > maxRowHeight) maxRowHeight = img.height;
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

      const periodLabel = period === 1 ? 'LAST MONTH' : period === 3 ? 'LAST 3 MONTHS' : 'LAST 12 MONTHS';
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
      let col = 0, row = 0;

      pairs.forEach(({ img, movie }, i) => {
        ctx.drawImage(img, x, y, img.width, img.height);
        if (movie.rating != null) drawStars(ctx, x, y, img.width, img.height, movie.rating);
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

  useEffect(() => {
    if (heatmapData === null) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CELL = 16, GAP = 4, STEP = CELL + GAP, WEEKS = 53;
    const LEFT_PAD = 50, RIGHT_PAD = 30, TOP_PAD = 28;
    const HEADER_HEIGHT = 110, FOOTER_HEIGHT = 55, LEGEND_H = 28;
    const CW = LEFT_PAD + WEEKS * STEP + RIGHT_PAD;
    const GRID_HEIGHT = 7 * STEP;
    const CH = HEADER_HEIGHT + TOP_PAD + GRID_HEIGHT + LEGEND_H + FOOTER_HEIGHT;

    canvas.width = CW;
    canvas.height = CH;

    ctx.fillStyle = '#14181C';
    ctx.fillRect(0, 0, CW, CH);

    const cx = CW / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.letterSpacing = `${Math.round(CW * 0.003)}px`;
    ctx.font = `500 ${Math.max(10, Math.round(CW * 0.012))}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = '#00E054';
    ctx.fillText('● LETTERBOXD', cx, HEADER_HEIGHT * 0.28);

    ctx.letterSpacing = `${Math.round(CW * 0.002)}px`;
    ctx.font = `700 ${Math.max(18, Math.round(CW * 0.04))}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('THIS IS MY DIARY', cx, HEADER_HEIGHT * 0.58);

    ctx.letterSpacing = `${Math.round(CW * 0.003)}px`;
    ctx.font = `600 ${Math.max(10, Math.round(CW * 0.016))}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = '#FF8000';
    const now = new Date();
    ctx.fillText(String(now.getFullYear()), cx, HEADER_HEIGHT * 0.84);
    ctx.letterSpacing = '0px';

    const dateMap = new Map<string, number>();
    heatmapData.forEach(({ date, count }) => dateMap.set(date, count));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeStart = new Date(today.getFullYear(), 0, 1);
    const dow = rangeStart.getDay();
    rangeStart.setDate(rangeStart.getDate() - (dow === 0 ? 6 : dow - 1));

    const GRID_LEFT = LEFT_PAD;
    const GRID_TOP = HEADER_HEIGHT + TOP_PAD;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    ctx.font = `500 ${Math.max(8, Math.round(CW * 0.009))}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = '#8395A7';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    let lastMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      const d0 = new Date(rangeStart);
      d0.setDate(d0.getDate() + w * 7);
      const m = d0.getMonth();
      if (m !== lastMonth) {
        ctx.fillText(monthNames[m], GRID_LEFT + w * STEP, HEADER_HEIGHT + TOP_PAD / 2);
        lastMonth = m;
      }
    }

    const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];
    ctx.textAlign = 'right';
    for (let d = 0; d < 7; d++) {
      if (dayLabels[d]) {
        ctx.fillText(dayLabels[d], GRID_LEFT - 6, GRID_TOP + d * STEP + CELL / 2);
      }
    }

    const cellColors = ['#2C3033', '#662800', '#994000', '#CC5500', '#FF8000'];
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const cellDate = new Date(rangeStart);
        cellDate.setDate(cellDate.getDate() + w * 7 + d);
        if (cellDate > today) continue;
        const dateStr = cellDate.toISOString().substring(0, 10);
        const count = dateMap.get(dateStr) ?? 0;
        ctx.fillStyle = cellColors[Math.min(count, 4)];
        ctx.fillRect(GRID_LEFT + w * STEP, GRID_TOP + d * STEP, CELL, CELL);
      }
    }

    const legendY = GRID_TOP + GRID_HEIGHT + 8;
    const legendTotalW = cellColors.length * (CELL + 4) - 4;
    const legendX = GRID_LEFT + WEEKS * STEP - legendTotalW - 52;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8395A7';
    ctx.textBaseline = 'middle';
    ctx.fillText('Less', legendX - 4, legendY + CELL / 2);
    for (let i = 0; i < cellColors.length; i++) {
      ctx.fillStyle = cellColors[i];
      ctx.fillRect(legendX + i * (CELL + 4), legendY, CELL, CELL);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8395A7';
    ctx.fillText('More', legendX + cellColors.length * (CELL + 4) + 2, legendY + CELL / 2);

    const footerY = CH - FOOTER_HEIGHT;
    ctx.fillStyle = '#1C2228';
    ctx.fillRect(0, footerY, CW, FOOTER_HEIGHT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = `${Math.round(CW * 0.002)}px`;
    ctx.font = `500 ${Math.max(9, Math.round(CW * 0.01))}px 'Space Grotesk', sans-serif`;
    ctx.fillStyle = '#8395A7';
    ctx.fillText(`@${username}    collage.alessandrordgs.com.br`, cx, footerY + FOOTER_HEIGHT / 2);

    canvas.toBlob((blob) => {
      if (!blob) return;
      if (finalImageUrlRef.current) URL.revokeObjectURL(finalImageUrlRef.current);
      const url = URL.createObjectURL(blob);
      finalImageUrlRef.current = url;
      setProgress(100);
      setFinalImage(url);
    }, 'image/png');
  }, [heatmapData]);

  useEffect(() => {
    if (!collaborativeData) return;
    const { user1, user2, common } = collaborativeData;
    const canvas = document.createElement('canvas');
    const padding = 0;
    const norm = (t: string | null | undefined) => (t ?? '').toLowerCase().trim();

    function loadImages(films: Imovies[]) {
      return Promise.allSettled(
        films.map(movie => new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.src = movie.img as string;
          img.onload = () => resolve(img);
          img.onerror = () => reject();
        }))
      );
    }

    Promise.all([loadImages(user1), loadImages(user2)]).then(([r1, r2]) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const pairs1 = r1
        .map((r, i) => ({ img: r.status === 'fulfilled' ? r.value : null, movie: user1[i] }))
        .filter((p): p is { img: HTMLImageElement; movie: Imovies } => p.img !== null && p.img.width > 0);

      const pairs2 = r2
        .map((r, i) => ({ img: r.status === 'fulfilled' ? r.value : null, movie: user2[i] }))
        .filter((p): p is { img: HTMLImageElement; movie: Imovies } => p.img !== null && p.img.width > 0);

      if (!pairs1.length && !pairs2.length) return;

      function calcGrid(pairs: { img: HTMLImageElement; movie: Imovies }[], columns: number) {
        const imageWidths: number[] = [];
        const rowHeights: number[] = [];
        let col = 0, row = 0, maxH = 0;
        pairs.forEach(({ img }, i) => {
          if (!imageWidths[col] || img.width > imageWidths[col]) imageWidths[col] = img.width;
          if (img.height > maxH) maxH = img.height;
          col++;
          if (col === columns || i === pairs.length - 1) {
            rowHeights[row] = maxH;
            row++;
            col = 0;
            maxH = 0;
          }
        });
        const totalWidth = imageWidths.reduce((s, w) => s + w + padding, 0);
        const totalHeight = rowHeights.reduce((s, h) => s + h + padding, 0);
        return { imageWidths, rowHeights, totalWidth, totalHeight };
      }

      const cols1 = calculateGridColumns(pairs1.map(p => p.movie));
      const cols2 = calculateGridColumns(pairs2.map(p => p.movie));
      const g1 = calcGrid(pairs1, cols1);
      const g2 = calcGrid(pairs2, cols2);

      const DIVIDER = 48;
      const totalWidth = g1.totalWidth + DIVIDER + g2.totalWidth;
      const totalHeight = Math.max(g1.totalHeight, g2.totalHeight);
      const HEADER_HEIGHT = Math.round(totalWidth * 0.1);
      const FOOTER_HEIGHT = Math.round(totalWidth * 0.055);
      const cx = totalWidth / 2;

      canvas.width = totalWidth;
      canvas.height = totalHeight + HEADER_HEIGHT + FOOTER_HEIGHT;

      ctx.fillStyle = '#14181C';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.letterSpacing = `${Math.round(totalWidth * 0.004)}px`;
      ctx.font = `500 ${Math.max(10, Math.round(totalWidth * 0.012))}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#00E054';
      ctx.fillText('● LETTERBOXD', cx, HEADER_HEIGHT * 0.28);

      ctx.letterSpacing = `${Math.round(totalWidth * 0.002)}px`;
      ctx.font = `700 ${Math.max(18, Math.round(totalWidth * 0.038))}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('THIS IS OUR DIARY', cx, HEADER_HEIGHT * 0.58);

      ctx.letterSpacing = `${Math.round(totalWidth * 0.003)}px`;
      ctx.font = `600 ${Math.max(10, Math.round(totalWidth * 0.016))}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#FF8000';
      ctx.fillText(`@${username}  ×  @${username2}`, cx, HEADER_HEIGHT * 0.84);
      ctx.letterSpacing = '0px';

      function drawGrid(
        c: CanvasRenderingContext2D,
        pairs: { img: HTMLImageElement; movie: Imovies }[],
        grid: ReturnType<typeof calcGrid>,
        columns: number,
        offsetX: number
      ) {
        let col = 0, row = 0;
        let x = offsetX, y = HEADER_HEIGHT;
        pairs.forEach(({ img, movie }) => {
          const w = grid.imageWidths[col];
          const h = grid.rowHeights[row];
          c.drawImage(img, x, y, w, h);
          if (movie.rating != null) drawStars(c, x, y, w, h, movie.rating);
          if (common.has(norm(movie.name))) {
            c.save();
            c.strokeStyle = '#00E054';
            c.lineWidth = Math.max(4, Math.round(w * 0.04));
            c.strokeRect(x, y, w, h);
            c.restore();
          }
          col++;
          x += w + padding;
          if (col === columns) {
            col = 0;
            row++;
            x = offsetX;
            y += grid.rowHeights[row - 1] + padding;
          }
        });
      }

      drawGrid(ctx, pairs1, g1, cols1, 0);
      drawGrid(ctx, pairs2, g2, cols2, g1.totalWidth + DIVIDER);

      const divX = g1.totalWidth + DIVIDER / 2;
      ctx.strokeStyle = '#FF8000';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(divX, HEADER_HEIGHT);
      ctx.lineTo(divX, canvas.height - FOOTER_HEIGHT);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const vsSize = Math.max(12, Math.round(totalWidth * 0.018));
      ctx.font = `700 ${vsSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#FF8000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VS', divX, HEADER_HEIGHT + totalHeight / 2);

      const footerY = canvas.height - FOOTER_HEIGHT;
      ctx.fillStyle = '#1C2228';
      ctx.fillRect(0, footerY, canvas.width, FOOTER_HEIGHT);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = `${Math.round(totalWidth * 0.002)}px`;
      ctx.font = `500 ${Math.max(9, Math.round(totalWidth * 0.01))}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = '#8395A7';
      ctx.fillText('collage.alessandrordgs.com.br', cx, footerY + FOOTER_HEIGHT / 2);

      canvas.toBlob((blob) => {
        if (!blob) return;
        if (finalImageUrlRef.current) URL.revokeObjectURL(finalImageUrlRef.current);
        const url = URL.createObjectURL(blob);
        finalImageUrlRef.current = url;
        setProgress(100);
        setFinalImage(url);
      }, 'image/png');
    });
  }, [collaborativeData]);

  const value: DiaryContextValue = {
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
  }

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>
}

export function useDiary(): DiaryContextValue {
  const ctx = useContext(DiaryContext)
  if (!ctx) throw new Error('useDiary must be used within DiaryProvider')
  return ctx
}
