import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteTransaction } from '#lib/server/db';

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = params.id;
		if (!id) {
			return json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
		}

		await deleteTransaction(id);
		return json({ success: true, id });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
