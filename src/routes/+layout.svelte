<script lang="ts">
  import "$lib/../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import Toast from "$lib/components/ui/toast.svelte";
  import { theme } from "$lib/stores/ui";
  import { useStore } from "$lib/stores/use-store.svelte.js";

  let { children } = $props();

  const currentTheme = useStore(theme);

  $effect(() => {
    document.documentElement.classList.toggle("dark", currentTheme === "dark");
  });
</script>

<svelte:head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#6D28D9" />
  <link rel="icon" href={favicon} />
</svelte:head>

<div class={currentTheme}>
  {@render children()}
  <Toast />
</div>
