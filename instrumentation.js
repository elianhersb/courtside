// Next llama a register() una vez al arrancar el servidor: ahí corre la revisión de marcadores para las alertas.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") (await import("./lib/push.js")).start();
}
