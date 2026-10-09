import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSettings, saveSettings } from '#lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		const settings = await getSettings();
		return json({ success: true, settings });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		await saveSettings(body);
		const updated = await getSettings();
		return json({ success: true, settings: updated });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
