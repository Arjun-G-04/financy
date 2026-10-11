import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const error = url.searchParams.get('error');
	return {
		error
	};
};
