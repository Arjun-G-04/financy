export interface SheetTransaction {
	id: string;
	rawDate: string; // Original DD-MM-YY from sheet
	date: string; // Parsed YYYY-MM-DD
	type: 'credit' | 'debit';
	amount: number;
	merchant: string;
	raw: string;
}

export interface SheetFetchResult {
	spreadsheetTitle: string;
	transactions: SheetTransaction[];
}

export const parseDateDMYToYMD = (dateStr: string): string | null => {
	if (!dateStr) return null;
	const clean = dateStr.trim();

	// If already in YYYY-MM-DD format, return as-is
	if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

	const parts = clean.split(/[-/]/);
	if (parts.length !== 3) return null;
	let [d, m, y] = parts;
	d = d.padStart(2, '0');
	m = m.padStart(2, '0');
	if (y.length === 2) {
		y = '20' + y;
	}
	const day = parseInt(d, 10);
	const month = parseInt(m, 10);
	const year = parseInt(y, 10);
	if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;

	return `${y}-${m}-${d}`;
};

export const GoogleSheetsService = {
	async fetchSpreadsheet(spreadsheetId: string, accessToken: string) {
		const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
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

	async fetchSheetValues(spreadsheetId: string, range: string, accessToken: string) {
		const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
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

	async batchUpdateSheetValues(
		spreadsheetId: string,
		updates: { range: string; values: string[][] }[],
		accessToken: string
	) {
		const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
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

	generateUniqueId(): string {
		const rand = Math.random().toString(36).substring(2, 8);
		return `tx_${Date.now()}_${rand}`;
	},

	async getTransactionsFromSheet(
		spreadsheetId: string,
		accessToken: string,
		startDate?: string,
		endDate?: string
	): Promise<SheetFetchResult> {
		try {
			const meta = await this.fetchSpreadsheet(spreadsheetId, accessToken);
			const title = meta.properties?.title || 'Financy Ledger';

			const range = 'Sheet1!A1:F1000';
			const valuesRes = await this.fetchSheetValues(spreadsheetId, range, accessToken);
			const rows: string[][] = valuesRes.values || [];

			if (rows.length <= 1) {
				return { spreadsheetTitle: title, transactions: [] };
			}

			const headers = rows[0].map((h: string) => (h || '').toLowerCase().trim());
			const rawIdx = headers.findIndex((h: string) => h.includes('raw')) !== -1 ? headers.findIndex((h: string) => h.includes('raw')) : 0;
			const dateIdx = headers.findIndex((h: string) => h.includes('date')) !== -1 ? headers.findIndex((h: string) => h.includes('date')) : 1;
			const typeIdx = headers.findIndex((h: string) => h.includes('credit/debit') || h.includes('type')) !== -1 ? headers.findIndex((h: string) => h.includes('credit/debit') || h.includes('type')) : 2;
			const amountIdx = headers.findIndex((h: string) => h.includes('amount')) !== -1 ? headers.findIndex((h: string) => h.includes('amount')) : 3;
			const merchantIdx = headers.findIndex((h: string) => h.includes('merchant')) !== -1 ? headers.findIndex((h: string) => h.includes('merchant')) : 4;
			const idIdx = headers.findIndex((h: string) => h.includes('id')) !== -1 ? headers.findIndex((h: string) => h.includes('id')) : 5;

			const updates: { range: string; values: string[][] }[] = [];
			const parsedTransactions: SheetTransaction[] = [];

			for (let i = 1; i < rows.length; i++) {
				const row = rows[i];
				if (!row || row.length === 0) continue;

				const isRowEmpty = row.every((cell: string) => !cell || cell.trim() === '');
				if (isRowEmpty) continue;

				const rawDate = row[dateIdx] || '';
				const parsedDate = parseDateDMYToYMD(rawDate);
				if (!parsedDate) continue;

				if (startDate && parsedDate < startDate) continue;
				if (endDate && parsedDate > endDate) continue;

				while (row.length <= idIdx) {
					row.push('');
				}

				let id = row[idIdx]?.trim();

				if (!id) {
					id = this.generateUniqueId();
					row[idIdx] = id;

					let temp = idIdx;
					let colLetter = '';
					while (temp >= 0) {
						colLetter = String.fromCharCode((temp % 26) + 65) + colLetter;
						temp = Math.floor(temp / 26) - 1;
					}

					updates.push({
						range: `Sheet1!${colLetter}${i + 1}`,
						values: [[id]]
					});
				}

				const rawType = (row[typeIdx] || '').toLowerCase().trim();
				const type: 'credit' | 'debit' = rawType.includes('credit') ? 'credit' : 'debit';

				const rawAmount = parseFloat((row[amountIdx] || '').replace(/[$,]/g, '')) || 0;
				const merchant = row[merchantIdx] || 'Unknown Merchant';
				const rawText = row[rawIdx] || '';

				parsedTransactions.push({
					id,
					rawDate,
					date: parsedDate,
					type,
					amount: Math.abs(rawAmount),
					merchant,
					raw: rawText
				});
			}

			if (updates.length > 0) {
				try {
					await this.batchUpdateSheetValues(spreadsheetId, updates, accessToken);
				} catch (updateErr) {
					console.error('Failed to write IDs back to sheet:', updateErr);
				}
			}

			return {
				spreadsheetTitle: title,
				transactions: parsedTransactions
			};
		} catch (e: any) {
			console.error('Error fetching sheet summary:', e);
			throw new Error(`Failed to load data from sheet. Details: ${e.message}`);
		}
	}
};
