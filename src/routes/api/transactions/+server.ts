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

		const transactions = await getTransactions({
			startDate,
			endDate,
			category,
			type,
			search
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
