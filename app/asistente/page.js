"use client";
import Chat from "@/components/Chat";

export default function Assistant() {
  return (
    <>
      <div className="cs-screen-h">
        <div>
          <h1>Asistente</h1>
          <div className="cs-muted" style={{ fontSize: 13, marginTop: 2 }}>Pregunta por partidos, jugadores y dónde verlos</div>
        </div>
      </div>
      <Chat />
    </>
  );
}
