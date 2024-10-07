import feedPlugin from "@11ty/eleventy-plugin-rss";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import directoryOutputPlugin from "@11ty/eleventy-plugin-directory-output";
import Image from "@11ty/eleventy-img";
import markdownIt from "markdown-it";
import markdownItContainer from "markdown-it-container";
import markdownItFootnote from "markdown-it-footnote";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import fs from "node:fs";
import pluginWebc from "@11ty/eleventy-plugin-webc";
import { EleventyRenderPlugin } from "@11ty/eleventy";

import localPlugin from "./_config/main.mjs";

function dateToYMD(date) {
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function dateToTimeTag(date, classes = []) {
	var classAttr = "";
	if (classes.length > 0) {
		classAttr = `class="${classes.join(" ")}" `;
	}
	return `<time ${classAttr}datetime="${date.toISOString()}">${dateToYMD(date)}</time>`;
}

function toAttributes(data) {
	var attrs = [];
	for (const [key, value] of Object.entries(data)) {
		attrs.push(`${key}="${value}"`);
	}
	return attrs.join(" ");
}

var neocities = (process.env.ASHWALKER_NET_NEOCITIES || 0) == 1;
var devMode = (process.env.ASHWALKER_NET_DEVMODE || 0) == 1;
var offline = (process.env.ASHWALKER_NET_OFFLINE || 0) == 1;

var hostName = neocities ? "signalgarden.net" : "ashwalker.net";
var webmentionDomain = neocities ? "signal-garden.neocities.org" : "ashwalker.net";
var webmentionApiToken = offline ? "" : fs.readFileSync(`secrets/webmention_api_${hostName}.token`, 'utf8').trim();

export default async function(eleventyConfig) {
	eleventyConfig.addPlugin(localPlugin);
	eleventyConfig.addGlobalData("neocities", neocities);
	var primaryNav = {
		"Index": "/",
		"Posts": "/post/",
		"Resumé": "/resume"
	};
	var secondaryNav = {
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
		primaryNav["Fiction"] = "/post/tag/fiction/";
		//secondaryNav["Links"] = "/links/";
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
	var fqdn = `https://${hostName}/`

	var siteMeta = {
		hostName: hostName,
		fqdn: fqdn,
		title: neocities ? "Signal Garden" : "Ash Walker",
		primaryNav: primaryNav,
		secondaryNav: secondaryNav,
		feed: {
			title: neocities ? "Signal Garden NEO" : "Signal Garden",
		},
		webmention: {
			domain: webmentionDomain,
			api_token: webmentionApiToken
		}
	};
	eleventyConfig.addGlobalData("siteMeta", siteMeta);
	eleventyConfig.addGlobalData("hCardNav", hCardNav);


	eleventyConfig.setQuietMode(true);

	//eleventyConfig.addPlugin(syntaxHighlight);
	eleventyConfig.addPlugin(pluginWebc, {
		components: "src/_includes/components/**/*.webc"
	});
	eleventyConfig.addPlugin(EleventyRenderPlugin);
	eleventyConfig.addPlugin(directoryOutputPlugin);
	eleventyConfig.addPlugin(feedPlugin);
	//eleventyConfig.addPlugin(feedPlugin, {
	//	type: 'atom',
	//	outputPath: 'feed.xml',
	//	collection: {
	//		name: "feedPosts",
	//		limit: 24
	//	},
	//	metadata: {
	//		language: "en",
	//		title: siteMeta.feed.title,
	//		subtitle: siteMeta.feed.subtitle,
	//		base: fqdn,
	//		author: {
	//			name: "Ash Walker",
	//			email: "ashurstwalker@gmail.com"
	//		}
	//	}
	//});
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
	}).use(markdownItFootnote).use(markdownItContainer, 'note', {
		render: function(tokens, idx) {
			if (tokens[idx].nesting === 1) {
				return `<aside role="note">\n`;
			} else {
				return `</aside>\n`;
			}
		}
	}).use(markdownItContainer, 'small', {
		render: function(tokens, idx) {
			if (tokens[idx].nesting === 1) {
				return `<small>\n`;
			} else {
				return `</small>\n`;
			}
		}
	}));

	//eleventyConfig.addWatchTarget("**/*.css");

	eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
	eleventyConfig.addPassthroughCopy("src/.well-known");
	eleventyConfig.addPassthroughCopy("src/favicon.ico");
	eleventyConfig.addPassthroughCopy("src/favicon.svg");
	eleventyConfig.addPassthroughCopy("src/img");
	eleventyConfig.addPassthroughCopy("src/style");
	eleventyConfig.addPassthroughCopy("src/script");
	eleventyConfig.addPassthroughCopy("src/88x31.gif");
	eleventyConfig.addPassthroughCopy({ "src/res/img/ash.png": "img/avatar.png" });
	eleventyConfig.addPassthroughCopy({ "src/res/img/logos/rss.svg": "img/logo/rss.svg" });
	eleventyConfig.addWatchTarget("");
	eleventyConfig.ignores.add("_config");
	//eleventyConfig.addPassthroughCopy("res");
	//eleventyConfig.addPassthroughCopy("**/*.png");

	async function fetchWebmentions() {
		if (offline) {
			return [];
		}
		var webmentions = await fetch(`https://webmention.io/api/mentions.jf2?token=${encodeURIComponent(webmentionApiToken)}&domain=${webmentionDomain}&sort-by=created`)
			.then((response) => response.json())
			.then((mentions) => mentions);
		return webmentions.children;
	}
	eleventyConfig.addGlobalData("webmentions", await fetchWebmentions());

	eleventyConfig.on("eleventy.before", async ({ dir, runMode, outputMode }) => {
		eleventyConfig.addGlobalData("webmentions", await fetchWebmentions());
	});

	function getWebmentionsForUrl(webmentions, url) {
		const allowedTypes = ["mention-of", "in-reply-to"];
		const hasRequiredFields = entry => {
			const { author, published, content } = entry;
			return author.name && published && content;
		};
		const sanitize = entry => {
			const { content } = entry;
			if (content['content-type'] === 'text/html') {
				content.value = sanitizeHtml(content.value);
			}
			return entry;
		};
		return webmentions
			.filter((entry) => entry["wm-target"] === url)
			.filter((entry) => allowedTypes.includes(entry["wm-property"]))
			.filter(hasRequiredFields)
			.map(sanitize);
	};

	eleventyConfig.addFilter("getWebmentionsForUrl", getWebmentionsForUrl);

	// all posts tagged with either `article` or `post`
	eleventyConfig.addCollection("publicPosts", function(collectionApi) {
		var result = collectionApi.getAllSorted().filter(function(item) {
			if (!Object.hasOwn(item.data, 'tags')) {
				return false;
			}
			return item.data.tags.some((tag) => tag == "article" || tag == "post" || (neocities && tag == "fiction"));
		});
		return result;
	});

	eleventyConfig.addCollection("feedPosts", function(collectionApi) {
		var result = collectionApi.getAllSorted().filter(function(item) {
			if (!Object.hasOwn(item.data, 'tags')) {
				return false;
			}
			return item.data.tags.some((tag) => (tag == "article" || tag == "photo" || (neocities && tag == "fiction")));
		});
		return result;
	});

	eleventyConfig.addCollection("indexPosts", function(collectionApi) {
		var result = collectionApi.getAllSorted().filter(function(item) {
			if (!Object.hasOwn(item.data, 'tags')) {
				return false;
			}
			return item.data.tags.some((tag) => (tag == "article" || (neocities && tag == "fiction")));
		});
		return result;
	});

	eleventyConfig.addCollection("ephemera", function(collectionApi) {
		return collectionApi.getAllSorted().filter(function(item) {
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
		var classes = ["h-entry"].concat(tags.filter((tag) => tag == 'article' || tag == 'fiction'));
		return classes.join(" ");
	});

	eleventyConfig.addFilter("postTagsJson", function(tags) {
		return JSON.stringify(tags.filter((tag) => tag != "post"));
	});

	eleventyConfig.addShortcode("postHeader", function(title, url) {
		if (title === undefined) {
			return "";
		}
		return `
		<header>
			<h2 class="p-name"><a class="p-url" rel="canonical" href="${url}">${title}</a></h2>
		</header>
		`;
	});

	eleventyConfig.addFilter("toYMD", dateToYMD);

	eleventyConfig.addFilter("toTimeTag", dateToTimeTag);

	eleventyConfig.addFilter("toAttributes", toAttributes);

	eleventyConfig.addFilter("toButton", function(button) {
	});

	eleventyConfig.addShortcode("slice", function(array, start, end) {
		return array.slice(start, end);
	});


	eleventyConfig.addShortcode("postFooter", function(tags, url, date, mentions, expandMentions) {
		const slugify = eleventyConfig.getFilter("slugify");
		var tagStr = "";
		var tagList = tags.filter(function(tag) {
			return tag != "post";
		});
		if (tagList.length > 0) {
			tagStr = tagList.map(function(tag) {
				return `<a class="p-category" href="/post/tag/${slugify(tag)}/">#${tag}</a>`;
			}).join("\n");
			//tagStr = `
			//	${tagStr}
			//`;
		}
		var mentionsStr = mentions.length > 0 ? `<a href="${url}#webmentions">${mentions.length} Webmentions</a>` : "";
		return `
		<footer>
			<a class="p-url" rel="canonical" href="${url}">#</a>
			${dateToTimeTag(date, ["dt-published"])}
			${mentionsStr}
			${tagStr}
		</footer>
		`;
	});

	eleventyConfig.addShortcode("postAtomCategories", function(tags) {
		var tagStr = "";
		var tagList = tags.filter(function(tag) {
			return tag != "post";
		});
		if (tagList.length > 0) {
			tagStr = tagList.map(function(tag) {
				return `<category term="${tag}" />`;
			}).join("\n");
			//tagStr = `
			//	${tagStr}
			//`;
		}
		return tagStr;
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
}
