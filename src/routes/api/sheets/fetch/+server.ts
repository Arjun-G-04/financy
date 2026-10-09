import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleSheetsService } from '#lib/server/googleSheets';
import { getTransactions, getSettings } from '#lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const accessToken = body.accessToken;
		if (!accessToken) {
			return json({ success: false, error: 'Google Access Token is required' }, { status: 401 });
		}

		const settings = await getSettings();
		const spreadsheetId = body.spreadsheetId || settings.spreadsheetId;

		if (!spreadsheetId) {
			return json({ success: false, error: 'Spreadsheet ID not configured' }, { status: 400 });
		}

		const sheetResult = await GoogleSheetsService.getTransactionsFromSheet(
			spreadsheetId,
			accessToken,
			body.startDate,
			body.endDate
		);

		const localTxs = await getTransactions();
		const localIds = new Set(localTxs.map((t: { id: string }) => t.id));

		const evaluatedTransactions = sheetResult.transactions.map((tx: any) => ({
			...tx,
			alreadyImported: localIds.has(tx.id)
		}));

		return json({
			success: true,
			title: sheetResult.spreadsheetTitle,
			transactions: evaluatedTransactions
		});
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
