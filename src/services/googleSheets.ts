export interface SheetTransaction {
  id: string;
  rawDate: string;   // Original DD-MM-YY from sheet
  date: string;      // Parsed YYYY-MM-DD
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
  /**
   * Fetches the metadata of a Google Spreadsheet
   */
  async fetchSpreadsheet(spreadsheetId: string, accessToken: string) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Sheets API error: ${response.status} - ${errText}`);
    }

    return response.json();
  },

  /**
   * Fetches raw values from a Google Sheet range
   */
  async fetchSheetValues(spreadsheetId: string, range: string, accessToken: string) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Sheets API error: ${response.status} - ${errText}`);
    }

    return response.json();
  },

  /**
   * Writes unique IDs back to the sheet in a single batch update
   */
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
        Accept: 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: updates,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Sheets Batch Update error: ${response.status} - ${errText}`);
    }

    return response.json();
  },

  /**
   * Generates a unique transaction ID
   */
  generateUniqueId(): string {
    const rand = Math.random().toString(36).substring(2, 8);
    return `tx_${Date.now()}_${rand}`;
  },

  /**
   * Fetches sheet, generates missing IDs, writes them back, and returns all parsed transactions
   */
  async getTransactionsFromSheet(
    spreadsheetId: string,
    accessToken: string,
    startDate?: string,
    endDate?: string
  ): Promise<SheetFetchResult> {
    try {
      // 1. Fetch metadata to get title
      const meta = await this.fetchSpreadsheet(spreadsheetId, accessToken);
      const title = meta.properties?.title || 'Financy Ledger';

      // 2. Fetch full Sheet1 range
      const range = 'Sheet1!A1:F1000';
      const valuesRes = await this.fetchSheetValues(spreadsheetId, range, accessToken);
      const rows: string[][] = valuesRes.values || [];

      if (rows.length <= 1) {
        return { spreadsheetTitle: title, transactions: [] };
      }

      // Identify header indexes
      const headers = rows[0].map(h => (h || '').toLowerCase().trim());
      const rawIdx = headers.findIndex(h => h.includes('raw')) !== -1 ? headers.findIndex(h => h.includes('raw')) : 0;
      const dateIdx = headers.findIndex(h => h.includes('date')) !== -1 ? headers.findIndex(h => h.includes('date')) : 1;
      const typeIdx = headers.findIndex(h => h.includes('credit/debit') || h.includes('type')) !== -1 ? headers.findIndex(h => h.includes('credit/debit') || h.includes('type')) : 2;
      const amountIdx = headers.findIndex(h => h.includes('amount')) !== -1 ? headers.findIndex(h => h.includes('amount')) : 3;
      const merchantIdx = headers.findIndex(h => h.includes('merchant')) !== -1 ? headers.findIndex(h => h.includes('merchant')) : 4;
      const idIdx = headers.findIndex(h => h.includes('id')) !== -1 ? headers.findIndex(h => h.includes('id')) : 5;

      const updates: { range: string; values: string[][] }[] = [];
      const parsedTransactions: SheetTransaction[] = [];

      // Scan rows starting from index 1 (under headers)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        // Skip rows that are entirely empty
        const isRowEmpty = row.every(cell => !cell || cell.trim() === '');
        if (isRowEmpty) continue;

        // Parse date first to filter out early
        const rawDate = row[dateIdx] || '';
        const parsedDate = parseDateDMYToYMD(rawDate);
        if (!parsedDate) continue;

        // Date range filtering
        if (startDate && parsedDate < startDate) continue;
        if (endDate && parsedDate > endDate) continue;

        // Ensure row has enough cells up to idIdx
        while (row.length <= idIdx) {
          row.push('');
        }

        let id = row[idIdx]?.trim();

        // 3. Allocate ID if missing (only for rows inside the date range!)
        if (!id) {
          id = this.generateUniqueId();
          row[idIdx] = id; // update local representation

          // Convert index to A-Z letter, supporting AA, AB etc. for overflow
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

        // Parse content
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

      // 4. Batch update Google Sheets with new IDs
      if (updates.length > 0) {
        console.log(`Writing ${updates.length} generated IDs back to Google Sheet...`);
        try {
          await this.batchUpdateSheetValues(spreadsheetId, updates, accessToken);
        } catch (updateErr) {
          console.error('Failed to write IDs to sheet, continuing in-memory:', updateErr);
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
