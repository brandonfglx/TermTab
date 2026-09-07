import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";

export default class Info implements Command {
	public name: string = "info";
	public desc: string = "returns info about the current session";

	public help(args: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			"	Usage: info"
		];
	}

	public parseArgs(args: string[]): Map<string, string> {
		let map = new Map<string, string>();

		return map;
	}

	public execute(args: Map<string, string>): void {
		terminal.println(new Date().toString());
		terminal.println(`User Agent: ${navigator.userAgent}`);
		terminal.println(`Window: ${window.innerWidth}px x ${window.innerHeight}px`);
	}
}