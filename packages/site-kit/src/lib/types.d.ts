export interface NavigationLink {
	title: string;
	prefix: string;
	pathname: string;
	sections?: {
		title: string;
		path?: string;
		sections: {
			title: string;
			path?: string;
			sections: {
				title: string;
				path: string;
				badge?: string;
			}[];
		}[];
	}[];
}

export interface Document {
	slug: string;
	file: string;
	metadata: {
		title: string;
		[key: string]: any;
	};
	body: string;
	sections: Section[];
	children: Document[];
	assets?: Record<string, string>;
	next: null | { slug: string; title: string };
	prev: null | { slug: string; title: string };
}

export interface Section {
	slug: string;
	title: string;
}
