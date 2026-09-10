import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";

export interface LocationInfo {
	cityName: string,
	regionCode: string,
	regionName: string,
	countryCode: string,
	countryName: string,
	zipCode: string,
	latitude: number,
	longitude: number,
	ipAddress: string | undefined,
	asnOrganization: string | undefined
}

export default class Location implements Command {
	public name: string = "loc";
	public desc: string = "prints info about the user's location or about the zip code"

	public static ipApi: string = "https://free.freeipapi.com/api/json";
	public static zipApi: string = "https://api.zippopotam.us/us";

	public help(args?: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			`\tUsage: ${this.name} [zipCode?]`,
			"\tArgs:",
			"\t\tzipCode: US zip code to get info about"
		];
	}

	public static async fetchLoc(zipCode?: string): Promise<LocationInfo> {
		let loc: LocationInfo;

		if (zipCode) {
			let response = await fetch(this.zipApi + `/${zipCode}`);

			if (!response || !response.ok) {
				throw new Error(`location: invalid zipcode: ${zipCode}`);
			}

			let json = await response.json();

			loc = {
				cityName: json.places[0]["place name"],
				regionCode: json.places[0]["state abbreviation"],
				regionName: json.places[0].state,
				countryCode: json["country abbreviation"],
				countryName: json.country,
				zipCode: json["post code"],
				latitude: Number(json.places[0].latitude),
				longitude: Number(json.places[0].longitude),
				ipAddress: undefined,
				asnOrganization: undefined
			};
		} else {
			let response = await fetch(this.ipApi);

			if (!response || !response.ok) {
				throw new Error("location: fetching ip api failed (likely rate limited)");
			}

			loc = await response.json();
		}

		return loc;
	}

	public parseArgs(args: string[]): Map<string, string> {
		let map = new Map<string, string>();

		for (let arg of args) {
			// Only add "valid" zip codes
			if (/[0-9]{5}/.test(arg)) {
				map.set("zipCode", arg);
			}
		}

		return map;
	}

	public async execute(args: Map<string, string>): Promise<void> {
		terminal.executing = true;

		try {
			let zipCode = args.get("zipCode");
			let loc = await Location.fetchLoc(zipCode);

			let info = [
				`City: ${loc.cityName}`,
				`Region: ${loc.regionName} (${loc.regionCode})`,
				`Country: ${loc.countryName} (${loc.countryCode})`,
				`Zip Code: ${loc.zipCode}`,
				`Latitude: ${loc.latitude}`,
				`Longitude: ${loc.longitude}`
			];

			if (!zipCode) {
				info.push(
					"",
					`IP Address: ${loc.ipAddress}`,
					`ASN Organization: ${loc.asnOrganization}`
				);
			}

			info.forEach((str) => {
				terminal.println(str);
			});
		} catch (e: any) {
			terminal.printerr(e);
		}

		terminal.executing = false;
	}
}