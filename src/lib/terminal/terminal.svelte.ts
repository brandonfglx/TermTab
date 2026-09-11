import { SvelteMap } from "svelte/reactivity";

type TerminalType = "stdout" | "err" | "stdin";

class TerminalStyle {
	public color: string | undefined; // Use tailwind colors directly or use text-[#ffffff] (hex)
	public fontWeight: number | "bold" | undefined; // Use number for weight or "bold"

	public compile(): string {
		let compiled: string[] = [];

		if (this.color) {
			compiled.push(this.color);
		}

		if (this.fontWeight) {
			if (typeof this.fontWeight === "number") {
				compiled.push(`font-[${this.fontWeight}]`);
			} else {
				compiled.push(`font-${this.fontWeight}`);
			}
		}

		return compiled.join(" ");
	}
}

class TerminalText {
	public text: string;
	public style: TerminalStyle;

	constructor(text: string = "", style: TerminalStyle = new TerminalStyle()) {
		this.text = text;
		this.style = style;
	}

	// Formats text to workaround HTML quirks
	public getFormattedText(): string {
		return this.text;
	}

	// Formats style into a tailwind-acceptable format
	public getFormattedStyle(): string {
		return this.style.compile();
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
	public input = $state(''); // The (not submitted) input from the user
	public activeLine = $state(new TerminalLine()); // The line where the cursor is - mainly used for print()

	public inputIndex = $state(0); // Current index on input string that is being modified (= input.length when at end)

	public history = $state<TerminalLine[]>([]); // The history of all TerminalLines / text
	public inputHistory = $state<TerminalLine[]>([]);

	public commands = $state(new SvelteMap<string, Command>()); // The available commands dynamically fetched from $lib/terminal/commands
	private inputFlags = new Map<string, KeyboardEvent>();
	public executing = $state(false); // Flag to halt user input if a program is operating

	private historyCounter: number = 0;

	constructor() {
		this.loadCommands();
	}

	// Dynamically add commands via Vite's import.meta.glob()
	public loadCommands(): void {
		const modules = import.meta.glob<{ default: any }>("./commands/*.ts", { eager: true });

		for (const path in modules) {
			const CommandClass = modules[path].default;

			if (CommandClass) {
				let cmd = new CommandClass() as Command;

				this.commands.set(cmd.name, cmd);
			}
		}
	}

	public print(text: string, style: TerminalStyle = new TerminalStyle()): void {
		this.activeLine.text.push(new TerminalText(text, style));
	}

	public println(text: string = "\0", style: TerminalStyle = new TerminalStyle()): void {
		if (text.length === 0) {
			text = "\0";
		}

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

	public paste(event: ClipboardEvent) {
		this.input += event.clipboardData?.getData("text/plain");
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

	public handleInput(): void {
		if (this.executing) {
			return;
		}

		if (this.inputFlags.has("Enter")) {
			this.historyCounter = 0;
			this.inputIndex = 0;
			this.execute();
		} else if (this.inputFlags.has("Backspace")) {
			if (this.input.length == 0) {
				return;
			}

			if (this.inputFlags.get("Backspace")?.metaKey) {
				this.input = this.input.substring(this.inputIndex);
				this.inputIndex = 0;
			} else if (this.inputFlags.get("Backspace")?.altKey) {
				let index = Math.max(0, this.input.lastIndexOf(" ", this.inputIndex - 1));
				
				this.input = this.input.substring(0, index) + this.input.substring(this.inputIndex);
				this.inputIndex -= this.inputIndex - index;
			} else if (this.inputIndex !== 0) {
				this.input = this.input.substring(0, this.inputIndex - 1) + this.input.substring(this.inputIndex);
				this.inputIndex--;
			}
		} else if (this.inputFlags.has("ArrowUp")) {
			this.inputFlags.get("ArrowUp")?.preventDefault();

			this.historyCounter = Math.max(Math.min(this.historyCounter - 1, 0), -this.inputHistory.length);

			let rebuilt = "";
			this.inputHistory[this.inputHistory.length + this.historyCounter].text.forEach((tt) => {
				rebuilt += tt.text;
			});

			this.input = rebuilt;
			this.inputIndex = Math.max(0, Math.min(this.inputIndex, this.input.length));
		} else if (this.inputFlags.has("ArrowDown")) {
			this.inputFlags.get("ArrowDown")?.preventDefault();

			this.historyCounter = Math.max(Math.min(this.historyCounter + 1, 0), -this.inputHistory.length);

			let rebuilt = "";
			if (this.historyCounter === 0) {
				rebuilt = "";
			} else {
				this.inputHistory[this.inputHistory.length + this.historyCounter].text.forEach((tt) => {
					rebuilt += tt.text;
				});
			}

			this.input = rebuilt;
			this.inputIndex = Math.max(0, Math.min(this.inputIndex, this.input.length));
		} else if (this.inputFlags.has("ArrowLeft")) {
			let event = this.inputFlags.get("ArrowLeft")!;

			if (event.metaKey) {
				event.preventDefault();
				this.inputIndex = 0;
			} else if (event.altKey) {
				this.inputIndex = Math.max(0, this.input.lastIndexOf(" ", this.inputIndex - 1));
			} else {
				this.inputIndex = Math.max(0, Math.min(this.inputIndex - 1, this.input.length));
			}
		} else if (this.inputFlags.has("ArrowRight")) {
			let event = this.inputFlags.get("ArrowRight")!;

			if (event.metaKey) {
				event.preventDefault();
				this.inputIndex = this.input.length;
			} else if (event.altKey) {
				this.inputIndex = this.input.indexOf(" ", this.inputIndex + 1) === -1 ? this.input.length : this.input.indexOf(" ", this.inputIndex + 1);
			} else {
				this.inputIndex = Math.max(0, Math.min(this.inputIndex + 1, this.input.length));
			}
		} else {
			this.inputFlags.forEach((val: KeyboardEvent, key: string) => {
				if (key === "/" || key == "'") {
					val.preventDefault();
				} else if (key === "Tab") {
					val.preventDefault();
					key = "\t";
				}

				if (!val.metaKey && !val.ctrlKey && key !== "Alt" && key !== "Shift" && key !== "Escape" && key !== "CapsLock" && !/F[1-9][0-9]?/g.test(key) && key !== "Dead") {
					this.input = this.input.substring(0, this.inputIndex) + key + this.input.substring(this.inputIndex);
					this.inputIndex++;
				}
			});
		}

		this.inputFlags.clear();
	}

	// TODO: Add weather functionality (no args -> use ip address)
	// TODO: Add calculator (maybe add more advanced features)
	public execute(): void {
		if (this.input.length > 0) {
			this.inputHistory.push(
				new TerminalLine(
					crypto.randomUUID(),
					"stdin",
					[new TerminalText(this.input)]
				)
			);
		}

		this.history.push(
			new TerminalLine(
				crypto.randomUUID(), 
				"stdin", 
				[new TerminalText("guest@TermTab % " + this.input)]
			)
		);

		this.executeCommand(this.input);

		this.input = "";
	}

	public executeCommand(command: string): void {
		let cmdSplit = command.trim().split(" ");

		let cmd = cmdSplit.at(0);

		if (cmd === undefined || cmd.length === 0) {
			return;
		}

		let comm = this.commands.get(cmd);

		if (comm !== undefined) {
			try {
				comm.execute(comm.parseArgs(cmdSplit.slice(1)));
			} catch (e: any) {
				this.printerr(e);
			}
		} else {
			this.printerr(`TermTab: command not found: ${cmd}`);
		}
	}
}

export interface Command {
	name: string,
	desc: string,
	help(args?: string[]): string[],
	parseArgs(args: string[]): Map<string, string>,
	execute(args: Map<string, string>): void
}

export const terminal = new Terminal();