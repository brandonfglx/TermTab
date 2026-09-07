import type { Command } from "../terminal.svelte";

export default class Search implements Command {
	public name: string = "search";
	public desc: string = "search using Google";

	public help(args: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			"	Usage: search [query]",
			"	Args:",
			"		query: search query"
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
			window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank", "popup=false,noopener,noreferrer");
		} else {
			window.open(`https://www.google.com/`, "_blank", "popup=false,noopener,noreferrer");
		}
	}
}