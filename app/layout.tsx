import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Vector Search Playground",
  description:
    "A technical lab for understanding embeddings, chunking, semantic similarity, and retrieval quality underneath RAG systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
