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

      <p class="text-muted-foreground mt-4 text-center text-sm">
        Don't have an account?
        <a href="/register" class="text-primary hover:underline">Sign up</a>
      </p>
    </CardContent>
  </Card>