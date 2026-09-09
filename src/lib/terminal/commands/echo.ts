import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";

export default class Echo implements Command {
	public name: string = "echo";
	public desc: string = "prints text to the terminal"

	public help(args?: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			`\tUsage: ${this.name} [text]`,
			"\tArgs:",
			"\t\ttext: text to print to terminal"
		];
	}

	public parseArgs(args: string[]): Map<string, string> {
		let map = new Map<string, string>();

		// TODO: fix parsing
		if (args.length > 0) {
			map.set(args.join(" "), "");
		}

		return map;
	}

	public execute(args: Map<string, string>): void {
		// TODO: process the string - i.e. remove quotes as neccessary, allow for escape sequences
		for (const [str1, str2] of args.entries()) {
			terminal.print(str1 + " " + str2);
		}
		terminal.println();
	}
}