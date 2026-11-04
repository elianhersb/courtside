import "./tokens.css";
import "./courtside.css";
import "./app.css";
import Shell from "@/components/Shell";

export const metadata = {
  title: "CourtSide",
  description: "Partidos de la NBA, dónde verlos, estadísticas y un asistente con IA.",
  appleWebApp: { capable: true, title: "CourtSide", statusBarStyle: "black-translucent" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0d11",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-theme="dark">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
