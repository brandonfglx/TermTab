import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";

export default class Info implements Command {
	public name: string = "info";
	public desc: string = "returns info about the current session";

	public help(args?: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			"	Usage: info"
		];
	}

	public parseArgs(args: string[]): Map<string, string> {
		let map = new Map<string, string>();

		return map;
	}

	public async execute(args: Map<string, string>): Promise<void> {
		(await this.getInfo()).forEach((str) => {
			terminal.println(str);
		});
	}

	private async getInfo(): Promise<string[]> {
		// GPU info
		let canvas = document.createElement("canvas");
		let gl = canvas.getContext("webgl");
		let gpu = gl?.getParameter(gl.RENDERER);
		canvas.remove();

		return [
			`User Agent: ${navigator.userAgent}`,
			`Window: ${window.innerWidth}px x ${window.innerHeight}px`,
			`CPU Cores: ${navigator.hardwareConcurrency}`,
			`GPU: ${gpu}`
		];
	}
}