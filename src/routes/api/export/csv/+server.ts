import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransactions, type LocalTransaction } from '#lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		const transactions = await getTransactions();
		if (transactions.length === 0) {
			return json({ success: false, error: 'No transactions in ledger to export' }, { status: 400 });
		}

		const header = '\ufeffDate,Name,Category,Type,Amount\n';
		const rows = transactions
			.map((tx: LocalTransaction) => {
				const date = tx.date;
				const name = `"${tx.name.replace(/"/g, '""')}"`;
				const category = tx.category ? `"${tx.category.replace(/"/g, '""')}"` : '""';
				const type = tx.type;
				const amount = tx.amount.toFixed(2);
				return `${date},${name},${category},${type},${amount}`;
			})
			.join('\n');

		const filename = `financy_export_${Date.now()}.csv`;
		return new Response(header + rows, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Export failed';
		return json({ success: false, error: message }, { status: 500 });
	}
};
