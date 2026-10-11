import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleSheetsService, cleanSpreadsheetId } from '#lib/server/googleSheets';
import { getExistingTransactionIds, getSettings } from '#lib/server/db';
import { getValidAccessToken } from '#lib/server/auth';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	try {
		const body = await request.json().catch(() => ({}));

		// 1. Resolve Access Token (prefer active session with auto-refresh)
		let accessToken = body.accessToken?.trim();
		if (!accessToken) {
			try {
				accessToken = await getValidAccessToken(cookies, locals);
			} catch (authErr: any) {
				return json(
					{
						success: false,
						error: authErr.message || 'Authentication required to access Google Sheets'
					},
					{ status: 401 }
				);
			}
		}

		// 2. Resolve Spreadsheet ID
		const settings = await getSettings();
		const rawSpreadsheetId = body.spreadsheetId || settings.spreadsheetId;
		const spreadsheetId = cleanSpreadsheetId(rawSpreadsheetId);

		if (!spreadsheetId) {
			return json(
				{
					success: false,
					error: 'Spreadsheet ID not configured. Please provide an ID or set it in Settings.'
				},
				{ status: 400 }
			);
		}

		// 3. Query Sheet Data
		const sheetResult = await GoogleSheetsService.getTransactionsFromSheet(
			spreadsheetId,
			accessToken,
			body.startDate?.trim() || undefined,
			body.endDate?.trim() || undefined
		);

		// 4. Mark duplicates / already imported
		const sheetTxIds = sheetResult.transactions.map((tx) => tx.id);
		const existingIds = await getExistingTransactionIds(sheetTxIds);

		const evaluatedTransactions = sheetResult.transactions.map((tx) => ({
			...tx,
			alreadyImported: existingIds.has(tx.id)
		}));

		return json({
			success: true,
			title: sheetResult.spreadsheetTitle,
			sheetTitle: sheetResult.sheetTitle,
			transactions: evaluatedTransactions
		});
	} catch (error: any) {
		console.error('Failed to fetch Google Sheet rows:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error communicating with Google Sheets'
			},
			{ status: 500 }
		);
	}
};
