<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";
  import Button from "$lib/components/ui/button/button.svelte";
  import { LoaderCircle } from "@lucide/svelte";

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
      goto("/dashboard");
    }
  });
</script>

{#if isPending}
  <div class="flex min-h-dvh items-center justify-center">
    <LoaderCircle class="text-muted-foreground size-6 animate-spin" aria-hidden="true" />
  </div>
{:else if !session}
  <div class="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
    <h1 class="text-foreground text-2xl font-semibold">Welcome to Manage</h1>
    <p class="text-muted-foreground max-w-sm text-center">
      A simple project management tool to organize your tasks and collaborate with your team.
    </p>
    <div class="flex gap-3">
      <Button href="/login">Sign in</Button>
      <Button href="/register" variant="outline">Create account</Button>
    </div>
  </div>
{/if}
