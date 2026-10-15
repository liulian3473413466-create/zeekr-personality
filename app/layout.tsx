import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "你是哪种创作人设？｜KOC 创作人设测评",
  description: "30道趣味题，解锁藏在日常里的出厂配置。我们会参考你的测评结果，为你寻找一起拍出好作品的队友。",
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
