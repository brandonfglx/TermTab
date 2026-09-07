import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";

export default class Help implements Command {
	public name: string = "help";
	public desc: string = "shows the help menu";

	public help(args: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			"	Usage: help [cmd] [...args]",
			"	Args:",
			"		cmd: command to get help for; shows help menu if none provided",
			"		args: arguments for the command"
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
		if (args.size == 0) {
			terminal.println("Available commands:");
			for (const [name, cmd] of terminal.commands.entries()) {
				terminal.println(` - ${name}: ${cmd.desc}`);
			}

			return;
		} else {
			// TODO: Handle help for commands and commands + args
		}
	}
}