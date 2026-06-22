<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		"data-slot": dataSlot = "input",
		...restProps
	}: Props = $props();
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"bg-neutral-100 dark:bg-neutral-800 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-10 rounded-2xl border border-neutral-300 px-3 py-2 text-base transition-colors duration-200 file:h-6 file:text-sm file:font-medium md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent hover:border-neutral-400 focus-visible:border-neutral-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:focus-visible:border-neutral-500",
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"bg-neutral-100 dark:bg-neutral-800 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-10 rounded-2xl border border-neutral-300 px-3 py-2 text-base transition-colors duration-200 file:h-6 file:text-sm file:font-medium md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent hover:border-neutral-400 focus-visible:border-neutral-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:focus-visible:border-neutral-500",
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
