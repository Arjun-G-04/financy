import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFullBackupData, restoreBackupData } from '#lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		const backup = await getFullBackupData();
		const filename = `financy_backup_${Date.now()}.json`;

		return new Response(JSON.stringify(backup, null, 2), {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();
		if (!data || !data.transactions) {
			return json({ success: false, error: 'Invalid backup format' }, { status: 400 });
		}

		await restoreBackupData(data);
		return json({
			success: true,
			importedTransactions: data.transactions?.length || 0,
			importedCategories: data.categories?.length || 0
		});
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
