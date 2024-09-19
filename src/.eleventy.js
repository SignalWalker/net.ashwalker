const { feedPlugin } = require("@11ty/eleventy-plugin-rss");
const { eleventyImageTransformPlugin } = require("@11ty/eleventy-img");
const directoryOutputPlugin = require("@11ty/eleventy-plugin-directory-output");
const Image = require("@11ty/eleventy-img");
const markdownIt = require("markdown-it");
const markdownItFootnote = require("markdown-it-footnote");
const lightningcss = require('lightningcss');

function dateToTimeTag(date, classes = []) {
	var classAttr = "";
	if (classes.length > 0) {
		classAttr = `class="${classes.join(" ")}" `;
	}
	return `<time ${classAttr}datetime="${date.toISOString()}">${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}</time>`;
}

module.exports = function (eleventyConfig) {
	var neocities = (process.env.ASHWALKER_NET_NEOCITIES || 0) == 1;
	var devMode = (process.env.ASHWALKER_NET_DEVMODE || 0) == 1;
	eleventyConfig.addGlobalData("neocities", neocities);
	var primaryNav = {
		"About": "/",
		"Posts": "/post/",
		"Resumé": "/resume"
	};
	var hCardNav = {
		activitypub: {
			href: "https://social.ashwalker.net/Ash",
			img: {
				src: "/res/img/logos/activitypub.svg",
				alt: "ActivityPub",
				title: "ActivityPub"
			}
		},
		github: {
			href: "https://github.com/SignalWalker",
			img: {
				src: "/res/img/logos/git.svg",
				alt: "Github",
				title: "Github"
			}
		},
		personalGit: {
			href: "https://git.ashwalker.net/Ash",
			img: {
				src: "/favicon.svg",
				alt: "Personal Code Forge",
				title: "Personal Code Forge"
			}
		}
	};
	if (devMode) {
		console.log("Developer mode...");
	} else {
		eleventyConfig.ignores.add("**/draft");
	}
	if (neocities) {
		console.log("Building for Neocities...");
		delete primaryNav['Resumé'];
		eleventyConfig.ignores.add("**/resume.njk");
		delete hCardNav['github'];
		delete hCardNav['personalGit'];
		hCardNav['neocities'] = {
			href: "https://neocities.org/site/signal-garden",
			img: {
				src: "/res/img/logos/neocities.png",
				alt: "Neocities",
				title: "Neocities"
			}
		};
		hCardNav['ao3'] = {
			href: "https://archiveofourown.org/users/SignalWalker",
			img: {
				src: "/res/img/logos/ao3.png",
				alt: "Archive of Our Own",
				title: "Archive of Our Own"
			}
		};
		hCardNav['tumblr'] = {
			href: "https://www.tumblr.com/blog/signalwalker",
			img: {
				src: "/res/img/logos/tumblr.svg",
				alt: "Tumblr",
				title: "Tumblr"
			}
		};
	} else {
		eleventyConfig.ignores.add("**/neocities/**");
		eleventyConfig.ignores.add("**/fiction/**");
	}
	eleventyConfig.addGlobalData("siteMeta", {
		primaryNav: primaryNav,
	});
	console.log(hCardNav);
	eleventyConfig.addGlobalData("hCardNav", hCardNav);

	var fqdn = neocities ? "https://signal-garden.neocities.org/" : "https://ashwalker.net/";

	eleventyConfig.setQuietMode(true);
	eleventyConfig.addPlugin(directoryOutputPlugin);
	eleventyConfig.addPlugin(feedPlugin, {
		type: 'atom',
		outputPath: 'feed.xml',
		collection: {
			name: "feedPosts",
			limit: 24
		},
		metadata: {
			language: "en",
			title: neocities ? "Signal Cities" : "Signal Garden",
			subtitle: "Ash Walker's blog",
			base: fqdn,
			author: {
				name: "Ash Walker",
				email: "ashurstwalker@gmail.com"
			}
		}
	});
	eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		extensions: "html",
		formats: ["avif", "webp", "svg"],
		svgShortCircuit: true,
		widths: ["auto"],
		defaultAttributes: {
			loading: "lazy",
			decoding: "async"
		},
	});

	eleventyConfig.setNunjucksEnvironmentOptions({
		throwOnUndefined: true,
		trimBlocks: true,
		lstripBlocks: true
	});

	eleventyConfig.setLibrary("md", markdownIt({
		html: true,
		xhtmlOut: true
	}).use(markdownItFootnote));

	//eleventyConfig.addWatchTarget("**/*.css");

	eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
	eleventyConfig.addPassthroughCopy("src/.well-known");
	eleventyConfig.addPassthroughCopy("src/favicon.ico");
	eleventyConfig.addPassthroughCopy("src/favicon.svg");
	eleventyConfig.addPassthroughCopy("src/img");
	eleventyConfig.addPassthroughCopy("src/style");
	eleventyConfig.addWatchTarget("");
	//eleventyConfig.addPassthroughCopy("res");
	//eleventyConfig.addPassthroughCopy("**/*.png");

	// all posts tagged with either `article` or `post`
	eleventyConfig.addCollection("publicPosts", function (collectionApi) {
		var result = collectionApi.getAllSorted().filter(function (item) {
			if (!Object.hasOwn(item.data, 'tags')) {
				return false;
			}
			return item.data.tags.some((tag) => tag == "article" || tag == "post" || (neocities && tag == "fiction"));
		});
		return result;
	});

	eleventyConfig.addCollection("feedPosts", function (collectionApi) {
		var result = collectionApi.getAllSorted().filter(function (item) {
			if (!Object.hasOwn(item.data, 'tags')) {
				return false;
			}
			return item.data.tags.some((tag) => (tag == "article" || (neocities && tag == "fiction")));
		});
		return result;
	});

	eleventyConfig.addCollection("ephemera", function (collectionApi) {
		return collectionApi.getAllSorted().filter(function (item) {
			if (!Object.hasOwn(item.data, 'tags')) {
				return false;
			}
			var isPost = false;
			for (const tag of item.data.tags) {
				if (tag == "article" || tag == "fiction") {
					return false;
				} else if (tag == "post") {
					isPost = true;
				}
			}
			return isPost;
		});
	});

	eleventyConfig.addFilter("debug", function(value) {
		console.log(value);
		return "";
	})

	eleventyConfig.addFilter("postClasses", function(tags) {
		var classes = ["h-entry"];
		if (tags.some((tag) => tag == 'article' || tag == 'fiction')) {
			classes.push("article");
		}
		return classes.join(" ");
	})

	eleventyConfig.addShortcode("postHeader", function(title, url) {
		if (title === undefined) {
			return "";
		}
		return `
		<header>
			<h1 class="p-name"><a class="p-url" href="${url}">${title}</a></h1>
		</header>
		`;
	});

	eleventyConfig.addFilter("toTimeTag", function(date) {
		return dateToTimeTag(date);
	});


	eleventyConfig.addShortcode("postFooter", function(tags, url, date) {
		var tagStr = "";
		var tagList = tags.filter(function (tag) {
			return tag != "post";
		});
		if (tagList.length > 0) {
			tagStr = tagList.map(function (tag) {
				return `<a class="p-category" href="/post/tag/${tag}/">#${tag}</a>`;
			}).join("\n");
			//tagStr = `
			//	${tagStr}
			//`;
		}
		return `
		<footer>
			<a class="p-url" href="${url}">#</a>
			${dateToTimeTag(date, ["dt-published"])}
			${tagStr}
		</footer>
		`;
	});

	eleventyConfig.addFilter("postTitle", function(post) {
		if (!Object.hasOwn(post.data, 'title')) {
			return post.fileSlug;
		} else {
			return post.data.title;
		}
	});

	//eleventyConfig.addTransform("minify-css", async function (content) {
	//	if (!(this.page.outputPath || "").endsWith(".css")) {
	//		return content;
	//	}
	//	var { code, map } = lightningcss.transform({
	//		filename: this.page.outputPath,
	//		code: Buffer.from(content),
	//		minify: true
	//	});
	//	if
	//	return code;
	//});
};
