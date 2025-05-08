import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  display: 'swap'
});


export const metadata: Metadata = {
  title: "Collage diary | Letterboxd",
  description: "This web application allows users to create personalized collages from their Letterboxd diary entries. Users can generate visual grids featuring movie posters they've watched over specific time periods (1, 3, or 12 months",
  authors: [
    {
      name: "Alessandro Rodrigues",
      url: "https://github.com/alessandrordgs",
    }
  ],
  twitter: {
    card: "summary_large_image",
    title: "Collage diary | Letterboxd",
    description: "This web application allows users to create personalized collages from their Letterboxd diary entries. Users can generate visual grids featuring movie posters they've watched over specific time periods (1, 3, or 12 months",
    creator: "@alessandrordgs",
    images: [
      {
        url: "https://a.ltrbxd.com/logos/letterboxd-decal-dots-pos-rgb-500px.png",
        alt: "Letterboxd logo",
      },
    ],
  },
  openGraph: {
    title: "Collage diary | Letterboxd",
    description: "This web application allows users to create personalized collages from their Letterboxd diary entries. Users can generate visual grids featuring movie posters they've watched over specific time periods (1, 3, or 12 months",
    url: "https://collage-diary.vercel.app/",
    siteName: "Collage diary | Letterboxd",
    images: [
      {
        url: "https://a.ltrbxd.com/logos/letterboxd-decal-dots-pos-rgb-500px.png",
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
      className={`${roboto.variable}  antialiased`}
      lang="pt-br">
      <body
        className={`${roboto.variable}antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
