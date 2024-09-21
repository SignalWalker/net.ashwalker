module.exports = {
	eleventyComputed: {
		title: (data) => `#${data.pagination.items[0]}`,
	}
};
