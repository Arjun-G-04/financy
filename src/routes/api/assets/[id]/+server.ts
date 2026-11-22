import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteAssetEntry, getAssetsData } from '#lib/server/db';

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = params.id;
		if (!id) {
			return json({ success: false, error: 'Asset ID required' }, { status: 400 });
		}
		await deleteAssetEntry(id);
		const assets = await getAssetsData();
		return json({ success: true, assets });
	} catch (err: any) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
