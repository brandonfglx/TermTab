import { SvelteMap } from "svelte/reactivity";

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

	// Formats text to workaround HTML quirks
	public getFormattedText(): string {
		return this.text;
	}

	// Formats style into a tailwind-acceptable format
	public getFormattedStyle() {

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
	public commands = $state(new SvelteMap<string, Command>()); // The available commands dynamically fetched from $lib/terminal/commands
	public history = $state<TerminalLine[]>([]); // The history of TerminalLines / text
	public input = $state(''); // The (not submitted) input from the user
	public activeLine = $state(new TerminalLine()); // The line where the cursor is - mainly used for print()
	private inputFlags = new Map<string, KeyboardEvent>();

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
			this.execute();
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
				if (key === "/") {
					val.preventDefault();
				} else if (key === "Tab") {
					val.preventDefault();
					key = "    ";
				}

				if (key !== "Meta" && key !== "Alt" && key !== "Shift" && !/F[1-9][0-9]?/g.test(key)) {
					this.input += key;
				}
			});
		}

		this.inputFlags.clear();
	}

	// TODO: Add weather functionality (no args -> use ip address)
	// TODO: Add about program (simple explainer)
	// TODO: Add a fastfetch-like program (shows information about TermTab window and other information (possibly?))
	public execute(): void {
		this.history.push(
			new TerminalLine(
				crypto.randomUUID(), 
				"stdin", 
				[new TerminalText("guest@TermTab % " + this.input)]
			)
		);

		let input = this.input.trim().split(" ");
		this.input = "";

		let rawCommand = input.at(0);

		// Check for invalid inputs
		if (rawCommand === undefined || rawCommand.length == 0) {
			return;
		}

		let command = this.commands.get(rawCommand);

		// Check if the command requested exists, if so, execute it
		if (command !== undefined) {
			command.execute(command.parseArgs(input.slice(1)));
		} else {
			this.printerr(`TermTab: command not found: ${input.at(0)}`);
		}
	}
}

export interface Command {
	name: string,
	desc: string,
	help(args: string[]): string[],
	parseArgs(args: string[]): Map<string, string>,
	execute(args: Map<string, string>): void
}

export const terminal = new Terminal();