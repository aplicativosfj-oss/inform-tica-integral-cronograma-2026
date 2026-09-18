// Coordenadas de Feijó, Acre.
const LATITUDE = -8.1656;
const LONGITUDE = -70.355;

export interface Clima {
  temperatura: number;
  sensacao: number;
  umidade: number;
  ventoKmh: number;
  codigo: number;
  atualizadoEm: string;
}

/** Traduz o código meteorológico WMO (usado pela Open-Meteo) para português. */
export function descricaoClima(codigo: number): string {
  if (codigo === 0) return "Céu limpo";
  if (codigo <= 2) return "Poucas nuvens";
  if (codigo === 3) return "Nublado";
  if (codigo === 45 || codigo === 48) return "Neblina";
  if (codigo >= 51 && codigo <= 55) return "Chuvisco";
  if (codigo >= 56 && codigo <= 57) return "Chuvisco congelante";
  if (codigo >= 61 && codigo <= 65) return "Chuva";
  if (codigo >= 66 && codigo <= 67) return "Chuva congelante";
  if (codigo >= 71 && codigo <= 75) return "Neve";
  if (codigo >= 80 && codigo <= 82) return "Aguaceiros";
  if (codigo >= 95) return "Trovoada";
  return "Tempo estável";
}

export type CategoriaClima = "limpo" | "nuvens" | "chuva" | "tempestade" | "neblina";

export function categoriaClima(codigo: number): CategoriaClima {
  if (codigo === 0) return "limpo";
  if (codigo === 45 || codigo === 48) return "neblina";
  if (codigo >= 51 && codigo <= 82) return "chuva";
  if (codigo >= 95) return "tempestade";
  return "nuvens";
}

/**
 * Busca o clima atual de Feijó/AC na Open-Meteo — API pública, gratuita e
 * sem necessidade de chave. Chamada direto do navegador do visitante (não
 * do servidor), então cada acesso público lê o clima de verdade.
 */
export async function fetchClima(): Promise<Clima> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&timezone=America%2FRio_Branco`;
  // Sem timeout, uma rede lenta deixava o widget preso em "Consultando..."
  // indefinidamente — 8s é o bastante pra uma API pública responder.
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  let resposta: Response;
  try {
    resposta = await fetch(url, { signal: controller.signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("O serviço de clima demorou demais para responder.");
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
  if (!resposta.ok) throw new Error(`Falha ao buscar o clima (${resposta.status})`);
  const dados = await resposta.json();
  const atual = dados?.current;
  if (!atual || typeof atual.temperature_2m !== "number") {
    throw new Error("Resposta inesperada do serviço de clima.");
  }
  return {
    temperatura: atual.temperature_2m,
    sensacao: atual.apparent_temperature,
    umidade: atual.relative_humidity_2m,
    ventoKmh: atual.wind_speed_10m,
    codigo: atual.weather_code,
    atualizadoEm: atual.time,
  };
}
