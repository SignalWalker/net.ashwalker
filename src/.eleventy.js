const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const eleventyRssPlugin = require("@11ty/eleventy-plugin-rss");
const eleventySyntaxHighlightPlugin = require("@11ty/eleventy-plugin-syntaxhighlight");
const markdownIt = require("markdown-it");

function dateToTimeTag(date) {
	return `<time datetime="${date.toISOString()}">${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}</time>`;
}

module.exports = function (eleventyConfig) {
	eleventyConfig.addPlugin(eleventyNavigationPlugin);

	eleventyConfig.setNunjucksEnvironmentOptions({
		throwOnUndefined: true,
		trimBlocks: true,
		lstripBlocks: true
	});

	eleventyConfig.setLibrary("md", markdownIt({
		html: true,
		xhtmlOut: true
	}));

	eleventyConfig.addWatchTarget("**/*.css");

	eleventyConfig.addPassthroughCopy(".well-known");
	eleventyConfig.addPassthroughCopy("favicon.ico");
	eleventyConfig.addPassthroughCopy("favicon.svg");
	eleventyConfig.addPassthroughCopy("res");
	eleventyConfig.addPassthroughCopy("**/*.png");

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

	eleventyConfig.addShortcode("postHeader", function(post) {
		if (!Object.hasOwn(post.data, 'title')) {
			return "";
		}
		return `
		<header>
			<h1><a href="${post.url}">${post.data.title}</a></h1>
		</header>
		`;
	});

	eleventyConfig.addFilter("toTimeTag", function(date) {
		return dateToTimeTag(date);
	});

	eleventyConfig.addShortcode("postFooter", function(post) {
		var tagList = post.data.tags.filter(function (tag) {
			return tag != "post";
		});
		var tagStr = "";
		if (tagList.length > 0) {
			tagStr = tagList.map(function (tag) {
				return `<a href="/blog/tag/${tag}/">#${tag}</a>`;
			}).join("\n");
			//tagStr = `
			//	${tagStr}
			//`;
		}
		return `
		<footer>
			<a href="${post.url}">#</a>
			${dateToTimeTag(post.date)}
			${tagStr}
		</footer>
		`;
	});
};
