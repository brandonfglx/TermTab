import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";

export default class About implements Command {
	public name: string = "about";
	public desc: string = "informaion about TermTab";

	private version = "1.0.0";

	private about: string[] = [
		`TermTab v${this.version} ©${new Date().getFullYear()} brandonfglx`,
		"	GUIs are boring; try a terminal window instead!",
		"",
		"	A terminal like interface on the web. Go to any domain, search with your favorite search engine,",
		"	and check the weather all on one page. This static webpage gives you all the power to customize",
		"	your experience; scour through the source code on GitHub: https://www.github.com/brandonfglx/TermTab",
		"",
		"	Need help on a command or not sure where to start? -> use the \"help\" command!"
	];

	public help(args?: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			`\tUsage: ${this.name} [-v | --version]`,
			"\tArgs:",
			"\t\t-v | --version: shows TermTab version"
		];
	}

	public parseArgs(args: string[]): Map<string, string> {
		let map = new Map<string, string>();

		if (args.indexOf("-v") !== -1 || args.indexOf("--version") !== -1) {
			map.set("version", "true");
		}

		return map;
	}

	public execute(args: Map<string, string>): void {
		if (args.size === 0) {
			this.about.forEach((str) => {
				terminal.println(str);
			});
		} else {
			if (args.has("version")) {
				terminal.println(this.about[0]);
			} else {
				terminal.printerr("about: unknown arguments");
			}
		}
	}
}