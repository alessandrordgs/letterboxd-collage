import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Letterboxd Collage — Create Your Movie Diary'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#14181C',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
        }}
      >
        {/* Logo */}
        <svg width="140" height="140" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="72" height="72" fill="#1E0A3C" />
          <rect x="0" y="0" width="72" height="72" fill="#EEE6FF" stroke="#1E0A3C" strokeWidth="2" />
          <line x1="0" y1="24" x2="72" y2="24" stroke="#1E0A3C" strokeWidth="0.75" opacity="0.12" />
          <line x1="0" y1="48" x2="72" y2="48" stroke="#1E0A3C" strokeWidth="0.75" opacity="0.12" />
          <line x1="24" y1="0" x2="24" y2="72" stroke="#1E0A3C" strokeWidth="0.75" opacity="0.12" />
          <line x1="48" y1="0" x2="48" y2="72" stroke="#1E0A3C" strokeWidth="0.75" opacity="0.12" />
          <circle cx="18" cy="38" r="11" fill="#1E0A3C" />
          <circle cx="16" cy="36" r="11" fill="#F16121" stroke="#1E0A3C" strokeWidth="1.5" />
          <circle cx="38" cy="38" r="11" fill="#1E0A3C" />
          <circle cx="36" cy="36" r="11" fill="#00E054" stroke="#1E0A3C" strokeWidth="1.5" />
          <circle cx="58" cy="38" r="11" fill="#1E0A3C" />
          <circle cx="56" cy="36" r="11" fill="#40BCF4" stroke="#1E0A3C" strokeWidth="1.5" />
        </svg>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-1px',
              lineHeight: 1,
              textTransform: 'uppercase',
              display: 'flex',
              gap: 16,
            }}
          >
            <span>LETTERBOXD</span>
            <span style={{ color: '#00E054' }}>COLLAGE</span>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: '#89A398',
              letterSpacing: '4px',
              textTransform: 'uppercase',
            }}
          >
            Create Your Movie Diary
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 20,
            color: '#FF8000',
            fontWeight: 600,
            letterSpacing: '2px',
          }}
        >
          collage.alessandrordgs.com.br
        </div>
      </div>
    ),
    { ...size }
  )
}
