<style>
	#cursor {
		display: inline-flex;
		width: 10px;
		height: 20px;
		animation: blink 1s infinite steps(1);
	}

	@keyframes blink {
		0%, 49% {
			background-color: var(--color-white);
			color: var(--color-black);
		}
		50%, 100% {
			background-color: var(--color-term-cursor);
			color: transparent;
		}
	}

	@media (prefers-color-scheme: dark) {
		@keyframes blink {
			0%, 49% {
				background-color: var(--color-term-bg);
				color: var(--color-term-fg);
			}
			50%, 100% {
				background-color: var(--color-term-cursor);
				color: transparent;
			}
		}
	}
</style>

<script lang="ts">
	import { onMount } from "svelte";
	import { terminal } from "$lib/terminal/terminal.svelte";

	let terminalDiv: HTMLDivElement;

	$effect(() => {
		// Automatically move viewport to line when history or input is updated
		terminal.history.length;
		terminal.input.length;

		window.scrollTo({
			top: terminalDiv.scrollHeight,
			behavior: "auto"
		});
	});

	onMount(() => {
		document.addEventListener("keydown", (event: KeyboardEvent) => {
			terminal.addInput(event);
			terminal.handleInput();
		});

		document.addEventListener("keyup", (event: KeyboardEvent) => {
			terminal.removeInput(event);
		});

		document.addEventListener("paste", (event: ClipboardEvent) => {
			terminal.paste(event);
		});
	});
</script>

<div id="terminal" class="p-2" bind:this={terminalDiv}>
	<div id="history" class="font-mono text-base">
		<!-- TODO: Render with getFormattedStyle() as tailwind classes -->
		{#each terminal.history as line}
			{#if line.type === 'err'}
				<p class="break-all whitespace-pre-wrap text-red-500">
					{#each line.text as termText}
						<span>{termText.getFormattedText()}</span>
					{/each}
				</p>
			{:else}
				<p class="break-all whitespace-pre-wrap">
					{#each line.text as termText}
						<span>{termText.getFormattedText()}</span>
					{/each}
				</p>
			{/if}
		{/each}
		<p class="">
			{#each terminal.activeLine.text as termText}
				<span>{termText.getFormattedText()}</span>
			{/each}
		</p>
	</div>
	<div id="active" class="font-mono text-base">
		{#if !terminal.executing}
			<span class="break-all whitespace-pre-wrap">guest@TermTab % {terminal.input.substring(0, terminal.inputIndex)}</span>{#if terminal.input.charAt(terminal.inputIndex).trim().length === 0}<span id="cursor" class="break-all whitespace-pre-wrap align-text-bottom">{terminal.input.charAt(terminal.inputIndex)}</span>{:else}<span id="cursor" class="break-all whitespace-pre-wrap">{terminal.input.charAt(terminal.inputIndex)}</span>{/if}<span class="break-all whitespace-pre-wrap">{terminal.input.substring(terminal.inputIndex + 1)}</span>
		{/if}
	</div>
</div>