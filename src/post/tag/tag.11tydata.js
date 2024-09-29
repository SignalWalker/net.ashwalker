export default {
	eleventyComputed: {
		title: (data) => `#${data.pagination.items[0]}`,
	}
}
