import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const clerkAppearance = {
  variables: {
    colorPrimary: "#151515",
    colorPrimaryForeground: "#FFFFFF",
    colorForeground: "#151515",
    colorMutedForeground: "#555A55",
    colorMuted: "#F1F2EE",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#151515",
    colorBorder: "#CDD1CA",
    colorRing: "#151515",
    colorDanger: "#C8321F",
    colorSuccess: "#0A7A45",
    colorWarning: "#8A5B00",
    colorShadow: "transparent",
    fontFamily: "var(--font-barlow), sans-serif",
    fontFamilyButtons: "var(--font-barlow-condensed), sans-serif",
    fontSize: "15px",
    borderRadius: "0px",
  },
  elements: {
    card: { boxShadow: "none", borderTop: "3px solid #151515" },
    cardBox: { boxShadow: "none" },
    formButtonPrimary: {
      backgroundImage: "none",
      boxShadow: "none",
      fontSize: "17px",
      fontWeight: 600,
    },
    socialButtonsBlockButton: { border: "1.5px solid #151515", boxShadow: "none" },
    formFieldInput: { border: "1.5px solid #CDD1CA", boxShadow: "none" },
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
        className={`${barlow.variable} ${barlowCondensed.variable} antialiased`}
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
