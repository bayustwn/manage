<script lang="ts">
  import { MailCheck, LoaderCircle } from "@lucide/svelte";
  import { authClient } from "$lib/auth-client";
  import Button from "$lib/components/ui/button/button.svelte";
  import { addToast } from "$lib/stores/toast";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card/index.js";

  const { data } = $props();

  const hasEmail = $derived(data.email && data.email !== "your email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email));

  let cooldown = $state(0);
  let isResending = $state(false);
  let intervalId: ReturnType<typeof setInterval> | undefined = $state();

  $effect(() => {
    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  });

  function startCooldown() {
    cooldown = 60;
    intervalId = setInterval(() => {
      cooldown--;
      if (cooldown <= 0) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    }, 1000);
  }

  async function handleResend() {
    if (isResending || cooldown > 0 || !hasEmail) return;

    isResending = true;
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: data.email,
        callbackURL: "/login",
      });

      if (error) {
        addToast(error.message || "Failed to resend verification email", "error");
        return;
      }

      addToast("Verification email sent!", "success");
      startCooldown();
    } catch {
      addToast("Failed to resend verification email", "error");
    } finally {
      isResending = false;
    }
  }
</script>

<Card class="w-full max-w-sm shadow-none ring-0">
  <CardHeader class="place-items-center px-6 pb-4 pt-8 text-center">
    <div class="bg-primary/10 mb-5 flex size-14 items-center justify-center rounded-full">
      <MailCheck class="text-primary size-7" aria-hidden="true" />
    </div>
    <CardTitle>Check your email</CardTitle>
    <CardDescription class="text-balance">
      If this email needs verification, we sent a link to
      <strong class="text-foreground">{data.email}</strong>
    </CardDescription>
  </CardHeader>
  <CardContent class="px-6 pb-8 text-center">
    <p class="text-muted-foreground mb-6 text-balance text-sm leading-relaxed">
      Please click the link in the email to verify your account. If your account is already verified, you can sign in directly.
    </p>

    {#if hasEmail}
      <Button onclick={handleResend} disabled={isResending || cooldown > 0} class="w-full">
        {#if isResending}
          <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
          Sending...
        {:else if cooldown > 0}
          Resend in {cooldown}s
        {:else}
          Resend email
        {/if}
      </Button>
    {/if}

    <Button href="/login" variant="outline" class="mt-3 w-full">
      Go to Sign in
    </Button>

    <p class="text-muted-foreground mt-4 text-xs">
      Did not receive the email? Check your spam folder.
    </p>
  </CardContent>
</Card>
