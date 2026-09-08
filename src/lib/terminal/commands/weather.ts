import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";

export default class Weather implements Command {
	public name: string = "weather";
	public desc: string = "shows the weather";

	public help(args?: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			"	Usage: weather [zipcode]",
			"	Args:",
			"		zipcode: US zipcode to get weather for"
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

	// TODO: Handle help for commands and commands + args
	public execute(args: Map<string, string>): void {
		
	}
}