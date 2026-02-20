
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: 'swap',
  weight: ["400", "500", "600", "700"],
});


export const metadata: Metadata = {
  title: "Collage diary | Letterboxd",
  description: "Transform your Letterboxd viewing history into stunning visual collages! Create and share beautiful movie poster grids showcasing films you've watched in the past month, quarter, or year. The perfect way to visualize and celebrate your cinematic journey!",
  authors: [
    {
      name: "Alessandro Rodrigues",
      url: "https://github.com/alessandrordgs",
    }
  ],
  twitter: {
    card: "summary_large_image",
    title: "Collage diary | Letterboxd",
    description: "Transform your Letterboxd viewing history into stunning visual collages! Create and share beautiful movie poster grids showcasing films you've watched in the past month, quarter, or year. The perfect way to visualize and celebrate your cinematic journey!",
    images: [
      {
        url: "https://a.ltrbxd.com/logos/letterboxd-logo-v-neg-rgb-1000px.png",
        alt: "Letterboxd logo",
      },
    ],
  },
  openGraph: {
    title: "Collage diary | Letterboxd",
    description: "Transform your Letterboxd viewing history into stunning visual collages! Create and share beautiful movie poster grids showcasing films you've watched in the past month, quarter, or year. The perfect way to visualize and celebrate your cinematic journey!",
    url: "https://collage-diary.vercel.app/",
    siteName: "Collage diary | Letterboxd",

    images: [
      {
        url: "https://a.ltrbxd.com/logos/letterboxd-logo-v-neg-rgb-1000px.png",
        alt: "Letterboxd logo",
      },
    ],
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
      lang="pt-br"
      prefix="og: http://ogp.me/ns#"
    >
      <body
        className={`${spaceGrotesk.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
