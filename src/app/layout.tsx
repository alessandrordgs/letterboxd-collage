
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: 'swap',
  weight: ["400", "500", "600", "700"],
});

const BASE_URL = "https://collage.alessandrordgs.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Letterboxd Collage — Create Your Movie Diary",
  description: "Transform your Letterboxd viewing history into stunning visual collages. Create beautiful movie poster grids for the past month, quarter, or year and download them instantly.",
  authors: [
    {
      name: "Alessandro Rodrigues",
      url: "https://github.com/alessandrordgs",
    }
  ],
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary_large_image",
    title: "Letterboxd Collage — Create Your Movie Diary",
    description: "Transform your Letterboxd viewing history into stunning visual collages. Create beautiful movie poster grids for the past month, quarter, or year and download them instantly.",
  },
  openGraph: {
    title: "Letterboxd Collage — Create Your Movie Diary",
    description: "Transform your Letterboxd viewing history into stunning visual collages. Create beautiful movie poster grids for the past month, quarter, or year and download them instantly.",
    url: BASE_URL,
    siteName: "Letterboxd Collage",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${spaceGrotesk.variable} antialiased`}
      lang="en"
    >
      <body
        className={`${spaceGrotesk.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
