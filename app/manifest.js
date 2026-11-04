export default function manifest() {
  return {
    name: "CourtSide · NBA",
    short_name: "CourtSide",
    description: "Partidos de la NBA, dónde verlos y estadísticas en vivo.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d11",
    theme_color: "#0b0d11",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
