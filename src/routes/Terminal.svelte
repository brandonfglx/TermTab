<script module lang="ts">
	type TerminalType = "stdout" | "err" | "stdin";

	class TerminalStyle {
		public color: string | undefined;
		public fontWeight: number | "bold" | undefined;
	}

	class TerminalText {
		public text: string;
		public style: TerminalStyle;

		constructor(text: string = "", style: TerminalStyle = new TerminalStyle()) {
			this.text = text;
			this.style = style;
		}

		// Formats style into a tailwind-acceptable format
		public formatStyle() {
			
		}
	}

	class TerminalLine {
		public id: string;
		public type: TerminalType;
		public text: TerminalText[];

		constructor(id: string = "", type: TerminalType = "stdout", text: TerminalText[] = []) {
			this.id = id;
			this.type = type;
			this.text = text;
		}
	}

	class Terminal {
		public history = $state<TerminalLine[]>([]);
		public input = $state('');
		private inputFlags = new Map<string, KeyboardEvent>();
		public activeLine = $state(new TerminalLine());

		public print(text: string, style: TerminalStyle = new TerminalStyle()): void {
			this.activeLine.text.push(new TerminalText(text, style));
		}

		public println(text: string = "", style: TerminalStyle = new TerminalStyle()): void {
			this.activeLine.text.push(new TerminalText(text, style));
			this.flush();
		}

		public printerr(text: string, style: TerminalStyle = new TerminalStyle()): void {
			this.activeLine.text.push(new TerminalText(text, style));
			this.activeLine.type = "err";
			this.flush();
		}

		// "Flushes" the active line to the history and resets the active line
		private flush(): void {
			this.activeLine.id = crypto.randomUUID();
			this.history.push(this.activeLine);
			this.activeLine = new TerminalLine();
		}

		// Clears the history and active line
		public clear(): void {
			this.history = [];
			this.activeLine = new TerminalLine();
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

		// TODO: Handle copy paste and cut
		// TODO: Handle up/down arrows to return previous commands (use history & have a counter that resets everytime a user presses enter key)
		// TODO: Add calculator (maybe add more advanced features)
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
					if (key !== "Meta" && key !== "Alt" && key !== "Shift" && !/F[1-9][0-9]?/g.test(key)) {
						this.input += key;
					}

					if (key === "/") {
						val.preventDefault();
					}
				});
			}

			this.inputFlags.clear();
		}

		// TODO: Add weather functionality (no args -> use ip address)
		// TODO: Add about program (simple explainer)
		// TODO: Add a fastfetch-like program (shows information about TermTab window and other information (possibly?))
		public parse(): void {
			this.history.push(
				new TerminalLine(
					crypto.randomUUID(), 
					"stdin", 
					[new TerminalText("guest@TermTab % " + this.input)]
				)
			);

			let input = this.input.split(" ");
			this.input = "";

			switch (input.at(0)) {
				case "help":
					this.println("help not found");
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
				case "info":
					this.println(new Date().toString());
					this.println(`User Agent: ${navigator.userAgent}`);
					this.println(`Window: ${window.innerWidth}px x ${window.innerHeight}px`);
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
	});

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
		{#each terminal.history as line}
			{#if line.type === 'err'}
				<p class="break-all text-red-500">
					{#each line.text as termText}
						<span>{termText.text}</span>
					{/each}
				</p>
			{:else}
				<p class="break-all">
					{#each line.text as termText}
						<span>{termText.text}</span>
					{/each}
				</p>
			{/if}
		{/each}
		<p class="">
			{#each terminal.activeLine.text as termText}
				<span>{termText.text}</span>
			{/each}
		</p>
	</div>
	<div id="active" class="font-mono text-base">
		<span class="break-all">guest@TermTab % {terminal.input}</span><span id="cursor" class="bg-term-cursor"></span>
	</div>
</div>