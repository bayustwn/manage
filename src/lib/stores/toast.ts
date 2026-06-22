import { atom } from "nanostores";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  remaining: number;
  startedAt: number;
};

export const toasts = atom<Toast[]>([]);

const timers = new Map<string, ReturnType<typeof setTimeout>>();
let counter = 0;

const MAX_TOASTS = 5;
const DURATION = 4000;

export function addToast(message: string, variant: ToastVariant = "default"): string {
  const id = `toast-${++counter}`;
  const toast: Toast = { id, message, variant, remaining: DURATION, startedAt: Date.now() };

  const current = toasts.get();
  const next = [...current, toast];

  if (next.length > MAX_TOASTS) {
    const removed = next.shift()!;
    clearTimer(removed.id);
  }

  toasts.set(next);
  scheduleDismiss(id);

  return id;
}

function scheduleDismiss(id: string) {
  clearTimer(id);
  const toast = toasts.get().find((t) => t.id === id);
  const delay = toast?.remaining ?? DURATION;

  const timer = setTimeout(() => removeToast(id), delay);
  timers.set(id, timer);

  toasts.set(toasts.get().map((t) => (t.id === id ? { ...t, startedAt: Date.now() } : t)));
}

function clearTimer(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

export function pauseToast(id: string) {
  const toast = toasts.get().find((t) => t.id === id);
  if (!toast) return;

  const elapsed = Date.now() - toast.startedAt;
  const remaining = Math.max(toast.remaining - elapsed, 0);

  clearTimer(id);
  toasts.set(toasts.get().map((t) => (t.id === id ? { ...t, remaining } : t)));
}

export function resumeToast(id: string) {
  const toast = toasts.get().find((t) => t.id === id);
  if (!toast) return;
  if (toast.remaining <= 0) {
    removeToast(id);
    return;
  }

  scheduleDismiss(id);
}

export function removeToast(id: string) {
  clearTimer(id);
  toasts.set(toasts.get().filter((t) => t.id !== id));
}
