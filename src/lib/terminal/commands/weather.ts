import type { Command } from "../terminal.svelte";
import { terminal } from "../terminal.svelte";
import type { LocationInfo } from "./location";
import Location from "./location";
import { fetchWeatherApi } from "openmeteo";

interface WeatherParams {
	latitude: number,
	longitude: number,
	timeZone: string,
	daily: string[],
	current: string[],
	temperature_unit: "celcius" | "fahrenheit",
	wind_speed_unit: "kmh" | "ms" | "mph" | "knots",
	precipitation_unit: "mm" | "inch"
}

export default class Weather implements Command {
	public name: string = "weather";
	public desc: string = "shows the weather";

	private weatherApi: string = "https://api.open-meteo.com/v1/forecast";

	// Based off of chart on open-mateo sdk ts/units.ts file
	private UNIT_TO_STRING: string[] = [
		"",
		"°C",
		"cm",
		"m³/m³",
		"m³/s",
		"°",
		"",
		"",
		"EAQI",
		"°F",
		"ft",
		"fraction",
		"GDD °C",
		"gpm",
		"grains/m³",
		"g/kg",
		"hPa",
		"h",
		"in",
		"ISO8601",
		"J/kg",
		"K",
		"kPa",
		"kg/m²",
		"km/h",
		"kn",
		"MJ/m²",
		"m/s",
		"m/s",
		"m",
		"μg/m³",
		"mph",
		"mm",
		"Pa",
		"1/s",
		"%",
		"s",
		"unixtime",
		"USAQI",
		"W/m²",
		"wmo code",
		"ppm",
		"kg/m³"
	];

	public help(args?: string[]): string[] {
		return [
			`${this.name}: ${this.desc}`,
			`\tUsage: weather [zipCode?]`,
			`\tArgs:`,
			`\tzipcode: US zip code to get weather for`
		];
	}

	// TODO: add options to regulate output (-z | --zipcode [zipcode], -d | --days [days])
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

	public getWeatherParams(loc: LocationInfo): WeatherParams {
		return {
			latitude: loc.latitude,
			longitude: loc.longitude,
			timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			daily: ["temperature_2m_max", "temperature_2m_min", "precipitation_probability_max"],
			current: ["temperature_2m", "apparent_temperature", "wind_speed_10m", "wind_direction_10m", "precipitation"],
			temperature_unit: "fahrenheit",
			wind_speed_unit: "mph",
			precipitation_unit: "inch"
		};
	}

	public async execute(args: Map<string, string>): Promise<void> {
		terminal.executing = true;

		let weatherResp; // WeatherApiResponse[]

		try {
			let loc = await Location.fetchLoc(args.get("zipCode"));

			weatherResp = await fetchWeatherApi(this.weatherApi, this.getWeatherParams(loc));

			// Only process the first weather (maybe process others - controlled by flag?)
			let weather = weatherResp[0];
			let current = weather.current()!;
			let daily = weather.daily()!;

			let info: string[] = [
				`Weather Forecast For ${loc.cityName}, ${loc.regionCode}, ${loc.countryCode}:`
			];

			if (current) {
				info.push(
					`\tCurrent Weather (${new Date((Number(current.time()) + weather.utcOffsetSeconds()) * 1000)}):`,
					`\t\tTemperature: ${current.variables(0)!.value().toFixed(0)}${this.UNIT_TO_STRING[current.variables(0)!.unit()]}`,
					`\t\tApparent Temperature: ${current.variables(1)!.value().toFixed(0)}${this.UNIT_TO_STRING[current.variables(1)!.unit()]}`,
					`\t\tWind Speed: ${current.variables(2)!.value().toFixed(0)} ${this.UNIT_TO_STRING[current.variables(2)!.unit()]}`,
					`\t\tWind Direction: ${current.variables(3)!.value().toFixed(0)}${this.UNIT_TO_STRING[current.variables(3)!.unit()]}`,
					`\t\tPrecipitation: ${current.variables(4)!.value().toFixed(0)} ${this.UNIT_TO_STRING[current.variables(4)!.unit()]}`
				);
			}
			
			if (daily) {
				for (let i = 0; i < daily.variables(0)!.valuesArray()!.length; i++) {
					info.push(
						`\tWeather for ${new Date((Number(daily.time()) + i * daily.interval() + weather.utcOffsetSeconds()) * 1000)}:`,
						`\t\tMax Temperature: ${daily.variables(0)!.valuesArray()![i].toFixed(0)}${this.UNIT_TO_STRING[daily.variables(0)!.unit()]}`,
						`\t\tMin Temperature: ${daily.variables(1)!.valuesArray()![i].toFixed(0)}${this.UNIT_TO_STRING[daily.variables(1)!.unit()]}`,
						`\t\tPrecipitation Chance: ${daily.variables(2)!.valuesArray()![i].toFixed(0)}${this.UNIT_TO_STRING[daily.variables(2)!.unit()]}`
					)
				}
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