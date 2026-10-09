import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { saveTransaction } from '#lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const items: Array<{
			id: string;
			date: string;
			type: 'credit' | 'debit';
			amount: number;
			merchant: string;
			category?: string | null;
		}> = body.transactions || [];

		if (items.length === 0) {
			return json({ success: true, count: 0 });
		}

		let importedCount = 0;
		for (const item of items) {
			await saveTransaction({
				id: item.id,
				date: item.date,
				type: item.type,
				amount: item.amount,
				name: item.merchant,
				category: item.category || null
			});
			importedCount++;
		}

		return json({ success: true, count: importedCount });
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
