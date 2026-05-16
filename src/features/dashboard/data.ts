import { ROLES, type RolUsuario } from "@/features/auth/roles";
import type enCommon from "@/locales/en/common.json";

export const usuarioDashboard = {
  nombre: "Marina Silva",
  email: "marina@magictronic.com",
};

export type VarianteMetrica = "invertida" | "suave";
export type TonoSemantico = "info" | "success" | "destructive" | "muted";
export type TonoBarraAnalitica = "rayado" | "success" | "invertida" | "suave";

type LlavesAnidadas<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? `${K}.${LlavesAnidadas<T[K]>}` : K;
    }[keyof T & string]
  : never;

export type LlaveTraduccion = LlavesAnidadas<typeof enCommon>;

export interface BarraAnalitica {
  dia: string;
  valor: number;
  tono: TonoBarraAnalitica;
  activa: boolean;
}

export interface Metrica {
  id: string;
  etiquetaKey?: LlaveTraduccion;
  etiqueta?: string;
  valor: string;
  ayudaKey?: LlaveTraduccion;
  ayuda?: string;
  variante: VarianteMetrica;
  detallePath?: string;
}

export interface ProyectoDashboard {
  id: string;
  nombreKey: LlaveTraduccion;
  vencimiento: string;
  tono: TonoSemantico;
}

export interface MiembroEquipoDashboard {
  id: string;
  nombreKey: LlaveTraduccion;
  tareaKey: LlaveTraduccion;
  estadoKey: LlaveTraduccion;
  tono: TonoSemantico;
}

export interface RecordatorioDashboard {
  tituloKey: LlaveTraduccion;
  horario: string;
}

export interface TextosDashboardRol {
  primaryActionKey: LlaveTraduccion;
  secondaryActionKey: LlaveTraduccion;
  analyticsTitleKey: LlaveTraduccion;
  projectsTitleKey: LlaveTraduccion;
  projectsNewKey: LlaveTraduccion;
  teamTitleKey: LlaveTraduccion;
  teamInviteKey: LlaveTraduccion;
  reminderSectionTitleKey: LlaveTraduccion;
  reminderActionKey: LlaveTraduccion;
  progressTitleKey: LlaveTraduccion;
  progressSubtitleKey: LlaveTraduccion;
  timerTitleKey: LlaveTraduccion;
}

export interface DatosDashboardRol {
  metricas: Metrica[];
  barrasAnaliticas: BarraAnalitica[];
  proyectos: ProyectoDashboard[];
  miembrosEquipo: MiembroEquipoDashboard[];
  recordatorio: RecordatorioDashboard;
  progresoPagos: number;
  tiempoSesion: string;
  textos: TextosDashboardRol;
}

const barrasAdmin: BarraAnalitica[] = [
  { dia: "L", valor: 56, tono: "rayado", activa: false },
  { dia: "M", valor: 74, tono: "success", activa: false },
  { dia: "X", valor: 88, tono: "success", activa: true },
  { dia: "J", valor: 82, tono: "invertida", activa: false },
  { dia: "V", valor: 68, tono: "rayado", activa: false },
  { dia: "S", valor: 52, tono: "rayado", activa: false },
  { dia: "D", valor: 66, tono: "rayado", activa: false },
];

const barrasCliente: BarraAnalitica[] = [
  { dia: "L", valor: 42, tono: "rayado", activa: false },
  { dia: "M", valor: 61, tono: "success", activa: false },
  { dia: "X", valor: 58, tono: "success", activa: false },
  { dia: "J", valor: 76, tono: "invertida", activa: true },
  { dia: "V", valor: 63, tono: "rayado", activa: false },
  { dia: "S", valor: 47, tono: "rayado", activa: false },
  { dia: "D", valor: 54, tono: "rayado", activa: false },
];

/**
 * Cada rol usa los mismos componentes visuales, pero con informacion distinta.
 * Admin ve datos globales del PSP; cliente ve datos de su propio comercio.
 */
export const datosDashboardPorRol: Record<RolUsuario, DatosDashboardRol> = {
  [ROLES.ADMIN]: {
    metricas: [
      {
        id: "admin-volume",
        etiquetaKey: "dashboard.roleContent.admin.metrics.volume.title",
        valor: "USD $248,000.00",
        ayudaKey: "dashboard.roleContent.admin.metrics.volume.helper",
        variante: "invertida",
      },
      {
        id: "admin-transactions",
        etiquetaKey: "dashboard.roleContent.admin.metrics.transactions.title",
        valor: "1,284",
        ayudaKey: "dashboard.roleContent.admin.metrics.transactions.helper",
        variante: "suave",
      },
      {
        id: "admin-merchants",
        etiquetaKey: "dashboard.roleContent.admin.metrics.merchants.title",
        valor: "86",
        ayudaKey: "dashboard.roleContent.admin.metrics.merchants.helper",
        variante: "suave",
      },
      {
        id: "admin-alerts",
        etiquetaKey: "dashboard.roleContent.admin.metrics.alerts.title",
        valor: "9",
        ayudaKey: "dashboard.roleContent.admin.metrics.alerts.helper",
        variante: "suave",
      },
    ],
    barrasAnaliticas: barrasAdmin,
    proyectos: [
      { id: "admin-settlements", nombreKey: "dashboard.roleContent.admin.projects.settlements", vencimiento: "2026-05-05", tono: "info" },
      { id: "admin-onboarding", nombreKey: "dashboard.roleContent.admin.projects.onboarding", vencimiento: "2026-05-08", tono: "success" },
      { id: "admin-risk", nombreKey: "dashboard.roleContent.admin.projects.risk", vencimiento: "2026-05-12", tono: "destructive" },
      { id: "admin-reports", nombreKey: "dashboard.roleContent.admin.projects.reports", vencimiento: "2026-05-15", tono: "muted" },
    ],
    miembrosEquipo: [
      { id: "admin-ops", nombreKey: "dashboard.roleContent.admin.team.names.operations", tareaKey: "dashboard.roleContent.admin.team.tasks.operations", estadoKey: "dashboard.team.status.inProgress", tono: "info" },
      { id: "admin-risk", nombreKey: "dashboard.roleContent.admin.team.names.risk", tareaKey: "dashboard.roleContent.admin.team.tasks.risk", estadoKey: "dashboard.team.status.pending", tono: "destructive" },
      { id: "admin-support", nombreKey: "dashboard.roleContent.admin.team.names.support", tareaKey: "dashboard.roleContent.admin.team.tasks.support", estadoKey: "dashboard.team.status.completed", tono: "success" },
      { id: "admin-finance", nombreKey: "dashboard.roleContent.admin.team.names.finance", tareaKey: "dashboard.roleContent.admin.team.tasks.finance", estadoKey: "dashboard.team.status.inProgress", tono: "info" },
    ],
    recordatorio: {
      tituloKey: "dashboard.roleContent.admin.reminder.title",
      horario: "14:00 - 16:00",
    },
    progresoPagos: 73,
    tiempoSesion: "01:24:08",
    textos: {
      primaryActionKey: "dashboard.roleContent.admin.actions.primary",
      secondaryActionKey: "dashboard.roleContent.admin.actions.secondary",
      analyticsTitleKey: "dashboard.roleContent.admin.analytics.title",
      projectsTitleKey: "dashboard.roleContent.admin.projects.title",
      projectsNewKey: "dashboard.roleContent.admin.projects.new",
      teamTitleKey: "dashboard.roleContent.admin.team.title",
      teamInviteKey: "dashboard.roleContent.admin.team.invite",
      reminderSectionTitleKey: "dashboard.roleContent.admin.reminder.sectionTitle",
      reminderActionKey: "dashboard.roleContent.admin.reminder.action",
      progressTitleKey: "dashboard.roleContent.admin.progress.title",
      progressSubtitleKey: "dashboard.roleContent.admin.progress.subtitle",
      timerTitleKey: "dashboard.roleContent.admin.timer.title",
    },
  },
  [ROLES.CLIENT]: {
    metricas: [
      {
        id: "client-sales",
        etiquetaKey: "dashboard.roleContent.client.metrics.sales.title",
        valor: "USD $38,400.00",
        ayudaKey: "dashboard.roleContent.client.metrics.sales.helper",
        variante: "invertida",
      },
      {
        id: "client-orders",
        etiquetaKey: "dashboard.roleContent.client.metrics.orders.title",
        valor: "126",
        ayudaKey: "dashboard.roleContent.client.metrics.orders.helper",
        variante: "suave",
      },
      {
        id: "client-approved",
        etiquetaKey: "dashboard.roleContent.client.metrics.approved.title",
        valor: "118",
        ayudaKey: "dashboard.roleContent.client.metrics.approved.helper",
        variante: "suave",
      },
      {
        id: "client-pending",
        etiquetaKey: "dashboard.roleContent.client.metrics.pending.title",
        valor: "4",
        ayudaKey: "dashboard.roleContent.client.metrics.pending.helper",
        variante: "suave",
      },
    ],
    barrasAnaliticas: barrasCliente,
    proyectos: [
      { id: "client-open-orders", nombreKey: "dashboard.roleContent.client.projects.openOrders", vencimiento: "2026-05-04", tono: "info" },
      { id: "client-pending-payments", nombreKey: "dashboard.roleContent.client.projects.pendingPayments", vencimiento: "2026-05-06", tono: "destructive" },
      { id: "client-sales-report", nombreKey: "dashboard.roleContent.client.projects.salesReport", vencimiento: "2026-05-09", tono: "success" },
      { id: "client-customers", nombreKey: "dashboard.roleContent.client.projects.customers", vencimiento: "2026-05-13", tono: "muted" },
    ],
    miembrosEquipo: [
      { id: "client-store", nombreKey: "dashboard.roleContent.client.team.names.store", tareaKey: "dashboard.roleContent.client.team.tasks.store", estadoKey: "dashboard.team.status.inProgress", tono: "info" },
      { id: "client-cashier", nombreKey: "dashboard.roleContent.client.team.names.cashier", tareaKey: "dashboard.roleContent.client.team.tasks.cashier", estadoKey: "dashboard.team.status.completed", tono: "success" },
      { id: "client-support", nombreKey: "dashboard.roleContent.client.team.names.support", tareaKey: "dashboard.roleContent.client.team.tasks.support", estadoKey: "dashboard.team.status.pending", tono: "destructive" },
      { id: "client-shipping", nombreKey: "dashboard.roleContent.client.team.names.shipping", tareaKey: "dashboard.roleContent.client.team.tasks.shipping", estadoKey: "dashboard.team.status.inProgress", tono: "info" },
    ],
    recordatorio: {
      tituloKey: "dashboard.roleContent.client.reminder.title",
      horario: "11:30 - 12:00",
    },
    progresoPagos: 82,
    tiempoSesion: "00:42:15",
    textos: {
      primaryActionKey: "dashboard.roleContent.client.actions.primary",
      secondaryActionKey: "dashboard.roleContent.client.actions.secondary",
      analyticsTitleKey: "dashboard.roleContent.client.analytics.title",
      projectsTitleKey: "dashboard.roleContent.client.projects.title",
      projectsNewKey: "dashboard.roleContent.client.projects.new",
      teamTitleKey: "dashboard.roleContent.client.team.title",
      teamInviteKey: "dashboard.roleContent.client.team.invite",
      reminderSectionTitleKey: "dashboard.roleContent.client.reminder.sectionTitle",
      reminderActionKey: "dashboard.roleContent.client.reminder.action",
      progressTitleKey: "dashboard.roleContent.client.progress.title",
      progressSubtitleKey: "dashboard.roleContent.client.progress.subtitle",
      timerTitleKey: "dashboard.roleContent.client.timer.title",
    },
  },
};

export const obtenerDatosDashboard = (role: RolUsuario): DatosDashboardRol => datosDashboardPorRol[role];

export const metricasProyecto = datosDashboardPorRol[ROLES.ADMIN].metricas;
export const barrasAnaliticas = datosDashboardPorRol[ROLES.ADMIN].barrasAnaliticas;
export const proyectos = datosDashboardPorRol[ROLES.ADMIN].proyectos;
export const miembrosEquipo = datosDashboardPorRol[ROLES.ADMIN].miembrosEquipo;
export const recordatorio = datosDashboardPorRol[ROLES.ADMIN].recordatorio;
export const progresoPagos = datosDashboardPorRol[ROLES.ADMIN].progresoPagos;
export const tiempoSesion = datosDashboardPorRol[ROLES.ADMIN].tiempoSesion;
