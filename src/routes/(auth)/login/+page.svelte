<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { loginSchema } from "$lib/schemas/auth";
  import { goto } from "$app/navigation";
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

  let { data } = $props();

  const { form: fields, errors, enhance, message, submitting } = superForm(data.form, {
    SPA: true,
    validators: zod4(loginSchema),
    onSubmit: async () => {
      try {
        const { error } = await authClient.signIn.email({
          email: $fields.email,
          password: $fields.password,
        });

        if (error) {
          const msg = error.message || "Invalid email or password";
          message.set(msg);
          addToast(msg, "error");
          return;
        }

        addToast("Welcome back!", "success");
        goto("/dashboard");
      } catch (err) {
        const msg = "An unexpected error occurred. Please try again.";
        message.set(msg);
        addToast(msg, "error");
        console.error("Login error:", err);
      }
    },
  });

  let showPassword = $state(false);
</script>

<Card class="w-full max-w-sm">
    <CardHeader class="px-6 py-2">
      <CardTitle>Sign in</CardTitle>
      <CardDescription>Enter your credentials to access your account</CardDescription>
    </CardHeader>
    <CardContent class="px-6 pb-6">
      <form use:enhance class="flex flex-col gap-4">
        {#if $message}
          <div class="bg-destructive/10 text-destructive rounded-xl px-3 py-2 text-sm">
            {$message}
          </div>
        {/if}

        <div class="flex flex-col gap-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            autocomplete="email"
            bind:value={$fields.email}
            required
          />
          {#if $errors.email}
            <p class="text-destructive text-xs">{$errors.email}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-2">
          <Label for="password">Password</Label>
          <div class="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autocomplete="current-password"
              bind:value={$fields.password}
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
            <p class="text-destructive text-xs">{$errors.password}</p>
          {/if}
        </div>

        <Button type="submit" disabled={$submitting} class="mt-2">
          {#if $submitting}
            <LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
          {/if}
          Sign in
        </Button>
      </form>

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
        onclick={async () => {
          const { data, error } = await authClient.signIn.social({
            provider: "google",
            callbackURL: "/dashboard",
          });
          if (data?.url) window.location.href = data.url;
          if (error) {
            addToast(error.message || "Google sign-in failed", "error");
          }
        }}
      >
        <svg class="size-5" aria-hidden="true" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </Button>

      <p class="text-muted-foreground mt-4 text-center text-sm">
        Don't have an account?
        <a href="/register" class="text-primary hover:underline">Sign up</a>
      </p>
    </CardContent>
  </Card>