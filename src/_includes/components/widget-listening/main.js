const LB_URL = "https://listenbrainz.org/";

async function lbApi(endpoint, cache = "default", priority = "low") {
	const apiUrl = new URL("https://api.listenbrainz.org/1/");
	var url = new URL(endpoint, apiUrl);
	var headers = new Headers();
	headers.append("Content-Type", "application/json");
	return await fetch(url, { cache: cache, priority: priority, mode: "cors", headers: headers })
		.then((response) => {
			return response.text();
		})
		.then((response) => {
			return JSON.parse(response);
		});
}

async function caaApi(endpoint, cache = "default", priority = "low") {
	const apiUrl = new URL("https://coverartarchive.org/");
	var url = new URL(endpoint, apiUrl);
	var headers = new Headers();
	// headers.append("Content-Type", "application/json");
	return await fetch(url, { cache: cache, priority: priority, mode: "cors", headers: headers })
		.then((response) => {
			return response.text();
		})
		.then((response) => {
			return JSON.parse(response);
		});
}

async function getListensFor(user, count = 25) {
	var res = await lbApi(`user/${encodeURIComponent(user)}/listens?count=${count}`, "no-cache");
	return res?.payload ?? {};
}

async function getNowPlayingFor(user) {
	var res = await lbApi(`user/${encodeURIComponent(user)}/playing-now`, "no-cache");
	return res?.payload ?? {};
}

async function lookupMetadata(artist, recording, metadata = false) {
	var res = await lbApi(`metadata/lookup/?artist_name=${encodeURIComponent(artist)}&recording_name=${encodeURIComponent(recording)}&metadata=${metadata ? "true" : "false"}`);
	return res ?? {};
}

async function getCoverArt(release_mbid) {
	var res = await caaApi(`release/${encodeURIComponent(release_mbid)}/`);
	return res?.images ?? [];
}

function mostRecentEqNowPlaying(mr, np) {
	var res = (!("artist_name" in mr) || np.artist_name == mr.artist_name)
		&& (!("release_name" in mr) || np.release_name == mr.release_name)
		&& (!("track_name" in mr) || np.track_name == mr.track_name);
	return res;
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
	coverArt = null;
	current = false;
	constructor() {}

	populateFromLbMetadata(meta) {
		if ("artist_name" in meta) {
			this.artist = meta.artist_name;
		}
		if ("release_name" in meta) {
			this.release = meta.release_name;
		}
		if ("track_name" in meta) {
			this.recording = meta.track_name;
		}
	}

	populateRecRelFromMbidMapping(mbid) {
		if ("recording_mbid" in mbid) {
			this.recordingInfo = new URL(`track/${mbid.recording_mbid}`, LB_URL);
		}
		if ("recording_name" in mbid) {
			this.recording = mbid.recording_name;
		}
		if ("release_name" in mbid) {
			this.release = mbid.release_name;
		}
		if ("release_mbid" in mbid) {
			this.releaseInfo = new URL(`release/${mbid.release_mbid}`, LB_URL);
			if (this.release == null && this.recording != null && this.artist != null) {
				this.release = lookupMetadata(this.artist, this.recording).then((metadata) => {
					return metadata?.release_name;
				}).catch((reason) => {
					console.log("could not lookup listen metadata: ", reason);
					return null;
				});
			}

			this.coverArt = getCoverArt(mbid.release_mbid).then((images) => {
				if (images.length == 0) {
					return null;
				}
				var i = 0
				var img = images[i];
				while (!img.front && images.length > i + 1) {
					i += 1;
					img = images[i];
				}

				if ("thumbnails" in img) {
					var thumbs = img.thumbnails;
					if ("250" in thumbs) {
						return thumbs["250"];
					} else if ("small" in thumbs) {
						return thumbs.small;
					} else {
						return img.image;
					}
				} else {
					return img.image;
				}
			}).catch((reason) => {
				console.log("couldn't fetch cover art: ", reason);
				return null;
			});
		}
	}


	static async fromListenBrainz(user) {

		var fetch_data = await Promise.allSettled([getListensFor(user, 1), getNowPlayingFor(user)]);
		var listen_res = fetch_data[0];
		var np_res = fetch_data[1];

		var np_listens = (np_res?.value?.listens ?? []);
		var data_listens = (listen_res?.value?.listens ?? []);

		var np = null;
		var data = null;

		if (np_listens.length >= 1) {
			np = np_listens[0];
		}

		if (data_listens.length >= 1) {
			data = data_listens[0];
		}

		if (np != null && data != null) {
			if (mostRecentEqNowPlaying(data.track_metadata, np.track_metadata)) {
				return await ListenData.fromListenBrainzMr(user, data, true);
			} else {
				return await ListenData.fromListenBrainzNp(user, np);
			}
		} else if (data != null) {
			console.log("np == null");
			return await ListenData.fromListenBrainzMr(user, data, false);
		}

		return null;
	}

	static async fromListenBrainzNp(user, np) {
		console.log("fromListenBrainzNp", user, np);
		var res = new ListenData();
		res.user = user;
		res.userInfo = new URL(`user/${user}`, LB_URL);
		res.current = true;

		var meta = np.track_metadata;
		res.populateFromLbMetadata(meta);

		if (res.artist == null || res.recording == null) {
			return null;
		}

		var lk =  await lookupMetadata(res.artist, res.recording);
		if (lk != null) {
			if ("artist_credit_name" in lk) {
				res.artist = lk.artist_credit_name;
			}
			if ("artist_mbids" in lk && lk.artist_mbids.length >= 1) {
				res.artistInfo = new URL(`artist/${lk.artist_mbids[0]}`, LB_URL);
			}
			res.populateRecRelFromMbidMapping(lk);
		}

		return res;
	}

	static async fromListenBrainzMr(user, mr, current) {
		console.log("fromListenBrainzMr", user, mr, current);
		var res = new ListenData();

		var meta = mr.track_metadata;
		var mbid = meta.mbid_mapping;

		res.user = user;
		res.userInfo = new URL(`user/${user}`, LB_URL);

		res.current = current;

		res.populateFromLbMetadata(meta);

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
			res.populateRecRelFromMbidMapping(mbid);
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
		ListenData.fromListenBrainz(user).then(async (data) => {
			this.textContent = "";
			var infoDiv = document.createElement("div");
			infoDiv.classList = ["listen-info"];
			var artistAnchor = createAnchor(data.artistInfo, data.artist);
			var albumAnchor = createAnchor(data.releaseInfo, "");
			var titleAnchor = createAnchor(data.recordingInfo, data.recording);
			var header = document.createElement("h2");
			var hAnchor = createAnchor(data.userInfo, data.current ? "Now Listening" : "Recently Listened");
			header.appendChild(hAnchor);
			infoDiv.appendChild(header);
			infoDiv.appendChild(artistAnchor);
			infoDiv.appendChild(albumAnchor);
			infoDiv.appendChild(titleAnchor);
			this.appendChild(infoDiv);
			Promise.resolve(data.release).then((release) => {
				if (release != null) {
					albumAnchor.innerText = release;
				}
			});
			Promise.resolve(data.coverArt).then((art) => {
				console.log("data.coverArt");
				if (art != null) {
					var img = document.createElement("img");
					img.classList = ["cover-art"];
					img.decoding = "async";
					img.fetchPriority = "low";
					img.loading = "lazy";
					img.src = art;
					img.alt = "cover art";
					img.title = "cover art";
					this.appendChild(img);
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
