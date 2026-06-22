<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import Toast from "$lib/components/ui/toast.svelte";
  import { theme } from "$lib/stores/ui";
  import { useStore } from "$lib/stores/use-store.svelte.js";

  let { children } = $props();

  const currentTheme = useStore(theme);

  $effect(() => {
    document.documentElement.classList.toggle("dark", currentTheme.current === "dark");
    document.documentElement.style.colorScheme = currentTheme.current;
  });
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#6D28D9" />
  <link rel="icon" href={favicon} />
  <script>
    try {
      const theme = localStorage.getItem("theme") || "light";
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    } catch {}
  </script>
</svelte:head>

{@render children()}
<Toast />
