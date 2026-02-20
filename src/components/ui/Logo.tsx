import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: number
}

export function Logo({ className, size = 80 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-label="Letterboxd Collage logo"
    >
      {/* Neobrutalist offset shadow */}
      <rect x="4" y="4" width="72" height="72" fill="#1E0A3C" />

      {/* Main card background */}
      <rect x="0" y="0" width="72" height="72" fill="#EEE6FF" stroke="#1E0A3C" strokeWidth="2" />

      {/* Subtle collage grid lines */}
      <line x1="0" y1="24" x2="72" y2="24" stroke="#1E0A3C" strokeWidth="0.75" opacity="0.12" />
      <line x1="0" y1="48" x2="72" y2="48" stroke="#1E0A3C" strokeWidth="0.75" opacity="0.12" />
      <line x1="24" y1="0" x2="24" y2="72" stroke="#1E0A3C" strokeWidth="0.75" opacity="0.12" />
      <line x1="48" y1="0" x2="48" y2="72" stroke="#1E0A3C" strokeWidth="0.75" opacity="0.12" />

      {/* --- Letterboxd iconic three dots — neobrutalist treatment --- */}

      {/* Orange dot shadow */}
      <circle cx="18" cy="38" r="11" fill="#1E0A3C" />
      {/* Orange dot */}
      <circle cx="16" cy="36" r="11" fill="#F16121" stroke="#1E0A3C" strokeWidth="1.5" />

      {/* Green dot shadow */}
      <circle cx="38" cy="38" r="11" fill="#1E0A3C" />
      {/* Green dot */}
      <circle cx="36" cy="36" r="11" fill="#00E054" stroke="#1E0A3C" strokeWidth="1.5" />

      {/* Blue dot shadow */}
      <circle cx="58" cy="38" r="11" fill="#1E0A3C" />
      {/* Blue dot */}
      <circle cx="56" cy="36" r="11" fill="#40BCF4" stroke="#1E0A3C" strokeWidth="1.5" />
    </svg>
  )
}
