<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { sidebarOpen, toggleSidebar } from "$lib/stores/ui";
  import { useStore } from "$lib/stores/use-store.svelte.js";
  import { addToast } from "$lib/stores/toast";
  import { House, LoaderCircle, LogOut, PanelLeft } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "$lib/components/ui/avatar/index.js";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog/index.js";

  let { children, data } = $props();

  const user = $derived(data.user);

  let isSigningOut = $state(false);
  let showSignOutDialog = $state(false);
  let isManualSignOut = $state(false);

  $effect(() => {
    return authClient.useSession().subscribe((value) => {
      if (!value.isPending && !value.data?.user && !isManualSignOut) {
        goto("/login", { replaceState: true });
      }
    });
  });

  const sidebarIsOpen = useStore(sidebarOpen);

  async function handleSignOut() {
    if (isSigningOut) return;

    isSigningOut = true;
    isManualSignOut = true;

    try {
      const { error } = await authClient.signOut();

      if (error) throw new Error(error.message || "Sign out failed");

      showSignOutDialog = false;
      await goto("/login", { replaceState: true });
    } catch {
      addToast("Sign out failed. Please try again.", "error");
    } finally {
      isSigningOut = false;
      isManualSignOut = false;
    }
  }
</script>

<div class="flex min-h-dvh">
  {#if sidebarIsOpen.current}
    <button
      type="button"
      class="fixed inset-0 z-30 bg-black/40 md:hidden"
      aria-label="Close sidebar"
      onclick={toggleSidebar}
    ></button>
  {/if}

  <aside
    id="sidebar"
    class="bg-card border-border fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r transition-all duration-200 md:static md:z-auto"
    class:translate-x-0={sidebarIsOpen.current}
    class:-translate-x-full={!sidebarIsOpen.current}
    class:md:w-60={sidebarIsOpen.current}
    class:md:w-12={!sidebarIsOpen.current}
    class:md:translate-x-0={!sidebarIsOpen.current}
    role="navigation"
    aria-label="Main navigation"
  >
    <div class="flex items-center p-4" class:justify-between={sidebarIsOpen.current} class:md:justify-center={!sidebarIsOpen.current}>
      {#if sidebarIsOpen.current}
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="none" class="shrink-0">
            <rect width="32" height="32" rx="8" class="fill-primary" />
            <path d="M8 24V8l8 8 8-8v16" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text-lg font-semibold">Manage</span>
        </div>
      {/if}
      <Button
        variant="ghost"
        size="icon-sm"
        onclick={toggleSidebar}
        aria-controls="sidebar"
        aria-expanded={sidebarIsOpen.current}
        aria-label={sidebarIsOpen.current ? "Close sidebar" : "Open sidebar"}
      >
        <PanelLeft class="size-4" aria-hidden="true" />
      </Button>
    </div>

    {#if sidebarIsOpen.current}
      <div class="flex flex-1 flex-col gap-4 px-4 pb-4 pt-2">
        <div class="flex flex-1 flex-col gap-1">
          <Button href="/dashboard" variant="ghost" class="w-full justify-start gap-3 aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground" aria-current="page">
            <House class="size-5" aria-hidden="true" />
            Dashboard
          </Button>
        </div>
        <div class="border-t pt-4">
          <div class="flex items-start gap-3">
            <Avatar class="size-9 shrink-0">
              {#if user.image}
                <AvatarImage src={user.image} alt={user.name} />
              {/if}
              <AvatarFallback class="text-sm">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium truncate">{user.name}</p>
              <p class="text-muted-foreground truncate text-xs">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" onclick={() => (showSignOutDialog = true)} class="mt-3 w-full justify-start">
            <LogOut class="size-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    {/if}
  </aside>

  <div class="flex min-w-0 flex-1 flex-col">
    <main class="flex-1 px-5 py-4">
      {@render children()}
    </main>
  </div>
</div>

<Dialog bind:open={showSignOutDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sign out</DialogTitle>
      <DialogDescription>Are you sure you want to sign out?</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onclick={() => (showSignOutDialog = false)}>Cancel</Button>
      <Button variant="destructive" onclick={handleSignOut} disabled={isSigningOut}>
        {#if isSigningOut}
          <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
        {/if}
        Sign out
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
