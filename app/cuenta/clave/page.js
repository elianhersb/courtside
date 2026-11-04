"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "@/components/Shell";
import { Field, Form, post } from "@/components/AuthForm";
import { confirmError, passwordError } from "@/lib/validate";

function NewPassword() {
  const token = useSearchParams().get("token");
  const { refresh } = useAccount();
  const router = useRouter();
  return (
    <>
      <div className="cs-screen-h"><h1>Clave nueva</h1></div>
      <div className="cs-gut cs-auth">
        {!token ? <div className="cs-form-error">El enlace está incompleto. <Link href="/cuenta/recuperar">Pide uno nuevo</Link>.</div> : (
          <Form submit="Guardar clave" validate={(v) => ({ password: passwordError(v.password), confirm: confirmError(v.password, v.confirm) })} onSubmit={async (v) => {
            await post("/api/auth/reset", { token, password: v.password });
            await refresh();
            router.replace("/perfil");
          }}>
            <Field label="Clave nueva" name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" hint="Al menos 8 caracteres, con letras y números." meter required />
            <Field label="Confirmar clave" name="confirm" type="password" autoComplete="new-password" placeholder="Repite la clave" required />
          </Form>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return <Suspense><NewPassword /></Suspense>;
}
