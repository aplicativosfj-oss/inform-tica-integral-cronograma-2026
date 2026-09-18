import { CloudDrizzle, CloudFog, CloudLightning, Cloudy, MapPin, Sun, Wind } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { gravarCache, lerCache } from "@/lib/offline-queue";
import { categoriaClima, descricaoClima, fetchClima, type Clima } from "@/lib/weather";

const CACHE_KEY = "clima-feijo";

// Faixa usada para converter a temperatura em altura visual do termômetro —
// calibrada para o clima tropical de Feijó/AC (raramente sai desse intervalo).
const TEMP_MIN = 15;
const TEMP_MAX = 40;

function alturaMercurio(temperatura: number): number {
  const fracao = (temperatura - TEMP_MIN) / (TEMP_MAX - TEMP_MIN);
  return Math.min(100, Math.max(4, fracao * 100));
}

function corMercurio(temperatura: number): string {
  if (temperatura < 22) return "#38bdf8"; // fresco
  if (temperatura < 28) return "#34d399"; // agradável
  if (temperatura < 33) return "#fbbf24"; // quente
  return "#f87171"; // muito quente
}

function IconeClima({ codigo, className }: { codigo: number; className?: string }) {
  const categoria = categoriaClima(codigo);
  switch (categoria) {
    case "limpo":
      return <Sun className={`${className} animate-spin-slow text-amber-400`} />;
    case "neblina":
      return <CloudFog className={`${className} text-slate-400`} />;
    case "chuva":
      return <CloudDrizzle className={`${className} animate-bounce-gentle text-sky-400`} />;
    case "tempestade":
      return <CloudLightning className={`${className} text-amber-300`} />;
    default:
      return <Cloudy className={`${className} animate-float-slow text-slate-300`} />;
  }
}

/** Termômetro em SVG com o mercúrio subindo animado até a temperatura real. */
function Termometro({
  temperatura,
  carregando,
}: {
  temperatura: number | null;
  carregando: boolean;
}) {
  const alturaPct = temperatura === null ? 0 : alturaMercurio(temperatura);
  const cor = temperatura === null ? "#94a3b8" : corMercurio(temperatura);
  // Área útil do tubo (dentro das bordas), em unidades do viewBox.
  const tuboTopo = 14;
  const tuboBase = 148;
  const alturaTubo = tuboBase - tuboTopo;
  const alturaMercurioPx = (alturaPct / 100) * alturaTubo;

  return (
    <svg viewBox="0 0 44 190" className="h-40 w-auto shrink-0" role="img" aria-label="Termômetro">
      {/* Tubo de vidro */}
      <rect
        x={12}
        y={tuboTopo}
        width={20}
        height={alturaTubo + 4}
        rx={10}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-border"
      />
      {/* Bulbo */}
      <circle
        cx={22}
        cy={168}
        r={18}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-border"
      />

      {/* Marcações */}
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <line
          key={f}
          x1={33}
          x2={38}
          y1={tuboTopo + alturaTubo * (1 - f)}
          y2={tuboTopo + alturaTubo * (1 - f)}
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-muted-foreground/40"
        />
      ))}

      {/* Bulbo preenchido */}
      <circle
        cx={22}
        cy={168}
        r={14}
        fill={cor}
        className={carregando ? "opacity-40" : "transition-colors duration-700"}
      />
      {/* Mercúrio subindo — a altura anima via CSS transition ao trocar de valor. */}
      <rect
        x={16}
        width={12}
        rx={6}
        fill={cor}
        y={tuboBase - alturaMercurioPx}
        height={alturaMercurioPx + 20}
        className={
          carregando ? "opacity-40" : "opacity-95 transition-all duration-[1400ms] ease-out"
        }
      />
    </svg>
  );
}

export function WeatherWidget() {
  // Começa nulo nos dois lados (servidor e primeira pintura do cliente) —
  // ler o cache aqui direto no useState fazia a 1ª renderização do cliente já
  // sair com dados que o servidor nunca viu, gerando erro de hidratação.
  const [clima, setClima] = useState<Clima | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const emCache = lerCache<Clima>(CACHE_KEY);
    if (emCache) setClima(emCache);
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      try {
        const dados = await fetchClima();
        if (cancelado) return;
        setClima(dados);
        setErro(null);
        gravarCache(CACHE_KEY, dados);
      } catch (err) {
        if (!cancelado) setErro((err as Error).message);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    // Atualiza a cada 15 minutos — clima não precisa de mais que isso.
    const id = window.setInterval(carregar, 15 * 60 * 1000);
    return () => {
      cancelado = true;
      window.clearInterval(id);
    };
  }, []);

  const horaAtualizada = clima
    ? new Date(clima.atualizadoEm).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className="overflow-hidden border-sky-500/20 bg-gradient-to-br from-sky-500/5 via-card to-card">
      <CardContent className="flex flex-wrap items-center gap-5 py-5">
        <Termometro temperatura={clima?.temperatura ?? null} carregando={carregando && !clima} />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <MapPin className="size-3.5 text-primary" /> Feijó, Acre
            {horaAtualizada ? (
              <Badge variant="secondary" className="ml-1 font-normal">
                atualizado {horaAtualizada}
              </Badge>
            ) : null}
          </div>

          {clima ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <IconeClima codigo={clima.codigo} className="size-9" />
                <div>
                  <p className="text-3xl font-bold leading-none text-foreground">
                    {Math.round(clima.temperatura)}°C
                  </p>
                  <p className="text-sm text-muted-foreground">{descricaoClima(clima.codigo)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                <span>Sensação: {Math.round(clima.sensacao)}°C</span>
                <span>Umidade: {Math.round(clima.umidade)}%</span>
                <span className="flex items-center gap-1">
                  <Wind className="size-3" /> Vento: {Math.round(clima.ventoKmh)} km/h
                </span>
              </div>
            </div>
          ) : erro ? (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar o clima agora. Tente recarregar a página.
            </p>
          ) : (
            <div className="flex flex-col gap-2" role="status" aria-label="Consultando o clima">
              <div className="h-8 w-24 animate-pulse rounded bg-muted-foreground/15" />
              <div className="h-3.5 w-32 animate-pulse rounded bg-muted-foreground/15" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
