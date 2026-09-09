<style>
	#cursor {
		display: inline-flex;
		width: 10px;
		height: 20px;
		animation: blink 1s infinite;
		vertical-align: text-bottom;
	}

	@keyframes blink {
		0%, 49% {
			opacity: 1;
		}
		50%, 100% {
			opacity: 0;
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
			<span class="break-all whitespace-pre-wrap">guest@TermTab % {terminal.input}</span><span id="cursor" class="bg-term-cursor"></span>
		{/if}
	</div>
</div>