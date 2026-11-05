import nodemailer from "nodemailer";

let transport;

// SMTP_URL: smtp://usuario:clave@servidor:587 (Resend, Brevo, Gmail…). Sin SMTP_URL, en desarrollo el correo se imprime en la consola.
export async function sendMail(to, subject, text, html) {
  if (!process.env.SMTP_URL) {
    if (process.env.NODE_ENV === "production") throw new Error("Falta SMTP_URL para enviar correos");
    console.log(`\n[correo de desarrollo] para ${to}: ${subject}\n${text}\n`);
    return;
  }
  transport ||= nodemailer.createTransport(process.env.SMTP_URL);
  await transport.sendMail({ from: process.env.MAIL_FROM || "CourtSide <no-reply@courtside.app>", to, subject, text, html });
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Plantilla con los colores de la app. Tablas y estilos en línea porque Gmail y Outlook ignoran casi todo el CSS;
// el logo es HTML y no una imagen para que se vea aunque el cliente bloquee imágenes.
export function layout({ preview, title, intro, button, link, note, footer }) {
  const font = "Archivo,'Segoe UI',Helvetica,Arial,sans-serif";
  const display = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";
  const href = esc(link);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#0b0d11;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d11;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
  <tr><td style="padding:0 4px 20px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td width="36" height="36" align="center" style="width:36px;height:36px;background:#ff7a1a;border-radius:10px;font:800 20px/36px ${display};color:#1a0c02;">C</td>
      <td style="padding-left:10px;font:700 22px/1 ${display};color:#f4f6f9;letter-spacing:.3px;">CourtSide</td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#14171d;border:1px solid #262b35;border-radius:20px;overflow:hidden;">
    <div style="height:4px;background:#ff7a1a;background-image:linear-gradient(90deg,#b44800,#ff7a1a,#ff9147);"></div>
    <div style="padding:32px 28px 28px;">
      <h1 style="margin:0 0 12px;font:700 30px/1.1 ${display};color:#f4f6f9;">${esc(title)}</h1>
      <p style="margin:0 0 26px;font:400 15px/1.6 ${font};color:#a1a9b6;">${esc(intro)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:999px;background:#ff7a1a;">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font:700 15px/1 ${font};color:#1a0c02;text-decoration:none;border-radius:999px;">${esc(button)}</a>
      </td></tr></table>
      <p style="margin:22px 0 0;padding:12px 14px;background:#1c2028;border-radius:12px;font:400 13px/1.5 ${font};color:#a1a9b6;">⏱ ${esc(note)}</p>
      <p style="margin:22px 0 0;font:400 12px/1.5 ${font};color:#6b7381;">¿El botón no funciona? Copia este enlace en tu navegador:<br><a href="${href}" style="color:#ff9147;word-break:break-all;">${href}</a></p>
    </div>
  </td></tr>
  <tr><td style="padding:20px 8px 0;font:400 12px/1.6 ${font};color:#6b7381;text-align:center;">${esc(footer)}<br>CourtSide · La NBA, en vivo y en español</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// Cada correo devuelve [asunto, texto, html]: el texto plano queda para clientes sin HTML y ayuda a no caer en spam.
function mail(subject, text, parts) {
  return [subject, text, layout(parts)];
}

export const verifyMail = (link) => mail("Confirma tu correo en CourtSide",
  `Hola,\n\nConfirma tu correo para guardar tu configuración en CourtSide:\n${link}\n\nEl enlace vence en 24 horas. Si no creaste esta cuenta, ignora este mensaje.`,
  { preview: "Un clic y tu configuración queda guardada en tu cuenta.", title: "Confirma tu correo",
    intro: "Ya casi está. Confirma tu correo para guardar tus equipos favoritos, alertas y ajustes en tu cuenta, y tenerlos en cualquier dispositivo.",
    button: "Confirmar mi correo", link, note: "El enlace vence en 24 horas.",
    footer: "Si no creaste una cuenta en CourtSide, ignora este mensaje." });

export const resetMail = (link) => mail("Recupera tu clave de CourtSide",
  `Hola,\n\nPara crear una clave nueva, abre este enlace:\n${link}\n\nVence en 1 hora y sirve una sola vez. Si no lo pediste, ignora este mensaje: tu clave sigue igual.`,
  { preview: "Crea una clave nueva para tu cuenta de CourtSide.", title: "Crea una clave nueva",
    intro: "Recibimos un pedido para cambiar la clave de tu cuenta. Toca el botón y elige una nueva.",
    button: "Crear clave nueva", link, note: "Vence en 1 hora y sirve una sola vez.",
    footer: "Si no lo pediste, ignora este mensaje: tu clave sigue igual." });
