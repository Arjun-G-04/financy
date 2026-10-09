import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCategories, saveCategory } from '#lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		const categories = await getCategories();
		return json({ success: true, categories });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		if (!body.name || !body.name.trim()) {
			return json({ success: false, error: 'Category name is required' }, { status: 400 });
		}

		const category = await saveCategory(body.name);
		return json({ success: true, category });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
