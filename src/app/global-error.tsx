"use client";

import PageError from "./error";
import "./globals.css";

export default function GlobalError(props: Parameters<typeof PageError>[0]) {
  return (
    <html lang="id">
      <body className="bg-white font-sans">
        <title>Halaman belum dapat dimuat | REMAX Home of Giving</title>
        <PageError {...props} />
      </body>
    </html>
  );
}
