import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AzureRecall | AZ-900 Flashcards",
  description: "Learn Azure fundamentals with focused, playful flashcards.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
