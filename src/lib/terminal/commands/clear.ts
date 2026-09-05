import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";

export default class Clear implements Command {
	public name: string = "clear";
	public desc: string = "clears the terminal";

	public help(args?: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			`\tUsage: ${this.name}`
		];
	}

	public parseArgs(args: string[]): Map<string, string> {
		let map = new Map<string, string>();

		return map;
	}

	public execute(args: Map<string, string>): void {
		terminal.clear();
	}
}