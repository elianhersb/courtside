import nodemailer from "nodemailer";

let transport;

// SMTP_URL: smtp://usuario:clave@servidor:587 (Resend, Brevo, Gmail…). Sin SMTP_URL, en desarrollo el correo se imprime en la consola.
export async function sendMail(to, subject, text) {
  if (!process.env.SMTP_URL) {
    if (process.env.NODE_ENV === "production") throw new Error("Falta SMTP_URL para enviar correos");
    console.log(`\n[correo de desarrollo] para ${to}: ${subject}\n${text}\n`);
    return;
  }
  transport ||= nodemailer.createTransport(process.env.SMTP_URL);
  await transport.sendMail({ from: process.env.MAIL_FROM || "CourtSide <no-reply@courtside.app>", to, subject, text });
}

export const verifyMail = (link) => ["Confirma tu correo en CourtSide",
  `Hola,\n\nConfirma tu correo para guardar tu configuración en CourtSide:\n${link}\n\nEl enlace vence en 24 horas. Si no creaste esta cuenta, ignora este mensaje.`];
export const resetMail = (link) => ["Recupera tu clave de CourtSide",
  `Hola,\n\nPara crear una clave nueva, abre este enlace:\n${link}\n\nVence en 1 hora y sirve una sola vez. Si no lo pediste, ignora este mensaje: tu clave sigue igual.`];
