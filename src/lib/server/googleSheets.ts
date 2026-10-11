import crypto from 'node:crypto';
import type { SheetTransaction, SheetFetchResult } from '#lib/types';

export type { SheetTransaction, SheetFetchResult };

/**
 * Extracts spreadsheet ID from either a raw ID string or full Google Sheets URL
 */
export function cleanSpreadsheetId(input: string): string {
	if (!input) return '';
	const trimmed = input.trim();
	// Format: https://docs.google.com/spreadsheets/d/<id>/...
	const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
	if (urlMatch && urlMatch[1]) {
		return urlMatch[1];
	}
	// Direct ID
	return trimmed;
}

/**
 * Parses varied sheet date strings into strict YYYY-MM-DD format
 */
export const parseDateDMYToYMD = (dateStr: string): string | null => {
	if (!dateStr) return null;
	const clean = dateStr.trim();

	// If already in YYYY-MM-DD format, return as-is
	if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

	// Handle DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
	const parts = clean.split(/[-/.]/);
	if (parts.length === 3) {
		const [p1, p2, p3] = parts;
		// Check if already YYYY-MM-DD with slashes or dots
		if (p1.length === 4) {
			const y = parseInt(p1, 10);
			const m = String(parseInt(p2, 10)).padStart(2, '0');
			const d = String(parseInt(p3, 10)).padStart(2, '0');
			return `${y}-${m}-${d}`;
		}

		// Assume DD-MM-YY or DD-MM-YYYY
		let d = p1.padStart(2, '0');
		let m = p2.padStart(2, '0');
		let y = p3;
		if (y.length === 2) {
			y = '20' + y;
		}
		const day = parseInt(d, 10);
		const month = parseInt(m, 10);
		const year = parseInt(y, 10);
		if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
			return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
		}
	}

	// Fallback to JS standard Date parsing for e.g. "12 Oct 2026"
	const parsed = new Date(clean);
	if (!isNaN(parsed.getTime())) {
		const year = parsed.getFullYear();
		const month = String(parsed.getMonth() + 1).padStart(2, '0');
		const day = String(parsed.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	return null;
};

/**
 * Converts a 0-indexed column number to Google Sheet letter (0 -> A, 25 -> Z, 26 -> AA)
 */
function columnToLetter(index: number): string {
	let temp = index;
	let colLetter = '';
	while (temp >= 0) {
		colLetter = String.fromCharCode((temp % 26) + 65) + colLetter;
		temp = Math.floor(temp / 26) - 1;
	}
	return colLetter;
}

export const GoogleSheetsService = {
	/**
	 * Fetches spreadsheet metadata (title, sheet tabs)
	 */
	async fetchSpreadsheet(spreadsheetId: string, accessToken: string) {
		const cleanId = cleanSpreadsheetId(spreadsheetId);
		const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Google Sheets API error: ${response.status} - ${errText}`);
		}

		return response.json();
	},

	/**
	 * Fetches cell values for a given range
	 */
	async fetchSheetValues(spreadsheetId: string, range: string, accessToken: string) {
		const cleanId = cleanSpreadsheetId(spreadsheetId);
		const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}`;
		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Google Sheets API error: ${response.status} - ${errText}`);
		}

		return response.json();
	},

	/**
	 * Writes values back to cells in a single batch
	 */
	async batchUpdateSheetValues(
		spreadsheetId: string,
		updates: { range: string; values: string[][] }[],
		accessToken: string
	) {
		const cleanId = cleanSpreadsheetId(spreadsheetId);
		const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values:batchUpdate`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify({
				valueInputOption: 'USER_ENTERED',
				data: updates
			})
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Google Sheets Batch Update error: ${response.status} - ${errText}`);
		}

		return response.json();
	},

	/**
	 * Generates unique transaction ID matching Financy standard.
	 * If deterministic seed is provided, hashes it so duplicate fetches without write permission remain idempotent.
	 */
	generateUniqueId(seed?: string): string {
		if (seed) {
			const hash = crypto.createHash('sha256').update(seed).digest('hex').substring(0, 12);
			return `tx_${hash}`;
		}
		const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 12);
		return `tx_${Date.now()}_${uuid}`;
	},

	/**
	 * Fetches transactions from sheet, generating missing IDs and back-filling them
	 */
	async getTransactionsFromSheet(
		spreadsheetId: string,
		accessToken: string,
		startDate?: string,
		endDate?: string
	): Promise<SheetFetchResult> {
		try {
			const cleanId = cleanSpreadsheetId(spreadsheetId);
			const meta = await this.fetchSpreadsheet(cleanId, accessToken);
			const spreadsheetTitle = meta.properties?.title || 'Financy Ledger';

			// Get first sheet tab dynamically
			const firstSheet = meta.sheets?.[0];
			const sheetTitle = firstSheet?.properties?.title || 'Sheet1';
			const safeSheetTitle = sheetTitle.replace(/'/g, "''");

			// Fetch columns A through Z
			const range = `'${safeSheetTitle}'!A1:Z`;
			const valuesRes = await this.fetchSheetValues(cleanId, range, accessToken);
			const rows: string[][] = valuesRes.values || [];

			if (rows.length <= 1) {
				return { spreadsheetTitle, sheetTitle, transactions: [] };
			}

			// Identify header columns
			const headers = rows[0].map((h: string) => (h || '').toLowerCase().trim());
			const rawIdx =
				headers.findIndex((h: string) => h.includes('raw')) !== -1
					? headers.findIndex((h: string) => h.includes('raw'))
					: 0;
			const dateIdx =
				headers.findIndex((h: string) => h.includes('date')) !== -1
					? headers.findIndex((h: string) => h.includes('date'))
					: 1;
			const typeIdx =
				headers.findIndex((h: string) => h.includes('credit/debit') || h.includes('type') || h === 'cr/dr') !== -1
					? headers.findIndex((h: string) => h.includes('credit/debit') || h.includes('type') || h === 'cr/dr')
					: 2;
			const amountIdx =
				headers.findIndex((h: string) => h.includes('amount') || h.includes('amt') || h.includes('value')) !== -1
					? headers.findIndex((h: string) => h.includes('amount') || h.includes('amt') || h.includes('value'))
					: 3;
			const merchantIdx =
				headers.findIndex(
					(h: string) =>
						h.includes('merchant') ||
						h.includes('description') ||
						h.includes('name') ||
						h.includes('payee') ||
						h.includes('details')
				) !== -1
					? headers.findIndex(
							(h: string) =>
								h.includes('merchant') ||
								h.includes('description') ||
								h.includes('name') ||
								h.includes('payee') ||
								h.includes('details')
						)
					: 4;

			let idIdx = headers.findIndex((h: string) => h === 'id' || h.endsWith(' id') || h.includes('uuid'));
			const updates: { range: string; values: string[][] }[] = [];

			// If no ID header exists, default to next available column
			if (idIdx === -1) {
				idIdx = headers.length;
				const colLetter = columnToLetter(idIdx);
				updates.push({
					range: `'${safeSheetTitle}'!${colLetter}1`,
					values: [['ID']]
				});
			}

			const parsedTransactions: Array<{ tx: SheetTransaction; idx: number }> = [];

			for (let i = 1; i < rows.length; i++) {
				const row = rows[i];
				if (!row || row.length === 0) continue;

				const isRowEmpty = row.every((cell: string) => !cell || cell.trim() === '');
				if (isRowEmpty) continue;

				const rawDate = row[dateIdx] || '';
				const parsedDate = parseDateDMYToYMD(rawDate);
				if (!parsedDate) continue;

				// Date range filtering
				if (startDate && parsedDate < startDate) continue;
				if (endDate && parsedDate > endDate) continue;

				while (row.length <= idIdx) {
					row.push('');
				}

				let id = row[idIdx]?.trim();

				const rawType = (row[typeIdx] || '').toLowerCase().trim();
				const cleanAmountStr = (row[amountIdx] || '').replace(/[₹$€£,\s]/g, '').trim();
				const parsedAmountNum = parseFloat(cleanAmountStr) || 0;
				const merchant = row[merchantIdx] || 'Unknown Merchant';
				const rawText = row[rawIdx] || '';

				// Allocate ID if missing
				if (!id) {
					const rowSeed = `${cleanId}_${sheetTitle}_${i}_${parsedDate}_${cleanAmountStr}_${rawText}`;
					id = this.generateUniqueId(rowSeed);
					row[idIdx] = id;

					const colLetter = columnToLetter(idIdx);
					updates.push({
						range: `'${safeSheetTitle}'!${colLetter}${i + 1}`,
						values: [[id]]
					});
				}

				let type: 'credit' | 'debit' =
					rawType.includes('credit') || rawType === 'cr' ? 'credit' : 'debit';
				if (parsedAmountNum < 0) {
					type = 'debit';
				}

				parsedTransactions.push({
					tx: {
						id,
						rawDate,
						date: parsedDate,
						type,
						amount: Math.abs(parsedAmountNum),
						merchant,
						raw: rawText
					},
					idx: i
				});
			}

			// Batch update generated IDs to Google Sheet
			if (updates.length > 0) {
				try {
					await this.batchUpdateSheetValues(cleanId, updates, accessToken);
				} catch (updateErr) {
					console.error('Failed to write IDs back to sheet:', updateErr);
				}
			}

			// Sort: latest dates first; if same date, later rows first
			parsedTransactions.sort((a, b) => {
				const dateComp = b.tx.date.localeCompare(a.tx.date);
				if (dateComp !== 0) return dateComp;
				return b.idx - a.idx;
			});

			return {
				spreadsheetTitle,
				sheetTitle,
				transactions: parsedTransactions.map((item) => item.tx)
			};
		} catch (e: any) {
			console.error('Error fetching sheet summary:', e);
			throw new Error(`Failed to load data from sheet: ${e.message}`);
		}
	}
};
