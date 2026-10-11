import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveTransactionsBatch } from '#lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const items: Array<{
			id: string;
			date: string;
			type: 'credit' | 'debit';
			amount: number;
			name?: string;
			merchant?: string;
			category?: string | null;
		}> = body.transactions || [];

		if (items.length === 0) {
			return json({ success: true, count: 0 });
		}

		const formatted = items.map((item) => ({
			id: item.id,
			date: item.date,
			type: item.type,
			amount: Number(item.amount),
			name: (item.name || item.merchant || 'Unknown').trim(),
			category: item.category ? item.category.trim() : null
		}));

		const count = await saveTransactionsBatch(formatted);
		return json({ success: true, count });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
