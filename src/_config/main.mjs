export default function(eleventyConfig) {
	eleventyConfig.addJavaScriptFunction("tagsToEntryClass", function(tags) {
		return ['h-entry'].concat(tags.filter((tag) => tag == 'article' || tag == 'fiction')).join(' ');
	});
	eleventyConfig.addJavaScriptFunction("isPublicTag", function(tag) {
		return tag != "post";
	});
}
