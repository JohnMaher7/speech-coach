import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const description =
  "Upload a recorded talk and get an evaluator-style report — fillers, pacing, vocal variety, structure, your top three actions, and a pitch-and-pace timeline chart.";

export const metadata: Metadata = {
  metadataBase: new URL("https://speakgrade.com"),
  title: "SpeakGrade — AI speech coaching",
  description,
  openGraph: {
    title: "SpeakGrade — AI speech coaching",
    description,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}
      >
        <body className="flex min-h-svh flex-col bg-background text-foreground">
          <SiteHeader />
          {children}
          <SiteFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
