// Maps an application status to Tailwind classes, reused by the dashboard's
// status badges and the tracker's status <select> so the whole app color-codes
// applications consistently at a glance.
const STATUS_STYLES: Record<string, string> = {
  Applied: "bg-sage-100 text-sage-800 dark:bg-sage-900/60 dark:text-sage-200",
  Screening: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200",
  Interviewing: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  Offer: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  Rejected: "bg-clay-100 text-clay-800 dark:bg-clay-950/60 dark:text-clay-200",
  Withdrawn: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const FALLBACK_STYLE = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";

export function statusColor(status: string): string {
  return STATUS_STYLES[status] ?? FALLBACK_STYLE;
}
