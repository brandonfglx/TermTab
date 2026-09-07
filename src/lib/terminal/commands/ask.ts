import type { Command } from "../terminal.svelte";

export default class Ask implements Command {
	public name: string = "ask";
	public desc: string = "ask Google Web AI (Gemini)";

	public help(args: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			"	Usage: ask [query]",
			"	Args:",
			"		query: query to ask"
		];
	}

	public parseArgs(args: string[]): Map<string, string> {
		let map = new Map<string, string>();

		// TODO: fix parsing
		if (args.length > 0) {
			map.set("query", args.join(" "));
		}

		return map;
	}

	public execute(args: Map<string, string>): void {
		let query = args.get("query");

		if (query) {
			window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}&udm=50`, "_blank", "popup=false,noopener,noreferrer");
		} else {
			window.open(`https://www.google.com/search?udm=50`, "_blank", "popup=false,noopener,noreferrer");
		}
	}
}