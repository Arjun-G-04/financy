import type { PageServerLoad } from './$types';
import { getTransactions, getCategories, getSettings } from '#lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const [transactions, categories, settings] = await Promise.all([
		getTransactions(),
		getCategories(),
		getSettings()
	]);

	return {
		user: locals.user,
		transactions,
		categories,
		settings
	};
};
