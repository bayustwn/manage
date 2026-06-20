<script lang="ts">
  import { fly } from "svelte/transition";
  import {
    toasts,
    removeToast,
    pauseToast,
    resumeToast,
    type Toast,
    type ToastVariant,
  } from "$lib/stores/toast";
  import {
    CircleCheck,
    CircleX,
    AlertTriangle,
    Info,
    X,
  } from "@lucide/svelte";

  let items: Toast[] = $state(toasts.get());

  $effect(() => {
    return toasts.subscribe((v) => {
      items = v;
    });
  });

  const iconMap: Record<ToastVariant, typeof Info> = {
    default: Info,
    success: CircleCheck,
    error: CircleX,
    warning: AlertTriangle,
    info: Info,
  };

  const variantStyles: Record<ToastVariant, string> = {
    default: "bg-foreground text-background",
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
    warning: "bg-amber-600 text-white",
    info: "bg-sky-600 text-white",
  };
</script>

{#if items.length > 0}
  <div
    class="fixed right-4 top-4 z-50 flex flex-col gap-2"
    role="status"
    aria-live="polite"
    aria-relevant="additions removals"
  >
    {#each items as item (item.id)}
      {@const Icon = iconMap[item.variant]}
      {@const isAlert = item.variant === "error" || item.variant === "warning"}
      <div
        transition:fly={{ x: 20, duration: 200, opacity: 0 }}
        role={isAlert ? "alert" : "status"}
        aria-live={isAlert ? "assertive" : "polite"}
        aria-atomic="true"
        class="{variantStyles[item.variant]} flex items-center gap-2 rounded-xl px-4 py-2 text-sm shadow-lg"
        onmouseenter={() => pauseToast(item.id)}
        onmouseleave={() => resumeToast(item.id)}
      >
        <Icon class="size-4 shrink-0" aria-hidden="true" />
        <span>{item.message}</span>
        <button
          type="button"
          onclick={() => removeToast(item.id)}
          class="ml-auto cursor-pointer opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X class="size-3" aria-hidden="true" />
        </button>
      </div>
    {/each}
  </div>
{/if}
