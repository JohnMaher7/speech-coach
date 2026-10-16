import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FeedbackWidget } from "@/components/feedback-widget";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const clerkAppearance = {
  variables: {
    colorPrimary: "#0D0D0C",
    colorPrimaryForeground: "#FFFFFF",
    colorForeground: "#0D0D0C",
    colorMutedForeground: "#6B6B66",
    colorMuted: "#F3F3F0",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#0D0D0C",
    colorBorder: "#E7E6E1",
    colorRing: "#0D0D0C",
    colorDanger: "#BB3329",
    colorSuccess: "#137A4A",
    colorWarning: "#8F5D06",
    fontFamily: "var(--font-geist), sans-serif",
    fontFamilyButtons: "var(--font-geist), sans-serif",
    fontSize: "15px",
    borderRadius: "12px",
  },
  elements: {
    card: {
      boxShadow:
        "0 1px 1px rgb(16 16 14 / 0.03), 0 16px 40px -16px rgb(16 16 14 / 0.16)",
      border: "1px solid #E7E6E1",
    },
    cardBox: { boxShadow: "none", borderRadius: "20px" },
    headerTitle: {
      fontFamily: "var(--font-instrument-serif), serif",
      fontSize: "30px",
      fontWeight: 400,
      letterSpacing: "-0.01em",
    },
    formButtonPrimary: {
      backgroundImage: "none",
      borderRadius: "9999px",
      fontSize: "15px",
      fontWeight: 500,
    },
    socialButtonsBlockButton: {
      borderRadius: "9999px",
      border: "1px solid #D4D3CD",
      boxShadow: "0 1px 2px rgb(16 16 14 / 0.04)",
    },
    formFieldInput: {
      border: "1px solid #DDDCD6",
      boxShadow: "0 1px 2px rgb(16 16 14 / 0.04)",
    },
  },
};

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
    <ClerkProvider appearance={clerkAppearance}>
      <html
        lang="en"
        className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <body className="flex min-h-svh flex-col bg-background text-foreground">
          <SiteHeader />
          {children}
          <SiteFooter />
          <FeedbackWidget />
        </body>
      </html>
    </ClerkProvider>
  );
}
