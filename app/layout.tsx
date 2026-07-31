import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pagesBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteUrl = "https://xuegao0305-droid.github.io/office-agent-competitor-tracker";
const description =
  "逐家查看 DuMate、WorkBuddy、千问办公和 TRAE Work 的产品方向、商业模式、客户证据与公开体量。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "办公 Agent 竞争追踪台",
  description,
  icons: {
    icon: `${pagesBasePath}/favicon.png`,
    shortcut: `${pagesBasePath}/favicon.png`,
  },
  openGraph: {
    title: "办公 Agent 竞争追踪台",
    description,
    type: "website",
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1536,
        height: 1024,
        alt: "办公 Agent 竞争追踪台",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "办公 Agent 竞争追踪台",
    description,
    images: [`${siteUrl}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
