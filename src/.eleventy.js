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
	eleventyConfig.setQuietMode(true);
	eleventyConfig.addPlugin(directoryOutputPlugin);
	eleventyConfig.addPlugin(feedPlugin, {
		type: 'atom',
		outputPath: 'feed.xml',
		collection: {
			name: "article",
			limit: 0
		},
		metadata: {
			language: "en",
			title: "Signal Garden",
			subtitle: "Ash Walker's blog",
			base: "https://ashwalker.net/",
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
			return item.data.tags.some((tag) => tag == "article" || tag == "post");
		});
		return result;
	});

	eleventyConfig.addCollection("ephemera", function (collectionApi) {
		return collectionApi.getAllSorted().filter(function (item) {
			if (!Object.hasOwn(item.data, 'tags')) {
				return false;
			}
			return item.data.tags.includes("post") && !item.data.tags.includes("article");
		});
	});

	eleventyConfig.addFilter("debug", function(value) {
		console.log(value);
		return "";
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

	eleventyConfig.addTransform("minify-css", async function (content) {
		if (!(this.page.outputPath || "").endsWith(".css")) {
			return content;
		}
		var { code, map } = lightningcss.transform({
			filename: this.page.outputPath,
			code: Buffer.from(content),
			minify: true
		});
		return code;
	});
};
