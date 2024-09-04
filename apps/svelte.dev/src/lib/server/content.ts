import { read } from '$app/server';
import type { Document } from '@sveltejs/site-kit';
import { create_index } from '@sveltejs/site-kit/server/content';

const documents = import.meta.glob<string>('../../../content/**/*.md', {
	eager: true,
	query: '?url',
	import: 'default'
});

const assets = import.meta.glob<string>('../../../content/**/+assets/**', {
	eager: true,
	query: '?url',
	import: 'default'
});

// https://github.com/vitejs/vite/issues/17453
export const index = await create_index(documents, assets, '../../../content', read);

const months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

function format_date(date: string) {
	const [y, m, d] = date.split('-');
	return `${months[+m - 1]} ${+d} ${y}`;
}

export const blog_posts = index.blog.children
	.map((post) => {
		const authors: Array<{ name: string; url: string }> = [];

		if (post.metadata.author) {
			const names: string[] = post.metadata.author.split(/, ?/);
			const urls: string[] = post.metadata.authorURL.split(/, ?/);

			if (names.length !== urls.length) {
				throw new Error(`Mismatched authors and URLs in ${post.file}`);
			}

			authors.push(...names.map((name, i) => ({ name, url: urls[i] })));
		}

		const date = post.metadata.date ?? post.file.split('/').pop()!.slice(0, 10);

		return {
			title: post.metadata.title,
			date,
			date_formatted: format_date(date),
			description: post.metadata.description,
			draft: post.metadata.draft,
			authors,
			...post
		};
	})
	.sort((a, b) => (a.date < b.date ? 1 : -1));

/**
 * Create docs index, which is basically the same structure as the original index
 * but with adjusted slugs (the section part is omitted for cleaner URLs), separated
 * topics/pages and next/prev adjusted so that they don't point to different topics.
 */
function create_docs() {
	function remove_section(slug: string) {
		return slug.replace(/\/[^/]+(\/[^/]+)$/g, '$1');
	}

	function remove_docs(slugs: string) {
		return slugs.replace(/^docs\//, '');
	}

	let docs: {
		/** The top level entries/packages: svelte/kit/etc. Key is the topic+version (e.g. 'svelte/v05') */
		topics: Record<string, Document>;
		/** The docs pages themselves. Key is the topic + page */
		pages: Record<string, Document>;
	} = { topics: {}, pages: {} };

	for (const topic of index.docs.children) {
		const pkg = topic.slug.split('/')[1];

		for (const version of topic.children) {
			const sections = version.children;
			const transformed_topic: Document = (docs.topics[remove_docs(version.slug)] = {
				...version,
				children: []
			});

			for (const section of sections) {
				const pages = section.children;
				const transformed_section: Document = {
					...section,
					children: []
				};

				transformed_topic.children.push(transformed_section);

				for (const page of pages) {
					const slug = remove_section(page.slug);
					const transformed_page: Document = (docs.pages[remove_docs(slug)] = {
						...page,
						slug,
						next: page.next?.slug.startsWith(`docs/${pkg}/`)
							? { slug: remove_section(page.next.slug), title: page.next.title }
							: null,
						prev: page.prev?.slug.startsWith(`docs/${pkg}/`)
							? { slug: remove_section(page.prev.slug), title: page.prev.title }
							: null
					});

					transformed_section.children.push(transformed_page);
				}
			}
		}
	}

	return docs;
}

export const docs = create_docs();
