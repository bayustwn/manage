<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import googleLogo from "$lib/assets/google.svg";
  import { registerSchema } from "$lib/schemas/auth";
  import { goto } from "$app/navigation";
  import { untrack } from "svelte";
  import { superForm } from "sveltekit-superforms";
  import { zod4 } from "sveltekit-superforms/adapters";
  import { addToast } from "$lib/stores/toast";

  import Button from "$lib/components/ui/button/button.svelte";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card/index.js";
  import Input from "$lib/components/ui/input/input.svelte";
  import Label from "$lib/components/ui/label/label.svelte";
  import { Eye, EyeOff, LoaderCircle } from "@lucide/svelte";

  const { data } = $props();
  const initialForm = untrack(() => data.form);

  const { form: fields, errors, enhance, submitting } = superForm(initialForm, {
    SPA: true,
    validators: zod4(registerSchema),
    onSubmit: async () => {
      try {
        const { error } = await authClient.signUp.email({
          name: $fields.name,
          email: $fields.email,
          password: $fields.password,
          callbackURL: "/login",
        });

        if (error) {
          addToast(error.message || "Registration failed", "error");
          return;
        }

        goto(`/verify-email?email=${encodeURIComponent($fields.email)}`);
      } catch {
        addToast("An unexpected error occurred. Please try again.", "error");
      }
    },
  });

  let showPassword = $state(false);
  let oauthPending = $state(false);

  import { openOAuthPopup } from "$lib/utils/oauth";

  async function handleGoogleSignIn() {
    if (oauthPending) return;

    oauthPending = true;

    try {
      await openOAuthPopup({
        provider: "google",
        onSuccess: (redirectUrl) => {
          addToast("Welcome back!", "success");
          goto(redirectUrl, { replaceState: true });
        },
        onError: (error) => {
          addToast(error || "Google sign-up failed", "error");
        },
      });
    } catch {
      addToast("Google sign-up failed. Please try again.", "error");
    } finally {
      oauthPending = false;
    }
  }
</script>

<Card class="w-full max-w-sm shadow-none ring-0">
    <CardHeader class="px-6 py-2">
      <CardTitle>Create an account</CardTitle>
      <CardDescription>Enter your details to get started</CardDescription>
    </CardHeader>
    <CardContent class="px-6 pb-6">
      <form method="post" use:enhance class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <Label for="name">Name</Label>
          <Input id="name" name="name" type="text" placeholder="Your name" autocomplete="name" bind:value={$fields.name} aria-invalid={!!$errors.name} aria-describedby={$errors.name ? "register-name-error" : undefined} required />
          {#if $errors.name}
            <p id="register-name-error" class="text-destructive text-xs" role="alert">{$errors.name}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="name@example.com" autocomplete="email" bind:value={$fields.email} aria-invalid={!!$errors.email} aria-describedby={$errors.email ? "register-email-error" : undefined} required />
          {#if $errors.email}
            <p id="register-email-error" class="text-destructive text-xs" role="alert">{$errors.email}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="password">Password</Label>
          <div class="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autocomplete="new-password"
              bind:value={$fields.password}
              aria-invalid={!!$errors.password}
              aria-describedby={$errors.password ? "register-password-error" : undefined}
              required
              minlength={8}
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {#if showPassword}
                <EyeOff class="size-4" aria-hidden="true" />
              {:else}
                <Eye class="size-4" aria-hidden="true" />
              {/if}
            </button>
          </div>
          {#if $errors.password}
            <p id="register-password-error" class="text-destructive text-xs" role="alert">{$errors.password}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            autocomplete="new-password"
            bind:value={$fields.confirmPassword}
            aria-invalid={!!$errors.confirmPassword}
            aria-describedby={$errors.confirmPassword ? "register-confirm-password-error" : undefined}
            required
          />
          {#if $errors.confirmPassword}
            <p id="register-confirm-password-error" class="text-destructive text-xs" role="alert">{$errors.confirmPassword}</p>
          {/if}
        </div>

        <Button type="submit" disabled={$submitting || oauthPending} class="mt-2">
          {#if $submitting}
            <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
          {/if}
          Create account
        </Button>
      </form>

      {#if data.googleEnabled}
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <span class="w-full border-t"></span>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-card text-muted-foreground px-2">or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          class="w-full gap-2"
          disabled={oauthPending || $submitting}
          aria-busy={oauthPending}
          onclick={handleGoogleSignIn}
        >
          {#if oauthPending}
            <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
          {:else}
            <img src={googleLogo} alt="" class="size-5" aria-hidden="true" />
          {/if}
          Google
        </Button>
      {/if}

      <p class="text-muted-foreground mt-4 text-center text-sm">
        Already have an account?
        <a href="/login" class="text-primary hover:underline">Sign in</a>
      </p>
    </CardContent>
  </Card>
