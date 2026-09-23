export interface CampoExemplo {
  id: string;
  rotulo: string;
  padrao: number;
  min?: number;
  max?: number;
  sufixo?: string;
}

export interface ResultadoExemplo {
  /** A resposta em destaque, em letras grandes. */
  destaque: string;
  /** A conta explicada passo a passo, em linguagem de criança. */
  passos: string[];
  /** Onde isso aparece na vida real. */
  dica?: string;
}

export interface ExemploDiaADia {
  id: string;
  emoji: string;
  titulo: string;
  /** Situação em uma frase, com os campos no meio da história. */
  pergunta: string;
  campos: CampoExemplo[];
  resolver: (v: Record<string, number>) => ResultadoExemplo;
}

export interface AreaDiaADia {
  id: string;
  nome: string;
  emoji: string;
  /** Cores do degradê da área (início, fim). */
  cores: [string, string];
  exemplos: ExemploDiaADia[];
}

const num = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const plural = (n: number, um: string, varios: string) => (n === 1 ? um : varios);
const hhmm = (min: number) => {
  const total = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
const duracao = (min: number) => {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h e ${r} min`;
};

export const AREAS_DIA_A_DIA: AreaDiaADia[] = [
  {
    id: "dinheiro",
    nome: "Dinheiro",
    emoji: "💰",
    cores: ["#10b981", "#047857"],
    exemplos: [
      {
        id: "troco",
        emoji: "🥪",
        titulo: "Troco do lanche",
        pergunta: "Paguei com uma nota e o lanche custou menos. Quanto volta de troco?",
        campos: [
          { id: "pago", rotulo: "Paguei", padrao: 20, max: 1000, sufixo: "reais" },
          { id: "preco", rotulo: "Lanche custou", padrao: 12.5, max: 1000, sufixo: "reais" },
        ],
        resolver: ({ pago = 0, preco = 0 }) => {
          const troco = (pago ?? 0) - (preco ?? 0);
          return troco >= 0
            ? {
                destaque: `Troco: ${brl(troco)}`,
                passos: [`${brl(pago!)} − ${brl(preco!)} = ${brl(troco)}`],
                dica: "Conferir o troco evita perder dinheiro no comércio.",
              }
            : {
                destaque: `Faltam ${brl(-troco)}`,
                passos: [`${brl(preco!)} − ${brl(pago!)} = ${brl(-troco)}`],
                dica: "Se o dinheiro não dá, dá para escolher outro lanche.",
              };
        },
      },
      {
        id: "mealheiro",
        emoji: "🐷",
        titulo: "Cofrinho de semanas",
        pergunta: "Guardando um pouco por semana, quanto junto depois de algum tempo?",
        campos: [
          { id: "semana", rotulo: "Guardo por semana", padrao: 5, max: 500, sufixo: "reais" },
          { id: "semanas", rotulo: "Durante", padrao: 8, min: 1, max: 100, sufixo: "semanas" },
        ],
        resolver: ({ semana = 0, semanas = 1 }) => ({
          destaque: `Junto ${brl(semana! * semanas!)}`,
          passos: [`${brl(semana!)} × ${semanas} semanas = ${brl(semana! * semanas!)}`],
          dica: "Guardar um pouco sempre chega mais longe do que guardar muito de vez em quando.",
        }),
      },
      {
        id: "mercado",
        emoji: "🛒",
        titulo: "Compras no mercado",
        pergunta: "Vou levar várias unidades do mesmo produto. Quanto vai custar tudo?",
        campos: [
          { id: "qtd", rotulo: "Quantidade", padrao: 6, min: 1, max: 200, sufixo: "unidades" },
          { id: "preco", rotulo: "Preço de cada", padrao: 3.75, max: 1000, sufixo: "reais" },
        ],
        resolver: ({ qtd = 1, preco = 0 }) => ({
          destaque: `Total: ${brl(qtd! * preco!)}`,
          passos: [`${qtd} × ${brl(preco!)} = ${brl(qtd! * preco!)}`],
          dica: "Multiplicar o preço pela quantidade dá o valor total do carrinho.",
        }),
      },
      {
        id: "dividir",
        emoji: "🍕",
        titulo: "Dividir a conta",
        pergunta: "Os amigos dividiram o valor igualmente. Quanto cada um paga?",
        campos: [
          { id: "total", rotulo: "Conta total", padrao: 48, max: 10000, sufixo: "reais" },
          { id: "pessoas", rotulo: "Pessoas", padrao: 4, min: 1, max: 100 },
        ],
        resolver: ({ total = 0, pessoas = 1 }) => ({
          destaque: `Cada um paga ${brl(total! / pessoas!)}`,
          passos: [
            `${brl(total!)} ÷ ${pessoas} ${plural(pessoas!, "pessoa", "pessoas")} = ${brl(total! / pessoas!)}`,
          ],
          dica: "Dividir igual é justo quando todos comeram parecido.",
        }),
      },
      {
        id: "falta",
        emoji: "🎮",
        titulo: "Quanto falta para comprar",
        pergunta: "Quero um brinquedo. Quantas semanas de economia até conseguir?",
        campos: [
          { id: "preco", rotulo: "Brinquedo custa", padrao: 120, max: 10000, sufixo: "reais" },
          { id: "tenho", rotulo: "Já tenho", padrao: 35, max: 10000, sufixo: "reais" },
          {
            id: "semana",
            rotulo: "Guardo por semana",
            padrao: 10,
            min: 1,
            max: 1000,
            sufixo: "reais",
          },
        ],
        resolver: ({ preco = 0, tenho = 0, semana = 1 }) => {
          const falta = Math.max(0, preco! - tenho!);
          const semanas = Math.ceil(falta / semana!);
          return {
            destaque:
              falta === 0
                ? "Já dá para comprar!"
                : `Faltam ${semanas} ${plural(semanas, "semana", "semanas")}`,
            passos: [
              `Falta: ${brl(preco!)} − ${brl(tenho!)} = ${brl(falta)}`,
              `${brl(falta)} ÷ ${brl(semana!)} por semana = ${num(falta / semana!)} → arredonda para cima: ${semanas}`,
            ],
            dica: "Planejar a compra ajuda a não gastar por impulso.",
          };
        },
      },
    ],
  },
  {
    id: "porcentagem",
    nome: "Porcentagem",
    emoji: "🏷️",
    cores: ["#06b6d4", "#0e7490"],
    exemplos: [
      {
        id: "desconto",
        emoji: "🏷️",
        titulo: "Desconto na loja",
        pergunta: "A loja fez uma promoção. Quanto vou pagar?",
        campos: [
          { id: "preco", rotulo: "Preço", padrao: 80, max: 100000, sufixo: "reais" },
          { id: "desc", rotulo: "Desconto", padrao: 25, max: 100, sufixo: "%" },
        ],
        resolver: ({ preco = 0, desc = 0 }) => {
          const abate = (preco! * desc!) / 100;
          return {
            destaque: `Pago ${brl(preco! - abate)}`,
            passos: [
              `${desc}% de ${brl(preco!)} = ${brl(abate)}`,
              `${brl(preco!)} − ${brl(abate)} = ${brl(preco! - abate)}`,
            ],
            dica: "Desconto de 50% é a metade; de 10% é só andar uma casa com a vírgula.",
          };
        },
      },
      {
        id: "bateria",
        emoji: "🔋",
        titulo: "Bateria do celular",
        pergunta: "Se cada 1% de bateria dura alguns minutos, quanto tempo ainda tenho?",
        campos: [
          { id: "pct", rotulo: "Bateria em", padrao: 40, max: 100, sufixo: "%" },
          { id: "min", rotulo: "Cada 1% dura", padrao: 3, min: 1, max: 30, sufixo: "min" },
        ],
        resolver: ({ pct = 0, min = 1 }) => ({
          destaque: `Dura ${duracao(pct! * min!)}`,
          passos: [`${pct}% × ${min} min = ${pct! * min!} min`, `Isso dá ${duracao(pct! * min!)}.`],
          dica: "Porcentagem também mede o que ainda resta de algo.",
        }),
      },
      {
        id: "prova",
        emoji: "📝",
        titulo: "Nota da prova",
        pergunta: "Acertei algumas questões. Que porcentagem de acertos é essa?",
        campos: [
          { id: "acertos", rotulo: "Acertei", padrao: 16, max: 1000, sufixo: "questões" },
          { id: "total", rotulo: "De", padrao: 20, min: 1, max: 1000, sufixo: "questões" },
        ],
        resolver: ({ acertos = 0, total = 1 }) => {
          const p = (acertos! / total!) * 100;
          return {
            destaque: `${num(p)}% de acertos`,
            passos: [
              `${acertos} ÷ ${total} = ${num(acertos! / total!)}`,
              `${num(acertos! / total!)} × 100 = ${num(p)}%`,
            ],
            dica: "É assim que boletins e pesquisas contam os resultados.",
          };
        },
      },
      {
        id: "gols",
        emoji: "⚽",
        titulo: "Aproveitamento no futebol",
        pergunta: "Em quantos chutes ao gol o time marcou? Qual foi o aproveitamento?",
        campos: [
          { id: "gols", rotulo: "Gols", padrao: 6, max: 200 },
          { id: "chutes", rotulo: "Chutes ao gol", padrao: 15, min: 1, max: 500 },
        ],
        resolver: ({ gols = 0, chutes = 1 }) => {
          const p = (gols! / chutes!) * 100;
          return {
            destaque: `Aproveitamento: ${num(p)}%`,
            passos: [`${gols} ÷ ${chutes} × 100 = ${num(p)}%`],
            dica: "Os narradores usam porcentagem para comparar jogadores e times.",
          };
        },
      },
      {
        id: "agua",
        emoji: "💧",
        titulo: "Meta de água do dia",
        pergunta: "Já bebi alguns copos da meta de hoje. Quanto da meta cumpri?",
        campos: [
          { id: "copos", rotulo: "Bebi", padrao: 5, max: 50, sufixo: "copos" },
          { id: "meta", rotulo: "Meta do dia", padrao: 8, min: 1, max: 50, sufixo: "copos" },
        ],
        resolver: ({ copos = 0, meta = 1 }) => {
          const p = Math.min(100, (copos! / meta!) * 100);
          const falta = Math.max(0, meta! - copos!);
          return {
            destaque: `${num(p)}% da meta`,
            passos: [
              `${copos} ÷ ${meta} × 100 = ${num(p)}%`,
              falta > 0 ? `Faltam ${falta} ${plural(falta, "copo", "copos")}.` : "Meta cumprida!",
            ],
            dica: "Metas em porcentagem mostram o quanto já andamos no caminho.",
          };
        },
      },
    ],
  },
  {
    id: "fracoes",
    nome: "Frações",
    emoji: "🍕",
    cores: ["#f43f5e", "#be123c"],
    exemplos: [
      {
        id: "pizza",
        emoji: "🍕",
        titulo: "Fatias de pizza",
        pergunta: "A pizza foi cortada em fatias. Que fração já foi comida?",
        campos: [
          { id: "comeu", rotulo: "Fatias comidas", padrao: 3, max: 64 },
          { id: "total", rotulo: "Fatias da pizza", padrao: 8, min: 1, max: 64 },
        ],
        resolver: ({ comeu = 0, total = 1 }) => {
          const c = Math.min(comeu!, total!);
          return {
            destaque: `${c}/${total} da pizza`,
            passos: [`Comeram ${c} de ${total} fatias iguais.`, `Sobraram ${total! - c}/${total}.`],
            dica: "O número de baixo diz em quantas partes iguais o inteiro foi dividido.",
          };
        },
      },
      {
        id: "bolo",
        emoji: "🎂",
        titulo: "Receita de bolo",
        pergunta:
          "A receita rende algumas porções, mas vou fazer para mais gente. Quanto de farinha?",
        campos: [
          { id: "xic", rotulo: "Receita pede", padrao: 2, min: 1, max: 50, sufixo: "xícaras" },
          { id: "porcoes", rotulo: "Rende", padrao: 8, min: 1, max: 100, sufixo: "porções" },
          { id: "quero", rotulo: "Quero fazer", padrao: 12, min: 1, max: 200, sufixo: "porções" },
        ],
        resolver: ({ xic = 1, porcoes = 1, quero = 1 }) => {
          const novo = (xic! * quero!) / porcoes!;
          return {
            destaque: `${num(novo)} xícaras de farinha`,
            passos: [
              `${quero} ÷ ${porcoes} = ${num(quero! / porcoes!)} (quantas receitas)`,
              `${xic} × ${num(quero! / porcoes!)} = ${num(novo)} xícaras`,
            ],
            dica: "Aumentar ou diminuir receitas é uma fração da receita original.",
          };
        },
      },
      {
        id: "copos",
        emoji: "🥤",
        titulo: "Copos de suco",
        pergunta: "Uma garrafa de suco vai ser dividida em copos. Quantos copos enchem?",
        campos: [
          { id: "litros", rotulo: "Garrafa de", padrao: 2, min: 0.5, max: 20, sufixo: "litros" },
          { id: "copo", rotulo: "Copo de", padrao: 250, min: 50, max: 1000, sufixo: "ml" },
        ],
        resolver: ({ litros = 1, copo = 250 }) => {
          const ml = litros! * 1000;
          const copos = Math.floor(ml / copo!);
          return {
            destaque: `${copos} ${plural(copos, "copo", "copos")}`,
            passos: [
              `${num(litros!)} L = ${num(ml)} ml`,
              `${num(ml)} ÷ ${copo} = ${num(ml / copo!)} → ${copos} inteiros`,
            ],
            dica: "Um copo de 250 ml é 1/4 de litro: quatro copos enchem 1 litro.",
          };
        },
      },
      {
        id: "chocolate",
        emoji: "🍫",
        titulo: "Barra de chocolate",
        pergunta: "Reparti a barra com amigos. Que fração ficou para mim?",
        campos: [
          { id: "pedacos", rotulo: "Pedaços da barra", padrao: 12, min: 1, max: 100 },
          { id: "dei", rotulo: "Dei aos amigos", padrao: 9, max: 100, sufixo: "pedaços" },
        ],
        resolver: ({ pedacos = 1, dei = 0 }) => {
          const d = Math.min(dei!, pedacos!);
          const fico = pedacos! - d;
          return {
            destaque: `Fiquei com ${fico}/${pedacos}`,
            passos: [`${pedacos} − ${d} = ${fico} pedaços`, `Dividi ${d}/${pedacos} da barra.`],
            dica: "Somando o que dei e o que fiquei, dá o inteiro: 12/12.",
          };
        },
      },
    ],
  },
  {
    id: "medidas",
    nome: "Medidas",
    emoji: "📏",
    cores: ["#f59e0b", "#b45309"],
    exemplos: [
      {
        id: "altura",
        emoji: "📏",
        titulo: "Altura dos colegas",
        pergunta: "Dois colegas se mediram. Quantos centímetros um é mais alto que o outro?",
        campos: [
          { id: "a", rotulo: "Colega A", padrao: 142, min: 50, max: 220, sufixo: "cm" },
          { id: "b", rotulo: "Colega B", padrao: 135, min: 50, max: 220, sufixo: "cm" },
        ],
        resolver: ({ a = 0, b = 0 }) => {
          const dif = Math.abs(a! - b!);
          return {
            destaque: dif === 0 ? "Mesma altura!" : `${dif} cm de diferença`,
            passos: [
              `A: ${num(a! / 100)} m   |   B: ${num(b! / 100)} m`,
              `${Math.max(a!, b!)} − ${Math.min(a!, b!)} = ${dif} cm`,
            ],
            dica: "1 metro tem 100 centímetros.",
          };
        },
      },
      {
        id: "caminho",
        emoji: "🚶",
        titulo: "Caminho até a escola",
        pergunta: "A pé, quanto tempo levo? E quantos quilômetros são?",
        campos: [
          { id: "metros", rotulo: "Distância", padrao: 900, min: 10, max: 20000, sufixo: "m" },
          { id: "ritmo", rotulo: "Ando", padrao: 60, min: 20, max: 150, sufixo: "m por minuto" },
        ],
        resolver: ({ metros = 0, ritmo = 1 }) => ({
          destaque: `${duracao(metros! / ritmo!)} de caminhada`,
          passos: [
            `${num(metros!)} m = ${num(metros! / 1000)} km`,
            `${num(metros!)} ÷ ${ritmo} = ${num(metros! / ritmo!)} minutos`,
          ],
          dica: "1 quilômetro tem 1.000 metros.",
        }),
      },
      {
        id: "mochila",
        emoji: "🎒",
        titulo: "Peso da mochila",
        pergunta: "Médicos recomendam no máximo 10% do peso da criança. Qual o limite da mochila?",
        campos: [
          { id: "peso", rotulo: "Meu peso", padrao: 32, min: 10, max: 120, sufixo: "kg" },
          { id: "mochila", rotulo: "Minha mochila", padrao: 4.5, min: 0, max: 30, sufixo: "kg" },
        ],
        resolver: ({ peso = 0, mochila = 0 }) => {
          const limite = peso! / 10;
          return {
            destaque: `Limite: ${num(limite)} kg`,
            passos: [
              `10% de ${num(peso!)} kg = ${num(limite)} kg`,
              mochila! <= limite
                ? `Sua mochila (${num(mochila!)} kg) está dentro do limite.`
                : `Sua mochila (${num(mochila!)} kg) passa ${num(mochila! - limite)} kg do limite: tire algo.`,
            ],
            dica: "Cuidar da coluna começa na mochila.",
          };
        },
      },
      {
        id: "fita",
        emoji: "🎀",
        titulo: "Cortar fita",
        pergunta: "Tenho um rolo de fita para cortar pedaços iguais. Quantos saem e quanto sobra?",
        campos: [
          { id: "total", rotulo: "Fita de", padrao: 200, min: 1, max: 10000, sufixo: "cm" },
          { id: "pedaco", rotulo: "Cada pedaço", padrao: 30, min: 1, max: 1000, sufixo: "cm" },
        ],
        resolver: ({ total = 1, pedaco = 1 }) => {
          const q = Math.floor(total! / pedaco!);
          const sobra = total! - q * pedaco!;
          return {
            destaque: `${q} pedaços, sobram ${num(sobra)} cm`,
            passos: [
              `${total} ÷ ${pedaco} = ${q} inteiros`,
              `${q} × ${pedaco} = ${q * pedaco!} cm usados; sobra ${num(sobra)} cm`,
            ],
            dica: "É a divisão com resto: o resto é o pedacinho que sobrou.",
          };
        },
      },
    ],
  },
  {
    id: "tempo",
    nome: "Tempo",
    emoji: "⏰",
    cores: ["#8b5cf6", "#6d28d9"],
    exemplos: [
      {
        id: "fim",
        emoji: "🔔",
        titulo: "Que horas termina?",
        pergunta: "A atividade começa em um horário e dura um tempo. A que horas acaba?",
        campos: [
          { id: "h", rotulo: "Começa às", padrao: 9, max: 23, sufixo: "h" },
          { id: "m", rotulo: "e", padrao: 15, max: 59, sufixo: "min" },
          { id: "dur", rotulo: "Dura", padrao: 90, min: 1, max: 1440, sufixo: "minutos" },
        ],
        resolver: ({ h = 0, m = 0, dur = 0 }) => {
          const ini = h! * 60 + m!;
          return {
            destaque: `Termina às ${hhmm(ini + dur!)}`,
            passos: [
              `Começa às ${hhmm(ini)}`,
              `${dur} min = ${duracao(dur!)}`,
              `${hhmm(ini)} + ${duracao(dur!)} = ${hhmm(ini + dur!)}`,
            ],
            dica: "Assim se calcula a hora da saída da escola ou do fim do filme.",
          };
        },
      },
      {
        id: "tela",
        emoji: "📱",
        titulo: "Tempo de tela",
        pergunta: "Quanto tempo de tela junto em uma semana usando o celular todo dia?",
        campos: [
          { id: "horas", rotulo: "Uso por dia", padrao: 3, min: 0, max: 24, sufixo: "horas" },
        ],
        resolver: ({ horas = 0 }) => ({
          destaque: `${num(horas! * 7)} horas por semana`,
          passos: [
            `${horas} h × 7 dias = ${num(horas! * 7)} h`,
            `Isso equivale a ${num((horas! * 7) / 24)} dias inteiros por semana.`,
          ],
          dica: "Somar o tempo de cada dia ajuda a combinar limites saudáveis.",
        }),
      },
      {
        id: "viagem",
        emoji: "🚌",
        titulo: "Tempo de viagem",
        pergunta: "Vou viajar de ônibus. Quanto tempo leva a viagem?",
        campos: [
          { id: "km", rotulo: "Distância", padrao: 180, min: 1, max: 5000, sufixo: "km" },
          { id: "vel", rotulo: "Velocidade média", padrao: 60, min: 5, max: 200, sufixo: "km/h" },
        ],
        resolver: ({ km = 1, vel = 1 }) => ({
          destaque: `Viagem de ${duracao((km! / vel!) * 60)}`,
          passos: [
            `${km} km ÷ ${vel} km/h = ${num(km! / vel!)} horas`,
            `Isso dá ${duracao((km! / vel!) * 60)}.`,
          ],
          dica: "Tempo = distância ÷ velocidade.",
        }),
      },
      {
        id: "idade",
        emoji: "🎂",
        titulo: "Quantos anos vou ter?",
        pergunta: "Nasci em um ano. Que idade terei em outro ano?",
        campos: [
          { id: "nasc", rotulo: "Nasci em", padrao: 2016, min: 1990, max: 2026 },
          { id: "ano", rotulo: "Ano futuro", padrao: 2030, min: 2026, max: 2100 },
        ],
        resolver: ({ nasc = 2016, ano = 2030 }) => ({
          destaque: `${ano! - nasc!} anos`,
          passos: [`${ano} − ${nasc} = ${ano! - nasc!} anos`],
          dica: "Linha do tempo: subtrair dois anos mostra quanto tempo passou.",
        }),
      },
    ],
  },
  {
    id: "formas",
    nome: "Espaços e formas",
    emoji: "📐",
    cores: ["#0ea5e9", "#0369a1"],
    exemplos: [
      {
        id: "cerca",
        emoji: "🌳",
        titulo: "Cerca do quintal",
        pergunta: "Quero cercar um quintal retangular. Quantos metros de tela preciso?",
        campos: [
          { id: "c", rotulo: "Comprimento", padrao: 12, min: 1, max: 500, sufixo: "m" },
          { id: "l", rotulo: "Largura", padrao: 8, min: 1, max: 500, sufixo: "m" },
        ],
        resolver: ({ c = 1, l = 1 }) => ({
          destaque: `${num(2 * (c! + l!))} metros de tela`,
          passos: [
            `${c} + ${l} + ${c} + ${l} = ${num(2 * (c! + l!))} m`,
            "Esse é o perímetro: a volta toda.",
          ],
          dica: "Perímetro é a medida do contorno de uma figura.",
        }),
      },
      {
        id: "piso",
        emoji: "🏠",
        titulo: "Piso da sala",
        pergunta: "Vou colocar piso na sala. Quantos metros quadrados de piso?",
        campos: [
          { id: "c", rotulo: "Comprimento", padrao: 5, min: 1, max: 100, sufixo: "m" },
          { id: "l", rotulo: "Largura", padrao: 4, min: 1, max: 100, sufixo: "m" },
          { id: "caixa", rotulo: "Cada caixa cobre", padrao: 2, min: 0.5, max: 20, sufixo: "m²" },
        ],
        resolver: ({ c = 1, l = 1, caixa = 1 }) => {
          const area = c! * l!;
          const caixas = Math.ceil(area / caixa!);
          return {
            destaque: `${num(area)} m² → ${caixas} ${plural(caixas, "caixa", "caixas")}`,
            passos: [
              `${c} × ${l} = ${num(area)} m²`,
              `${num(area)} ÷ ${num(caixa!)} = ${num(area / caixa!)} → ${caixas} caixas`,
            ],
            dica: "Área é quanto de superfície uma figura cobre.",
          };
        },
      },
      {
        id: "tinta",
        emoji: "🎨",
        titulo: "Pintar a parede",
        pergunta: "Uma lata de tinta rende certa área. Quantas latas para pintar a parede?",
        campos: [
          { id: "alt", rotulo: "Altura da parede", padrao: 2.7, min: 1, max: 10, sufixo: "m" },
          { id: "comp", rotulo: "Comprimento", padrao: 4, min: 1, max: 50, sufixo: "m" },
          { id: "lata", rotulo: "Cada lata rende", padrao: 10, min: 1, max: 100, sufixo: "m²" },
        ],
        resolver: ({ alt = 1, comp = 1, lata = 1 }) => {
          const area = alt! * comp!;
          const latas = Math.ceil(area / lata!);
          return {
            destaque: `${latas} ${plural(latas, "lata", "latas")} de tinta`,
            passos: [
              `${num(alt!)} × ${num(comp!)} = ${num(area)} m²`,
              `${num(area)} ÷ ${num(lata!)} = ${num(area / lata!)} → ${latas}`,
            ],
            dica: "Pedreiros e pintores usam área o tempo todo para não comprar demais.",
          };
        },
      },
      {
        id: "quadra",
        emoji: "🏃",
        titulo: "Voltas na quadra",
        pergunta: "Correr em volta da quadra: quantas voltas para completar uma distância?",
        campos: [
          { id: "c", rotulo: "Comprimento", padrao: 28, min: 1, max: 200, sufixo: "m" },
          { id: "l", rotulo: "Largura", padrao: 15, min: 1, max: 200, sufixo: "m" },
          { id: "meta", rotulo: "Quero correr", padrao: 500, min: 10, max: 20000, sufixo: "m" },
        ],
        resolver: ({ c = 1, l = 1, meta = 1 }) => {
          const volta = 2 * (c! + l!);
          return {
            destaque: `${num(meta! / volta)} voltas`,
            passos: [
              `Uma volta: ${num(volta)} m`,
              `${num(meta!)} ÷ ${num(volta)} = ${num(meta! / volta)} voltas`,
            ],
            dica: "O perímetro da quadra é o tamanho de uma volta completa.",
          };
        },
      },
    ],
  },
];
