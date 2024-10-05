async function getForecast(latitude, longitude) {
	const apiUrl = new URL("https://api.weather.gov/points/");
	return await fetch(new URL(`${latitude.toFixed(4)},${longitude.toFixed(4)}`, apiUrl))
		.then((response) => response.json())
		.then((response) => {
			return fetch(new URL(response.properties.forecast));
		})
		.then((response) => response.json())
		.then((forecast) => forecast.properties);
}

function toCelcius(f) {
	return (f - 32) * (5 / 9);
}

function precipitationSymbol(p, temp) {
	if (p >= 1) {
		return '⛈';
	} else if (p >= 0.75) {
		return '🌧';
	} else if (p >= 0.50) {
		return '🌦';
	} else if (p >= 0.25) {
		return '☁';
	} else {
		return '☉';
	}
}

class WeatherWidget extends HTMLDivElement {
	constructor() {
		super();
		this.classList.add("widget");
		//var shadow = this.attachShadow({ mode: "open" });
		return this;
	}

	connectedCallback() {
		var shadow = this;
		getForecast(48.07, -121.11).then((forecast) => {
			this.textContent = "";
			console.log(forecast);
			var current = forecast.periods[0];
			var temp = current.temperatureUnit == "F" ? toCelcius(current.temperature) : current.temperature;
			var precip = current.probabilityOfPrecipitation.value / 100;
			var precipSymbol = precipitationSymbol(precip, temp);
			var icon = document.createElement("h2");
			icon.textContent = precipSymbol;
			shadow.appendChild(icon);
			var tempSpan = document.createElement("span");
			tempSpan.textContent = `${temp.toFixed(1)}°C`;
			shadow.appendChild(tempSpan);
			var detailsMarquee = document.createElement("marquee");
			detailsMarquee.textContent = current.detailedForecast;
			shadow.appendChild(detailsMarquee);
		});
	}
}

window.customElements.define("widget-weather", WeatherWidget, { extends: "div" });

export { getForecast, WeatherWidget };
