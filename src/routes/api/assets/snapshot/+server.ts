import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { recordAssetSnapshot, getAssetsData } from '#lib/server/db';

export const POST: RequestHandler = async () => {
	try {
		const snapshot = await recordAssetSnapshot();
		const assets = await getAssetsData();
		return json({ success: true, snapshot, assets });
	} catch (err: any) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
