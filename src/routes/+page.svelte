<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import { addToast } from "$lib/stores/toast";
  import Button from "$lib/components/ui/button/button.svelte";
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "$lib/components/ui/avatar/index.js";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "$lib/components/ui/dropdown-menu/index.js";
  import {
    LayoutDashboard,
    LoaderCircle,
    LogOut,
  } from "@lucide/svelte";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "$lib/components/ui/dialog/index.js";

  let { data } = $props();

  const serverUser = $derived(data?.user ?? null);
  let liveUser = $state<App.SessionUser | null>(null);
  let liveReady = $state(false);

  const session = $derived(liveReady ? liveUser : serverUser);

  let isSigningOut = $state(false);
  let showSignOutDialog = $state(false);

  $effect(() => {
    return authClient.useSession().subscribe((value) => {
      if (!value.isPending) {
        liveReady = true;
        liveUser = value.data?.user ?? null;
      }
    });
  });

  async function handleSignOut() {
    if (isSigningOut) return;
    isSigningOut = true;
    try {
      const { error } = await authClient.signOut();
      if (error) throw new Error(error.message || "Sign out failed");
      showSignOutDialog = false;
    } catch {
      addToast("Sign out failed. Please try again.", "error");
    } finally {
      isSigningOut = false;
    }
  }
</script>

<div class="flex min-h-screen flex-col">
  <nav class="bg-background/80 sticky top-0 z-50 backdrop-blur-sm">
  <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
    <div class="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="none" class="shrink-0">
        <rect width="32" height="32" rx="8" class="fill-primary" />
        <path d="M8 24V8l8 8 8-8v16" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="text-lg font-semibold">Manage</span>
    </div>

    <div class="flex items-center gap-3">
      {#if session}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar class="size-8 cursor-pointer">
              {#if session.image}
                <AvatarImage src={session.image} alt={session.name} />
              {/if}
              <AvatarFallback>{session.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-48" align="end">
            <DropdownMenuLabel>{session.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onclick={() => goto("/dashboard")}>
              <LayoutDashboard class="size-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onclick={() => (showSignOutDialog = true)}>
              <LogOut class="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      {:else}
        <a href="/login"><Button variant="ghost" size="sm">Sign in</Button></a>
        <a href="/register"><Button size="sm">Get started</Button></a>
      {/if}
    </div>
  </div>
</nav>

  <section class="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-12 text-center sm:py-16">
  <h1 class="text-foreground mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
    Organize your projects<br />
    <span class="text-primary">with ease</span>
  </h1>
  <p class="text-muted-foreground mx-auto mb-8 max-w-xl text-lg">
    Plan, track, and manage your team's work from anywhere.
    Simple project management for teams of all sizes.
  </p>

  {#if session}
    <div class="flex items-center justify-center gap-3">
      <a href="/dashboard"><Button>Go to Dashboard</Button></a>
    </div>
  {:else}
    <div class="flex items-center justify-center gap-3">
      <a href="/register"><Button>Get started free</Button></a>
      <a href="/login"><Button variant="outline">Sign in</Button></a>
    </div>
  {/if}
</section>

<footer class="border-border border-t py-8 text-center">
  <p class="text-muted-foreground text-xs">&copy; 2026 Manage. All rights reserved.</p>
</footer>
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
