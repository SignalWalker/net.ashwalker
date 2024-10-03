async function getForecast(latitude: number, longitude: number): Promise<any> {
	const apiUrl: URL = new URL("https://api.weather.gov/points/");
	return await fetch(new URL(`${latitude.toFixed(4)},${longitude.toFixed(4)}`, apiUrl))
		.then((response) => response.json());
}

export { getForecast };
