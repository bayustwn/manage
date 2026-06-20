<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { sidebarOpen, toggleSidebar } from "$lib/stores/ui";
  import { useStore } from "$lib/stores/use-store.svelte.js";
  import { LogOut, Menu, LoaderCircle } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";

  let { children } = $props();

  let session: App.SessionUser | null | undefined = $state();
  let isPending = $state(true);

  $effect(() => {
    return authClient.useSession().subscribe((value) => {
      session = value.data?.user;
      isPending = value.isPending;
    });
  });

  const sidebarIsOpen = useStore(sidebarOpen);

  $effect(() => {
    if (!isPending && !session) {
      goto("/login");
    }
  });

  async function handleSignOut() {
    try {
      await authClient.signOut();
    } catch {
      // sign-out failure is non-critical
    }
    goto("/login");
  }
</script>

{#if isPending || !session}
  <div class="flex min-h-dvh items-center justify-center">
    <LoaderCircle class="text-muted-foreground size-6 animate-spin" aria-hidden="true" />
  </div>
{:else}
  <div class="flex min-h-dvh">
    <aside
      id="sidebar"
      class="bg-card border-border flex flex-col border-r transition-all duration-200"
      class:w-60={sidebarIsOpen}
      class:w-0={!sidebarIsOpen}
      class:overflow-hidden={!sidebarIsOpen}
      inert={!sidebarIsOpen}
      role="navigation"
      aria-label="Main navigation"
    >
      {#if sidebarIsOpen}
        <div class="flex flex-1 flex-col gap-4 p-4">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="none" class="shrink-0">
              <rect width="32" height="32" rx="8" class="fill-primary" />
              <path d="M8 24V8l8 8 8-8v16" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="text-lg font-semibold">Manage</span>
          </div>
          <div class="flex flex-1 flex-col gap-1">
            <Button href="/dashboard" variant="ghost" class="w-full justify-start" aria-current="page">
              Dashboard
            </Button>
          </div>
          <div class="border-t pt-4">
            <p class="text-sm font-medium">{session.name}</p>
            <p class="text-muted-foreground truncate text-xs">{session.email}</p>
            <Button variant="ghost" onclick={handleSignOut} class="mt-2 w-full justify-start">
              <LogOut class="size-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      {/if}
    </aside>

    <div class="flex flex-1 flex-col">
      <header class="bg-card border-border flex h-12 items-center gap-2 border-b px-4">
        <Button
          variant="ghost"
          size="icon"
          onclick={toggleSidebar}
          aria-controls="sidebar"
          aria-expanded={sidebarIsOpen}
          aria-label={sidebarIsOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu class="size-4" aria-hidden="true" />
        </Button>
      </header>
      <main class="flex-1">
        {@render children()}
      </main>
    </div>
  </div>
{/if}
