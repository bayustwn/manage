<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { useStore } from "$lib/stores/use-store.svelte.js";
  import { theme } from "$lib/stores/ui";
  import { CheckCircle2 } from "@lucide/svelte";

  let { children } = $props();

  const currentTheme = useStore(theme);
  const isDark = $derived(currentTheme.current === "dark");

  let session: App.SessionUser | null | undefined = $state();
  let isPending = $state(true);

  $effect(() => {
    return authClient.useSession().subscribe((value) => {
      session = value.data?.user;
      isPending = value.isPending;
    });
  });

  $effect(() => {
    if (!isPending && session) {
      goto("/dashboard", { replaceState: true });
    }
  });

  const features = [
    {
      title: "Kanban Boards",
      description: "Visualize your workflow with drag-and-drop boards",
    },
    {
      title: "Team Collaboration",
      description: "Assign tasks, leave comments, and work together in real-time",
    },
    {
      title: "Progress Tracking",
      description: "Monitor project status with customizable dashboards",
    },
  ];
</script>

<div class="flex min-h-dvh">
  <div class="flex w-full items-center justify-center px-4 lg:w-1/2">
    {@render children()}
  </div>

  <div
    class="relative hidden w-1/2 flex-col justify-between p-12 lg:flex"
    class:bg-primary={!isDark}
    class:bg-muted={isDark}
  >
    <div class="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="none" class="shrink-0">
        <rect width="32" height="32" rx="8" class="fill-primary-foreground" class:fill-foreground={isDark} />
        <path d="M8 24V8l8 8 8-8v16" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-primary" />
      </svg>
      <span class="text-primary-foreground text-lg font-semibold" class:text-foreground={isDark}>Manage</span>
    </div>

    <div class="mx-auto max-w-sm">
      <div class="mb-8">
        <h2 class="text-primary-foreground mb-2 text-3xl font-bold" class:text-foreground={isDark}>
          Organize your projects
        </h2>
        <p class="text-primary-foreground/70" class:text-muted-foreground={isDark}>
          Plan, track, and manage your team's work from anywhere.
        </p>
      </div>

      <div class="flex flex-col gap-4">
        {#each features as feature}
          <div class="flex items-start gap-3">
            <CheckCircle2
              class={isDark ? "text-foreground mt-0.5 size-5 shrink-0" : "text-primary-foreground mt-0.5 size-5 shrink-0"}
            />
            <div>
              <p class="text-primary-foreground text-sm font-medium" class:text-foreground={isDark}>{feature.title}</p>
              <p class="text-primary-foreground/60 text-xs" class:text-muted-foreground={isDark}>{feature.description}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <p class="text-primary-foreground/40 text-xs" class:text-muted-foreground={isDark}>
      &copy; 2026 Manage. All rights reserved.
    </p>

    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="bg-primary-foreground/5 absolute -top-20 -right-20 size-80 rounded-full"></div>
      <div class="bg-primary-foreground/5 absolute -bottom-20 -left-20 size-60 rounded-full"></div>
    </div>
  </div>
</div>
