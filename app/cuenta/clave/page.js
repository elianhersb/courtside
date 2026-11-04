"use client";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount } from "@/components/Shell";
import { Field, Form, post } from "@/components/AuthForm";

function NewPassword() {
  const token = useSearchParams().get("token");
  const { refresh } = useAccount();
  const router = useRouter();
  return (
    <>
      <div className="cs-screen-h"><h1>Clave nueva</h1></div>
      <div className="cs-gut cs-auth">
        {!token ? <div className="cs-form-error">El enlace está incompleto. <Link href="/cuenta/recuperar">Pide uno nuevo</Link>.</div> : (
          <Form submit="Guardar clave" onSubmit={async (v) => {
            if (v.password !== v.confirm) throw new Error("Las dos claves no coinciden");
            await post("/api/auth/reset", { token, password: v.password });
            await refresh();
            router.replace("/perfil");
          }}>
            <Field label="Clave nueva (mínimo 8 caracteres)" name="password" type="password" autoComplete="new-password" minLength={8} required />
            <Field label="Repite la clave" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
          </Form>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return <Suspense><NewPassword /></Suspense>;
}
