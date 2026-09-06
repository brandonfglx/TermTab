<script module lang="ts">
	type TerminalType = "stdout" | "err" | "stdin";

	export interface TerminalLine {
		id: string,
		type: TerminalType
		text: string
	}

	class Terminal {
		public history = $state<TerminalLine[]>([]);
		public input = $state('');
		private inputFlags = new Map<string, KeyboardEvent>();
		public activeLine: TerminalLine = this.getDefaultActiveLine();

		public print(text: string): void {
			this.activeLine.text += text;
		}

		public println(text: string = ""): void {
			this.activeLine.text += text;
			this.flush();
		}

		public printerr(text: string): void {
			this.activeLine.text += text;
			this.activeLine.type = "err";
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

		// Adds the keyboard event as an active flag
		public addInput(event: KeyboardEvent): void {
			this.inputFlags.set(event.key, event);
		}

		// Removes the keyboard event as an active flag
		public removeInput(event: KeyboardEvent): void {
			this.inputFlags.delete(event.key);

			// Clear list since chording w/ Meta doesn't report keyup
			if (event.key === "Meta") {
				this.inputFlags.clear();
			}
		}

		// TODO: Add a flag system to have all currently held down keys available (allows for alt+backspace for word delete, meta+backspace for line delete)
		public handleInput(): void {
			if (this.inputFlags.has("Enter")) {
				this.parse();
			} else if (this.inputFlags.has("Backspace")) {
				if (this.input.length == 0) {
					return;
				}

				if (this.inputFlags.get("Backspace")?.metaKey) {
					this.input = "";
				} else if (this.inputFlags.get("Backspace")?.altKey) {
					this.input = this.input.substring(0, this.input.lastIndexOf(" "));
				} else {
					this.input = this.input.substring(0, this.input.length - 1);
				}
			} else {
				this.inputFlags.forEach((val: KeyboardEvent, key: string) => {
					if (key !== "Meta" && key !== "Alt" && key !== "Shift") {
						this.input += key;
					}

					if (key === "/") {
						val.preventDefault();
					}
				});
			}

			this.inputFlags.clear();
		}

		public parse(): void {
			this.history.push({
				id: crypto.randomUUID(),
				type: "stdin",
				text: "guest@TermTab % " + this.input
			});

			let input = this.input.split(" ");
			this.input = "";

			switch (input.at(0)) {
				case "help":
					this.println("");
					break;
				case "clear":
					this.clear();
					break;
				case "echo":
					this.println(input.slice(1).join(" "));
					break;
				case "goto":
					if (input.length >= 2) {
						if (!/^https?:\/\//i.test(input[1])) {
							input[1] = "https://" + input[1];
						}

						window.open(`${input.at(1)}`, "_blank", "popup=false,noopener,noreferrer");
					} else {
						this.printerr("goto: no url provided");
					}
					break;
				case "search":
					window.open(`https://www.google.com/search?q=${encodeURIComponent(input.slice(1).join(" "))}`, "_blank", "popup=false,noopener,noreferrer");
					break;
				case "ask":
					window.open(`https://www.google.com/search?q=${encodeURIComponent(input.slice(1).join(" "))}&udm=50`, "_blank", "popup=false,noopener,noreferrer");
					break;
				default:
					this.printerr(`TermTab: command not found: ${input.at(0)}`);
					break;
			}
		}
	}

	export const terminal = new Terminal();
</script>

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
			terminal.addInput(event);
			terminal.handleInput();
		});

		document.addEventListener("keyup", (event: KeyboardEvent) => {
			terminal.removeInput(event);
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
		<span class="break-all">guest@TermTab % {terminal.input}</span><span id="cursor" class="bg-term-cursor"></span>
	</div>
</div>