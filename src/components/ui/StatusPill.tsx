import type { ReactNode } from "react";
import type { TonoSemantico } from "@/features/dashboard/data";
import { claseTonoSuave } from "@/shared/ui/estilosDashboard";
import { cn } from "@/lib/utils";

type StatusPillTone = TonoSemantico | "warning";

type StatusPillProps = {
  children: ReactNode;
  tone: StatusPillTone;
  className?: string;
};

const warningClassName = "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300";

const getToneClassName = (tone: StatusPillTone): string =>
  tone === "warning" ? warningClassName : claseTonoSuave(tone);

export const StatusPill = ({ children, tone, className }: StatusPillProps) => (
  <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", getToneClassName(tone), className)}>
    {children}
  </span>
);