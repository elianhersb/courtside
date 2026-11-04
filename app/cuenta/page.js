"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import C from "@/components/cs";
import { useAccount } from "@/components/Shell";
import { Field, Form, GoogleButton, post } from "@/components/AuthForm";
import { confirmError, emailError, nameError, passwordError } from "@/lib/validate";

const ERRORS = {
  google: "No se pudo entrar con Google. Intenta de nuevo.",
  "google-correo": "Tu cuenta de Google no tiene el correo verificado.",
  "google-off": "Entrar con Google todavía no está configurado.",
  desactivada: "Esta cuenta está desactivada.",
};

function Account() {
  const { user, ready, refresh } = useAccount();
  const router = useRouter(), q = useSearchParams();
  const [mode, setMode] = useState(q.get("modo") === "registro" ? "signup" : "login");
  useEffect(() => { if (ready && user) router.replace("/perfil"); }, [ready, user, router]);
  const done = async () => { await refresh(); router.replace("/perfil"); };

  return (
    <>
      <div className="cs-screen-h"><h1>{mode === "login" ? "Entrar" : "Crear cuenta"}</h1></div>
      <div className="cs-gut cs-auth">
        <p className="cs-muted cs-auth-lead">Es opcional: con una cuenta tus equipos, suscripciones y alertas se guardan y te siguen en cualquier dispositivo.</p>
        {q.get("error") ? <div className="cs-form-error" role="alert">{ERRORS[q.get("error")] || ERRORS.google}</div> : null}
        <GoogleButton />
        <div className="cs-auth-or"><span>o con tu correo</span></div>
        <C.Segmented items={[{ key: "login", label: "Entrar" }, { key: "signup", label: "Crear cuenta" }]} value={mode} onChange={setMode} />
        {mode === "login" ? (
          <Form key="login" submit="Entrar" onSubmit={async (v) => { await post("/api/auth/login", v); await done(); }}
            validate={(v) => ({ email: emailError(v.email), password: v.password ? null : "Escribe tu clave" })}
            note={<Link className="cs-auth-link" href="/cuenta/recuperar">¿Olvidaste tu clave?</Link>}>
            <Field label="Correo" name="email" type="email" inputMode="email" autoComplete="email" placeholder="nombre@correo.com" required />
            <Field label="Clave" name="password" type="password" autoComplete="current-password" placeholder="Tu clave" required />
          </Form>
        ) : (
          <Form key="signup" submit="Crear cuenta" onSubmit={async ({ confirm, ...v }) => { await post("/api/auth/register", v); await done(); }}
            validate={(v) => ({ name: nameError(v.name), email: emailError(v.email), password: passwordError(v.password, v.email), confirm: confirmError(v.password, v.confirm) })}
            note={<p className="cs-subtle cs-auth-fine">Te enviaremos un correo para confirmar que es tuyo.</p>}>
            <Field label="Nombre (opcional)" name="name" autoComplete="name" maxLength={80} placeholder="Cómo quieres que te llamemos" />
            <Field label="Correo" name="email" type="email" inputMode="email" autoComplete="email" placeholder="nombre@correo.com" required />
            <Field label="Clave" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" hint="Al menos 8 caracteres, con letras y números." meter required />
            <Field label="Confirmar clave" name="confirm" type="password" autoComplete="new-password" placeholder="Repite la clave" required />
          </Form>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return <Suspense><Account /></Suspense>;
}
