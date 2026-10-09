import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteCategory } from '#lib/server/db';

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = params.id;
		if (!id) {
			return json({ success: false, error: 'Category ID is required' }, { status: 400 });
		}

		await deleteCategory(id);
		return json({ success: true, id });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
