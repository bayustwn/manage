import { persistentAtom } from "@nanostores/persistent";
import { computed } from "nanostores";

export const sidebarOpen = persistentAtom("sidebar-open", true, {
  encode: (v) => (v ? "true" : "false"),
  decode: (v) => v === "true",
});

export const theme = persistentAtom<"light" | "dark">("theme", "light");

export const isDark = computed(theme, (currentTheme) => currentTheme === "dark");

export function toggleSidebar() {
  sidebarOpen.set(!sidebarOpen.get());
}

export function setTheme(t: "light" | "dark") {
  theme.set(t);
}

export function toggleTheme() {
  theme.set(theme.get() === "dark" ? "light" : "dark");
}
