import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";

export default class GoTo implements Command {
	public name: string = "goto";
	public desc: string = "goes to a url";

	public help(args: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			"	Usage: goto [url]",
			"	Args:",
			"		url: url to go to"
		];
	}

	public parseArgs(args: string[]): Map<string, string> {
		let map = new Map<string, string>();

		// TODO: do more parsing to check if it's an actual url
		map.set("url", args[0]);

		return map;
	}

	public execute(args: Map<string, string>): void {
		let url = args.get("url");

		if (url) {
			if (!/^https?:\/\//i.test(url)) {
				url = "https://" + url;
			}

			window.open(`${url}`, "_blank", "popup=false,noopener,noreferrer");
		} else {
			terminal.printerr("goto: no url provided");
		}
	}
}