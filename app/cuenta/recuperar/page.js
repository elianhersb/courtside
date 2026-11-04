"use client";
import { useState } from "react";
import Link from "next/link";
import { Field, Form, post } from "@/components/AuthForm";

export default function Forgot() {
  const [sent, setSent] = useState(null);
  return (
    <>
      <div className="cs-screen-h"><h1>Recuperar clave</h1></div>
      <div className="cs-gut cs-auth">
        {sent ? (
          <div className="cs-auth-ok" role="status">
            <b>Revisa tu correo</b>
            <p className="cs-muted">Si {sent} tiene una cuenta, te enviamos un enlace para crear una clave nueva. Vence en 1 hora.</p>
            <Link className="cs-auth-link" href="/cuenta">Volver a entrar</Link>
          </div>
        ) : (
          <>
            <p className="cs-muted cs-auth-lead">Escribe el correo de tu cuenta y te enviaremos un enlace. También sirve si entras con Google y quieres agregar una clave.</p>
            <Form submit="Enviar enlace" onSubmit={async (v) => { await post("/api/auth/forgot", v); setSent(v.email); }}
              note={<Link className="cs-auth-link" href="/cuenta">Volver</Link>}>
              <Field label="Correo" name="email" type="email" autoComplete="email" required />
            </Form>
          </>
        )}
      </div>
    </>
  );
}
