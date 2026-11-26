import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAssetsData, saveAssetEntry } from '#lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		const assets = await getAssetsData();
		return json({ success: true, ...assets });
	} catch (err: any) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const name = String(body.name || '').trim();
		const initial = Number(body.initial);
		const final = Number(body.final);

		if (!name) {
			return json({ success: false, error: 'Asset name cannot be empty' }, { status: 400 });
		}
		if (isNaN(initial) || isNaN(final)) {
			return json({ success: false, error: 'Initial and final values must be valid numbers' }, { status: 400 });
		}

		const entry = await saveAssetEntry({
			id: body.id,
			name,
			initial,
			final,
			localDate: typeof body.localDate === 'string' ? body.localDate : undefined
		});

		const assets = await getAssetsData();
		return json({ success: true, entry, assets });
	} catch (err: any) {
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
