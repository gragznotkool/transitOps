// Shared status color mappings to ensure consistent badge designs across components.
// As per coding conventions, statuses should never use hardcoded colors in local files.

export interface StatusStyle {
  bg: string;
  text: string;
  dot: string;
  border: string;
}

export const VEHICLE_STATUS_COLORS: Record<string, StatusStyle> = {
  Available: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200/60 dark:border-emerald-900/40',
  },
  'On Trip': {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    border: 'border-blue-200/60 dark:border-blue-900/40',
  },
  'In Shop': {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-amber-200/60 dark:border-amber-900/40',
  },
  Retired: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    border: 'border-rose-200/60 dark:border-rose-900/40',
  },
};

export const DRIVER_STATUS_COLORS: Record<string, StatusStyle> = {
  Available: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200/60 dark:border-emerald-900/40',
  },
  'On Trip': {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    border: 'border-blue-200/60 dark:border-blue-900/40',
  },
  'Off Duty': {
    bg: 'bg-slate-50 dark:bg-slate-800/40',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    border: 'border-slate-200 dark:border-slate-700/50',
  },
  Suspended: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    border: 'border-rose-200/60 dark:border-rose-900/40',
  },
};

export const TRIP_STATUS_COLORS: Record<string, StatusStyle> = {
  Draft: {
    bg: 'bg-slate-50 dark:bg-slate-850',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    border: 'border-slate-200 dark:border-slate-750',
  },
  Dispatched: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    border: 'border-blue-200/60 dark:border-blue-900/40',
  },
  Completed: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200/60 dark:border-emerald-900/40',
  },
  Cancelled: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    border: 'border-rose-200/60 dark:border-rose-900/40',
  },
};

export const MAINTENANCE_STATUS_COLORS: Record<string, StatusStyle> = {
  Open: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    border: 'border-amber-200/60 dark:border-amber-900/40',
  },
  Closed: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200/60 dark:border-emerald-900/40',
  },
};
