
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

const TITLE = "Letterboxd Collage Generator — Free Movie Grid Maker";
const DESCRIPTION = "Free Letterboxd collage generator: turn your diary into a movie poster grid for the last month, quarter, or year. Download it or share to Instagram Stories, plus AI film recommendations.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "letterboxd collage",
    "letterboxd collage generator",
    "letterboxd grid",
    "movie poster grid",
    "letterboxd diary collage",
    "instagram story movie collage",
  ],
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
  verification: {
    google: "S68efPSW3ExDwin7bjmdxfDQuo3iOld0mHb0PFO4Yn0",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    siteName: "Letterboxd Collage",
    type: "website",
  },
};

const FAQ = [
  {
    q: "How do I make a Letterboxd collage?",
    a: "Enter your Letterboxd username, pick a period (last month, 3 months, or 12 months), and the generator pulls your diary from the public RSS feed and assembles your watched films into a movie poster grid you can download.",
  },
  {
    q: "Is the Letterboxd collage generator free?",
    a: "Yes. It is completely free and needs no login or API key. It reads only your public Letterboxd diary feed.",
  },
  {
    q: "Can I download my collage for Instagram Stories?",
    a: "Yes. You can download the collage as a PNG or export it formatted for Instagram Stories in a 9:16 vertical layout.",
  },
  {
    q: "What is a Letterboxd grid?",
    a: "A Letterboxd grid is a poster grid of the films you logged over a time period. This tool turns your diary into that grid automatically, with your star ratings overlaid on each poster.",
  },
];

const JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Letterboxd Collage",
    url: BASE_URL,
    description: DESCRIPTION,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    author: { "@type": "Person", name: "Alessandro Rodrigues", url: "https://github.com/alessandrordgs" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  },
];

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
      </body>
    </html>
  );
}
