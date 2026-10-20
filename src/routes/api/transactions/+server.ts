import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransactions, saveTransaction } from '#lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const startDate = url.searchParams.get('startDate') || undefined;
		const endDate = url.searchParams.get('endDate') || undefined;
		const category = url.searchParams.get('category') || undefined;
		const type = url.searchParams.get('type') || undefined;
		const search = url.searchParams.get('search') || undefined;

		const limitStr = url.searchParams.get('limit');
		const offsetStr = url.searchParams.get('offset');
		const rawLimit = limitStr ? parseInt(limitStr, 10) : undefined;
		const rawOffset = offsetStr ? parseInt(offsetStr, 10) : undefined;
		const limit = typeof rawLimit === 'number' && !isNaN(rawLimit) && rawLimit > 0 ? rawLimit : undefined;
		const offset = typeof rawOffset === 'number' && !isNaN(rawOffset) && rawOffset >= 0 ? rawOffset : undefined;

		const transactions = await getTransactions({
			startDate,
			endDate,
			category,
			type,
			search,
			limit,
			offset
		});

		return json({ success: true, transactions });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		if (!body.date || !body.name || !body.type || body.amount === undefined) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		const tx = await saveTransaction({
			id: body.id,
			date: body.date,
			type: body.type,
			amount: Number(body.amount),
			name: body.name,
			category: body.category || null,
			createdAt: body.createdAt
		});

		return json({ success: true, transaction: tx });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
