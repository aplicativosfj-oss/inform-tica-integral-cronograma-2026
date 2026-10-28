import {
  Award,
  BarChart3,
  CalendarClock,
  CalendarPlus,
  CalendarSearch,
  ClipboardList,
  ClipboardCheck,
  Gauge,
  GraduationCap,
  KeyRound,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  MonitorSmartphone,
  Settings2,
  Target,
  TrendingUp,
  UserX,
  Users2,
} from "lucide-react";

import { PROGRAMACAO_ATIVA } from "@/lib/recursos";

/** Seções do painel de gestão: a lateral, o menu do celular e a visão geral usam esta lista. */
const NAV_GROUPS = [
  {
    label: null,
    items: [{ to: "/dashboard", label: "Visão geral", icon: LayoutDashboard }],
  },
  {
    label: "Cadastro",
    items: [
      {
        to: "/dashboard/turmas",
        label: "Turmas e alunos",
        desc: "Turmas, regentes e cadastro de alunos",
        icon: Users2,
      },
      {
        to: "/dashboard/grupos",
        label: "Turmas e grupos",
        desc: "Grupos de revezamento de cada turma",
        icon: Layers,
        programacao: true,
      },
      {
        to: "/dashboard/alunos",
        label: "Buscar aluno",
        desc: "Encontre um aluno e a turma dele",
        icon: GraduationCap,
      },
    ],
  },
  {
    label: "Rotina",
    items: [
      {
        to: "/dashboard/laboratorio",
        label: "Laboratório",
        desc: "Marcar, acompanhar ao vivo e relatórios",
        icon: MonitorSmartphone,
      },
      {
        to: "/dashboard/aulas",
        label: "Aulas",
        desc: "Aulas com turma, grupo e horário",
        icon: CalendarPlus,
        programacao: true,
      },
      {
        to: "/dashboard/programacao",
        label: "Programação",
        desc: "Ajustes manuais da programação",
        icon: CalendarClock,
        programacao: true,
      },
      {
        to: "/dashboard/frequencia",
        label: "Frequência",
        desc: "Quem participou ou faltou, por período",
        icon: CalendarSearch,
        programacao: true,
      },
      {
        to: "/dashboard/faltas",
        label: "Faltas do mês",
        desc: "Ausências do mês por turma",
        icon: UserX,
        programacao: true,
      },
      {
        to: "/dashboard/atividades",
        label: "Área do Aluno",
        desc: "Atividades remotas e PIN dos alunos",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    label: "Pedagógico",
    items: [
      {
        to: "/dashboard/avaliacao",
        label: "Avaliação diagnóstica",
        desc: "Resultados da avaliação diagnóstica",
        icon: BarChart3,
      },
      {
        to: "/dashboard/evolucao",
        label: "Evolução diagnóstica",
        desc: "Como cada turma evoluiu",
        icon: TrendingUp,
      },
      {
        to: "/dashboard/rendimento",
        label: "Rendimento bimestral",
        desc: "Notas e rendimento por bimestre",
        icon: Award,
      },
      {
        to: "/dashboard/mapa-classe",
        label: "Mapa de classe",
        desc: "Leitura e escrita aluno por aluno",
        icon: MapIcon,
      },
      {
        to: "/dashboard/trilhas",
        label: "Progresso das trilhas",
        desc: "Estrelas da “Minha trilha”",
        icon: Target,
      },
      {
        to: "/dashboard/simulados",
        label: "Simulados",
        desc: "Montar, aplicar e acompanhar provas",
        icon: ClipboardList,
      },
      {
        to: "/dashboard/indicadores",
        label: "Indicadores das turmas",
        desc: "Nota de 0 a 10 do desenvolvimento",
        icon: Gauge,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        to: "/dashboard/acessos",
        label: "Senhas de acesso",
        desc: "Senhas de professores e mediadores",
        icon: KeyRound,
      },
      {
        to: "/dashboard/configuracoes",
        label: "Configurações",
        desc: "Dados da escola e regras do sistema",
        icon: Settings2,
      },
    ],
  },
] as const;

export type ItemNav = {
  to: string;
  label: string;
  desc?: string;
  icon: typeof LayoutDashboard;
  programacao?: boolean;
};

export const GRUPOS_VISIVEIS = NAV_GROUPS.map((g) => ({
  label: g.label,
  items: (g.items as readonly ItemNav[]).filter((i) => PROGRAMACAO_ATIVA || !i.programacao),
})).filter((g) => g.items.length > 0);

export const estaAtivo = (pathname: string, to: string) =>
  to === "/dashboard" ? pathname === to || pathname === `${to}/` : pathname.startsWith(to);
