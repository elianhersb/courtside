"use client";
import { createContext, useContext, useId, useRef, useState } from "react";
import C from "./cs";
import { strength } from "@/lib/validate";

// Llamada JSON a una ruta de cuenta; devuelve el cuerpo o lanza el mensaje de error del servidor.
export async function post(url, body, method = "POST") {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Error ${r.status}`);
  return j;
}

const Errors = createContext({});
const STRENGTH = ["", "Débil", "Aceptable", "Fuerte"];

// Campo con su error debajo (enlazado con aria-describedby). En las claves: botón para mostrarla y medidor opcional.
export function Field({ label, name, type = "text", hint, meter, ...input }) {
  const errors = useContext(Errors);
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  const id = useId(), error = errors[name];
  const pass = type === "password";
  const level = meter ? strength(value) : 0;
  return (
    <div className={`cs-field${error ? " is-invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="cs-field-box">
        <input id={id} name={name} type={pass && show ? "text" : type} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : hint ? `${id}-h` : undefined}
          onInput={(e) => setValue(e.currentTarget.value)} {...input} />
        {pass ? (
          <button type="button" className="cs-field-eye" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? "Ocultar clave" : "Mostrar clave"}>
            {show ? "Ocultar" : "Mostrar"}
          </button>
        ) : null}
      </div>
      {meter && value ? (
        <div className={`cs-meter is-${level}`} aria-live="polite">
          <span><i /><i /><i /></span>{STRENGTH[level]}
        </div>
      ) : null}
      {error ? <span className="cs-field-err" id={`${id}-e`} role="alert">{error}</span> : hint ? <span className="cs-field-hint" id={`${id}-h`}>{hint}</span> : null}
    </div>
  );
}

// Formulario: valida con validate(valores) → { campo: mensaje } antes de enviar y vuelve a validar al escribir
// (después del primer intento) o al salir de un campo con algo escrito. onSubmit recibe los valores por nombre.
export function Form({ submit, validate = () => ({}), onSubmit, children, note }) {
  const [state, set] = useState({ busy: false, error: null });
  const [errors, setErrors] = useState({});
  const tried = useRef(false), ref = useRef(null);
  const values = () => Object.fromEntries(new FormData(ref.current));
  const check = (only) => {
    const all = Object.fromEntries(Object.entries(validate(values())).filter(([, v]) => v));
    setErrors((prev) => (only ? { ...prev, [only]: all[only] } : all));
    return all;
  };
  const handle = async (e) => {
    e.preventDefault();
    tried.current = true;
    const found = check();
    if (Object.keys(found).length) { ref.current.elements[Object.keys(found)[0]]?.focus(); return; }
    set({ busy: true, error: null });
    try {
      await onSubmit(values());
      set({ busy: false, error: null });
    } catch (err) {
      set({ busy: false, error: err.message });
    }
  };
  return (
    <Errors.Provider value={errors}>
      <form ref={ref} className="cs-form" onSubmit={handle} noValidate
        onInput={(e) => { if (tried.current) check(); else if (errors[e.target.name]) check(e.target.name); }}
        onBlur={(e) => { if (e.target.name && e.target.value) check(e.target.name); }}>
        {children}
        {state.error ? <div className="cs-form-error" role="alert">{state.error}</div> : null}
        {note}
        <C.Button className="cs-form-submit" loading={state.busy}>{submit}</C.Button>
      </form>
    </Errors.Provider>
  );
}

export function GoogleButton({ label = "Continuar con Google" }) {
  return (
    <a className="cs-btn cs-btn-secondary cs-press cs-google" href="/api/auth/google">
      <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      {label}
    </a>
  );
}
