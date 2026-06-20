<script lang="ts">
  import { page } from "$app/stores";
  import { MailCheck } from "@lucide/svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card/index.js";
</script>

<Card class="w-full max-w-sm">
  <CardHeader class="place-items-center px-6 pb-4 pt-8 text-center">
    <div class="bg-primary/10 mb-5 flex size-14 items-center justify-center rounded-full">
      <MailCheck class="text-primary size-7" aria-hidden="true" />
    </div>
    <CardTitle>Check your email</CardTitle>
    <CardDescription class="text-balance">
      We sent a verification link to
      <strong class="text-foreground">{decodeURIComponent($page.url.searchParams.get("email") ?? "") || "your email"}</strong>
    </CardDescription>
  </CardHeader>
  <CardContent class="px-6 pb-8 text-center">
    <p class="text-muted-foreground mb-6 text-balance text-sm leading-relaxed">
      Please click the link in the email to verify your account. Once verified, you can sign in and start using Manage.
    </p>
    <Button href="/login" class="w-full">
      Go to Sign in
    </Button>
    <p class="text-muted-foreground mt-4 text-xs">
      Did not receive the email? Check your spam folder.
    </p>
  </CardContent>
</Card>