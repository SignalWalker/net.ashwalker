async function lbApi(endpoint, cache = "default") {
	const apiUrl = new URL("https://api.listenbrainz.org/1/");
	var url = new URL(endpoint, apiUrl);
	var headers = new Headers();
	headers.append("Content-Type", "application/json");
	return await fetch(url, { cache: cache, priority: "low", mode: "cors", headers: headers })
		.then((response) => {
			return response.text();
		})
		.then((response) => {
			return JSON.parse(response);
		});
}

async function getListensFor(user, count = 25) {
	return await lbApi(`user/${user}/listens?count=${count}`, "no-cache");
}

async function getNowPlayingFor(user) {
	return await lbApi(`user/${user}/playing-now`, "no-cache");
}

async function lookupMetadata(artist, recording) {
	return await lbApi(`metadata/lookup/?artist_name=${artist}&recording_name=${recording}`);
}

class ListenData {
	userInfo = null;
	artistInfo = null;
	releaseInfo = null;
	recordingInfo = null;
	user = null;
	artist = null;
	release = null;
	recording = null;
	current = false;
	constructor() {}

	static async fromListenBrainz(user) {
		const LB_URL = "https://listenbrainz.org/";

		var np = getNowPlayingFor(user);
		var data = (await getListensFor(user, 1)).payload.listens[0];

		var meta = data.track_metadata;
		var mbid = meta.mbid_mapping;

		var res = new ListenData();

		res.user = user;
		res.userInfo = new URL(`user/${user}`, LB_URL);

		if ("artist_name" in meta) {
			res.artist = meta.artist_name;
		}
		if ("release_name" in meta) {
			res.release = meta.release_name;
		}
		if ("track_name" in meta) {
			res.recording = meta.track_name;
		}

		if (mbid != null && mbid != undefined) {
			if ("artists" in mbid && mbid.artists.length >= 1) {
				var artist = mbid.artists[0];
				if ("artist_mbid" in artist) {
					res.artistInfo = new URL(`artist/${artist.artist_mbid}`, LB_URL);
				}
				if ("artist_credit_name" in artist) {
					res.artist = artist.artist_credit_name;
				}
			}
			if ("recording_mbid" in mbid) {
				res.recordingInfo = new URL(`track/${mbid.recording_mbid}`, LB_URL);
			}
			if ("recording_name" in mbid) {
				res.recording = mbid.recording_name;
			}
			if ("release_mbid" in mbid) {
				res.releaseInfo = new URL(`release/${mbid.release_mbid}`, LB_URL);
				if (res.release == null && res.recording != null && res.artist != null) {
					res.release = lookupMetadata(res.artist, res.recording).then((metadata) => {
						return metadata?.release_name;
					}).catch((reason) => {
						console.log("could not lookup listen metadata: ", reason);
						return null;
					});
				}
			}
		}

		res.current = np.then((np) => {
			console.log("res.current");
			console.log(np);
			var pl = np?.payload;
			if (pl == null || pl == undefined || !("listens" in pl) || pl.listens.length == 0) {
				console.log("\tpl failed");
				console.log(pl);
				return false;
			}
			var now = pl.listens[0];
			if (!("track_metadata" in now)) {
				console.log("\tno metadata");
				return false;
			}
			var nm = now.track_metadata;
			console.log(meta);
			console.log(nm);
			return (!("artist_name" in meta) || nm.artist_name == meta.artist_name) && (!("release_name" in meta) || nm.release_name == meta.release_name) && (!("track_name" in meta) || nm.track_name == meta.track_name);
		});

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
		ListenData.fromListenBrainz(user).then(async (data) => {
			this.textContent = "";
			var artistAnchor = createAnchor(data.artistInfo, data.artist);
			var albumAnchor = createAnchor(data.releaseInfo, await Promise.resolve(data.release));
			var titleAnchor = createAnchor(data.recordingInfo, data.recording);
			var header = document.createElement("h2");
			var hAnchor = createAnchor(data.userInfo, "Recently Listened");
			header.appendChild(hAnchor);
			this.appendChild(header);
			this.appendChild(artistAnchor);
			this.appendChild(albumAnchor);
			this.appendChild(titleAnchor);
			Promise.resolve(data.current).then((current) => {
				console.log("data.current");
				if (current) {
					console.log("\tis current");
					hAnchor.innerText = "Now Listening";
					console.log(hAnchor);
				}
			});
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
