async function lbApi(endpoint) {
	const apiUrl = new URL("https://api.listenbrainz.org/1/");
	var url = new URL(endpoint, apiUrl);
	var headers = new Headers();
	headers.append("Content-Type", "application/json");
	return await fetch(url, { cache: "no-cache", priority: "low", mode: "cors", headers: headers })
		.then((response) => {
			return response.text();
		})
		.then((response) => {
			return JSON.parse(response);
		});
}

async function getListensFor(user, count = 25) {
	return await lbApi(`user/${user}/listens?count=${count}`);
}

async function getNowPlayingFor(user) {
	return await lbApi(`user/${user}/playing-now`);
}

class ListenData {
	userInfo = null;
	artistInfo = null;
	albumInfo = null;
	trackInfo = null;
	user = "[unknown]";
	artist = "[unknown]";
	album = "[unknown]";
	track = "[unknown]";
	current = false;
	constructor() {}

	static async fromListenBrainz(user) {
		const LB_URL = "https://listenbrainz.org/";
		var fetch_results = await Promise.all([getListensFor(user, 1), getNowPlayingFor(user)]);
		console.log(fetch_results);
		var data = fetch_results[0].payload.listens[0];
		var np = fetch_results[1].payload;

		var meta = data.track_metadata;
		var mbid = meta.mbid_mapping;
		var res = new ListenData();
		res.userInfo = new URL(`user/${user}`, LB_URL);
		if (mbid != undefined) {
			res.artistInfo = new URL(`artist/${mbid.artist_mbids[0]}`, LB_URL);
			res.albumInfo = new URL(`release/${mbid.release_mbid}`, LB_URL);
			res.trackInfo = new URL(`track/${mbid.recording_mbid}`, LB_URL);
		}
		res.user = user;
		res.artist = meta.artist_name;
		res.album = meta.release_name;
		res.track = meta.track_name;

		if (np.listens.length >= 1) {
			var now = np.listens[0].track_metadata;
			res.current = now.artist_name === res.artist && now.release_name === res.album && now.track_name === res.track;
		}

		return res;
	}
}

function createText(type, text) {
	var res = document.createElement(type);
	res.innerText = text;
	return res;
}

function createAnchor(href, text, rel = "external") {
	if (href == null) {
		return createText("span", text);
	} else {
		var res = createText("a", text);
		res.href = href;
		res.rel = rel;
		return res;
	}
}


class ListeningWidget extends HTMLElement {
	constructor() {
		super();
		return this;
	}

	init() {
		if (!this.checkVisibility()) {
			console.log("ListeningWidget not displayed; removing from DOM...");
			this.remove();
			return;
		}
		var user = this.attributes.getNamedItem("user").nodeValue;
		console.log("ListeningWidget connected, user:", user);
		ListenData.fromListenBrainz(user).then((data) => {
			this.textContent = "";
			var artistAnchor = createAnchor(data.artistInfo, data.artist);
			var albumAnchor = createAnchor(data.albumInfo, data.album);
			var titleAnchor = createAnchor(data.trackInfo, data.track);
			var header = document.createElement("h2");
			var hAnchor = createAnchor(data.userInfo, data.current ? "Now Listening" : "Recently Listened");
			header.appendChild(hAnchor);
			this.appendChild(header);
			this.appendChild(artistAnchor);
			this.appendChild(albumAnchor);
			this.appendChild(titleAnchor);
		}).catch(error => {
			console.log("ListeningWidget error: ", error);
			this.remove();
		});
	}

	connectedCallback() {
		this.init();
	}
}

window.customElements.define("widget-listening", ListeningWidget, { extends: "section" });

export { ListenData, ListeningWidget };
