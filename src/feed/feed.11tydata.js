module.exports = {
	eleventyComputed: {
		eleventyExcludeFromCollections: true,
		metadata: {
			title: (data) => data.siteMeta.feed.title,
			subtitle: (data) => data.neocities ? "Ash Walker's blog (Neocities Edition)" : "Ash Walker's blog",
			base: (data) => data.siteMeta.fqdn,
			language: "en",
			icon: "/favicon.svg",
			author: {
				name: "Ash Walker",
				email: "ashurstwalker@gmail.com",
				uri: (data) => data.siteMeta.fqdn,
				avatar: "/img/avatar.png"
			}
		}
	}
}
