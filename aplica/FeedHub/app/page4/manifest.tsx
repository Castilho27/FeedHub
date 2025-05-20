'use client'

import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FeedHub - Sala de Espera Virtual",
    short_name: "FeedHub",
    description: "Uma sala de espera virtual para estudantes",
    start_url: "/",
    display: "standalone",
    background_color: "#E9F2FC",
    theme_color: "#55ACE7",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
