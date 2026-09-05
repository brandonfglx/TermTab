<script module lang="ts">
	type TerminalType = 'stdout' | 'err' | 'stdin';

	export interface TerminalLine {
		id: string,
		type: TerminalType
		text: string
	}

	class Terminal {
		public history = $state<TerminalLine[]>([]);
		public input = $state('');
		public activeLine: TerminalLine = this.getDefaultActiveLine();

		public print(text: string): void {
			this.activeLine.text += text;
		}

		public println(text: string = ''): void {
			this.activeLine.text += text;
			this.flush();
		}

		public printerr(text: string): void {
			this.activeLine.text += text;
			this.activeLine.type = 'err';
			this.flush();
		}

		private flush(): void {
			this.activeLine.id = crypto.randomUUID();

			this.history.push(this.activeLine);

			this.activeLine = this.getDefaultActiveLine();
		}

		public clear(): void {
			this.history = [];
			this.activeLine = this.getDefaultActiveLine();
		}

		private getDefaultActiveLine(): TerminalLine {
			return {
				id: "",
				type: "stdout",
				text: ""
			};
		}

		public handleInput(event: KeyboardEvent): void {
			if (event.key === "Enter") {
				this.pushInput();
				this.parse();
			} else if (event.key === "Backspace" && this.input.length > 0) {
				this.input = this.input.slice(0, this.input.length - 1);
			} else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
				this.input += event.key;
			}
		}

		public pushInput(): void {
			this.history.push({
				id: crypto.randomUUID(),
				type: 'stdin',
				text: 'guest@TermTab % ' + this.input
			});

			this.input = '';
		}

		public parse(): void {
			this.printerr("Invalid Input")
		}
	}

	export const terminal = new Terminal();
</script>

<style>
	#cursor {
		display: inline-flex;
		width: 10px;
		height: 20px;
		background-color: rgb(0, 226, 0);
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

	let terminalDiv: HTMLDivElement;

	$effect(() => {
		// Automatically move viewport to line when history or input is updated
		terminal.history.length;
		terminal.input.length;

		window.scrollTo({
			top: terminalDiv.scrollHeight,
			behavior: "auto"
		});
	})

	onMount(() => {
		document.addEventListener("keydown", (event: KeyboardEvent) => {
			terminal.handleInput(event);
		});
	});


</script>

<div id="terminal" class="p-2" bind:this={terminalDiv}>
	<div id="history" class="font-mono text-base">
		<!-- TODO: Add special formatting for various text inputs -->
		{#each terminal.history as item}
			{#if item.type === 'err'}
				<p class="break-all text-red-500">{item.text}</p>
			{:else}
				<p class="break-all">{item.text}</p>
			{/if}
		{/each}
		<p>{terminal.activeLine.text}</p>
	</div>
	<div id="active" class="font-mono text-base">
		<span class="break-all">guest@TermTab % {terminal.input}</span><span id="cursor"></span>
	</div>
</div>