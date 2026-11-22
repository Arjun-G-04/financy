import type { PageServerLoad } from './$types';
import { getTransactions, getCategories, getSettings, getAssetsData } from '#lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
	const [transactions, categories, settings, assets] = await Promise.all([
		getTransactions(),
		getCategories(),
		getSettings(),
		getAssetsData()
	]);

	return {
		user: locals.user ?? null,
		transactions,
		categories,
		settings,
		assets
	};
};
