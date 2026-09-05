import { terminal, type Command } from "../terminal.svelte";

export default class Search implements Command {
	public name: string = "search";
	public desc: string = "search the World Wide Web";

	public defaultFlag: string = "-g";

	private argMapping: Map<String, String> = new Map([
		["-g", "https://www.google.com/search?q=%s"],
		["--google", "https://www.google.com/search?q=%s"],
		["-ddg", "https://duckduckgo.com/?q=%s"],
		["--duck-duck-go", "https://duckduckgo.com/?q=%s"],
		["-yt", "https://www.youtube.com/results?search_query=%s"],
		["--youtube", "https://www.youtube.com/results?search_query=%s"],
		["-w", "https://en.wikipedia.org/wiki?search=%s"],
		["--wikipedia", "https://en.wikipedia.org/wiki?search=%s"],
		["-gai", "https://www.google.com/search?q=%s&udm=50"],
		["--google-ai", "https://www.google.com/search?q=%s&udm=50"]
	]);

	public help(args?: string[]): string[] {
		let help = [
			`${this.name}: ${this.desc}`,
			`\tUsage: ${this.name} [tag] [query]`,
			"\tArgs:",
			"\t\ttag: tag of site to search",
			"\t\tquery: text to search"
		];

		this.argMapping.forEach((val, key) => {
			help.push(`\t\t\t${key}: ${val}`);
		});

		return help;
	}

	public parseArgs(args: string[]): Map<string, string> {
		let map = new Map<string, string>();

		if (args.length == 0) {
			map.set(this.defaultFlag, "");
			return map;
		}

		let currFlag = "";
		let currVal = "";

		if (!args[0].startsWith("-")) {
			currFlag = this.defaultFlag;
		}

		for (let arg of args) {
			if (arg.startsWith("-")) {
				if (currVal.length !== 0) {
					map.set(currFlag, currVal);
				}

				currFlag = arg;
				currVal = "";
			} else {
				if (currVal.length === 0) {
					currVal = arg;
				} else {
					currVal += ` ${arg}`;
				}
			}
		}

		if (currFlag.length !== 0 && currVal.length !== 0) {
			map.set(currFlag, currVal);
		}

		return map;
	}

	public execute(args: Map<string, string>): void {
		args.forEach((val, key) => {
			let url = this.argMapping.get(key);

			if (url) {
				window.open(url.replace("%s", encodeURIComponent(val)), "_blank");
			} else {
				terminal.printerr(`search: invalid search engine: ${key}`);
			}
		});
	}
}