import { useEffect, useState } from "react";

/** true quando o navegador tem conexão; acompanha as quedas e voltas da rede. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const atualizar = () => setOnline(navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);

  return online;
}
