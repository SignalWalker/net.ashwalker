async function getListening(user) {
	const apiUrl = new URL("https://libre.fm/user/");
	// 'no-cache' means "use cache only if server indicates that the resource has not changed." If you want to
	// *completely ignore* the cache, use "reload" or "no-store"
	return await fetch(new URL(user, apiUrl), { cache: "no-cache", priority: "low" }).then((response) => response.text()).then((response) => {
		const parser = new DOMParser();
		return parser.parseFromString(response, "text/html");
	});
}

function createAnchor(href, text, rel = "external") {
	var res = document.createElement("a");
	res.href = href;
	res.rel = rel;
	res.innerText = text;
	return res;
}

function createText(type, text) {
	var res = document.createElement(type);
	res.innerText = text;
	return res;
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
		getListening(user).then((listening) => {
			this.textContent = "";
			var nowPlaying = listening.querySelector("main > section > h2");
			if (nowPlaying != undefined) {
				var links = nowPlaying.querySelectorAll("a");
				var title = links[0];
				var artist = links[1];
				var artistAnchor = createAnchor(artist.href, artist.innerText.trim())
				var titleAnchor = createAnchor(title.href, title.innerText.trim());
				this.appendChild(createText("h2", "Now Listening"));
				this.appendChild(artistAnchor);
				this.appendChild(titleAnchor);
			} else {
				var links = listening.querySelectorAll("table.tracklist td.name > a")
				var title = links[0];
				var artist = links[1];
				var artistAnchor = createAnchor(artist.href, artist.innerText.trim())
				var titleAnchor = createAnchor(title.href, title.innerText.trim());
				this.appendChild(createText("h2", "Recently Listened"));
				this.appendChild(artistAnchor);
				this.appendChild(titleAnchor);
			}
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

export { getListening, ListeningWidget };
