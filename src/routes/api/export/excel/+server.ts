import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransactions, getSettings, getAssetsData, type LocalTransaction } from '#lib/server/db';

type CellDef = { type: 'String'; value: string; bold?: boolean } | { type: 'Number'; value: number; bold?: boolean };

function escapeXml(str: string): string {
	return str.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '&':
				return '&amp;';
			case "'":
				return '&apos;';
			case '"':
				return '&quot;';
			default:
				return c;
		}
	});
}

function buildCell(cell: CellDef): string {
	const style = cell.bold ? ' ss:StyleID="BoldStyle"' : '';
	if (cell.type === 'Number') {
		const safeNum = Number.isFinite(cell.value) ? cell.value.toFixed(2) : '0.00';
		return `<Cell${style}><Data ss:Type="Number">${safeNum}</Data></Cell>`;
	}
	return `<Cell${style}><Data ss:Type="String">${escapeXml(cell.value)}</Data></Cell>`;
}

function buildWorksheetXml(name: string, rows: CellDef[][]): string {
	const rowsXml = rows
		.map((cells) =>
			cells.length === 0 ? '   <Row></Row>' : `   <Row>\n    ${cells.map(buildCell).join('\n    ')}\n   </Row>`
		)
		.join('\n');

	return ` <Worksheet ss:Name="${escapeXml(name)}">\n  <Table>\n${rowsXml}\n  </Table>\n </Worksheet>`;
}

function resolveTimeZone(rawTz: string | null): string | undefined {
	if (!rawTz) return undefined;
	try {
		Intl.DateTimeFormat(undefined, { timeZone: rawTz });
		return rawTz;
	} catch {
		return undefined;
	}
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const [transactions, settings, assets] = await Promise.all([
			getTransactions(),
			getSettings(),
			getAssetsData()
		]);

		if (transactions.length === 0) {
			return json({ success: false, error: 'No transactions in ledger to export' }, { status: 400 });
		}

		const timeZone = resolveTimeZone(url.searchParams.get('tz'));
		const formatDateTime = (ts?: number) => {
			if (!ts) return 'N/A';
			return new Date(ts).toLocaleDateString('en-GB', {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				...(timeZone ? { timeZone } : {})
			});
		};

		let ledgerCredit = 0;
		let ledgerDebit = 0;
		let latestTxTs = 0;
		transactions.forEach((tx: LocalTransaction) => {
			if (tx.type === 'credit') ledgerCredit += tx.amount;
			else ledgerDebit += tx.amount;
			if (tx.createdAt && tx.createdAt > latestTxTs) latestTxTs = tx.createdAt;
		});
		const ledgerNet = ledgerCredit - ledgerDebit;

		const r = settings.reconciliation;
		const numCcDebt = parseFloat(r.ccDebt) || 0;
		const numHdfc = parseFloat(r.hdfc) || 0;
		const numKvb = parseFloat(r.kvb) || 0;
		const numCash = parseFloat(r.cash) || 0;
		const numCredits = parseFloat(r.creditsOwed) || 0;

		const theoreticalMoney = ledgerNet + numCcDebt;
		const actualMoney = numHdfc + numKvb + numCash + numCredits;
		const netDifference = theoreticalMoney - actualMoney;

		const ledgerRows: CellDef[][] = [
			[
				{ type: 'String', value: 'Date', bold: true },
				{ type: 'String', value: 'Name', bold: true },
				{ type: 'String', value: 'Category', bold: true },
				{ type: 'String', value: 'Type', bold: true },
				{ type: 'String', value: 'Amount', bold: true }
			],
			...transactions.map((tx): CellDef[] => [
				{ type: 'String', value: tx.date },
				{ type: 'String', value: tx.name },
				{ type: 'String', value: tx.category || '' },
				{ type: 'String', value: tx.type },
				{ type: 'Number', value: tx.amount }
			])
		];

		const reconRows: CellDef[][] = [
			[
				{ type: 'String', value: 'Last Reconciled Timestamp' },
				{ type: 'String', value: r.lastUpdated || 'N/A' }
			],
			[],
			[
				{ type: 'String', value: 'Metric', bold: true },
				{ type: 'String', value: 'Value', bold: true }
			],
			[
				{ type: 'String', value: 'Ledger Net Balance' },
				{ type: 'Number', value: ledgerNet }
			],
			[
				{ type: 'String', value: 'Credit Card Unpaid Bill (CC Debt)' },
				{ type: 'Number', value: numCcDebt }
			],
			[
				{ type: 'String', value: 'Total Theoretical Money', bold: true },
				{ type: 'Number', value: theoreticalMoney, bold: true }
			],
			[],
			[
				{ type: 'String', value: 'HDFC Bank Balance' },
				{ type: 'Number', value: numHdfc }
			],
			[
				{ type: 'String', value: 'KVB Bank Balance' },
				{ type: 'Number', value: numKvb }
			],
			[
				{ type: 'String', value: 'Cash Balance' },
				{ type: 'Number', value: numCash }
			],
			[
				{ type: 'String', value: 'My Credit (Owed by Others)' },
				{ type: 'Number', value: numCredits }
			],
			[
				{ type: 'String', value: 'Total Actual Money', bold: true },
				{ type: 'Number', value: actualMoney, bold: true }
			],
			[],
			[
				{ type: 'String', value: 'Net Difference' },
				{ type: 'Number', value: netDifference }
			]
		];

		const nonLiquidEntries = assets.entries.filter(
			(e) => e.id !== 'asset_liquid' && e.name.toLowerCase() !== 'liquid'
		);
		let totalAssetsValue = ledgerNet;
		let latestAssetTs = latestTxTs;
		if (assets.history.length > 0) {
			latestAssetTs = Math.max(latestAssetTs, assets.history[assets.history.length - 1].timestamp);
		}

		const assetRows: CellDef[][] = [
			[
				{ type: 'String', value: 'Asset', bold: true },
				{ type: 'String', value: 'Latest Value', bold: true },
				{ type: 'String', value: 'Last Updated', bold: true }
			],
			[
				{ type: 'String', value: 'Liquid' },
				{ type: 'Number', value: ledgerNet },
				{ type: 'String', value: formatDateTime(latestTxTs || undefined) }
			],
			...nonLiquidEntries.map((entry): CellDef[] => {
				totalAssetsValue += entry.final;
				if (entry.updatedAt && entry.updatedAt > latestAssetTs) {
					latestAssetTs = entry.updatedAt;
				}
				return [
					{ type: 'String', value: entry.name },
					{ type: 'Number', value: entry.final },
					{ type: 'String', value: formatDateTime(entry.updatedAt) }
				];
			}),
			[],
			[
				{ type: 'String', value: 'Total Assets Valuation', bold: true },
				{ type: 'Number', value: totalAssetsValue, bold: true },
				{ type: 'String', value: formatDateTime(latestAssetTs || undefined), bold: true }
			]
		];

		const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
   <Style ss:ID="BoldStyle">
     <Font ss:Bold="1"/>
   </Style>
 </Styles>
${buildWorksheetXml('Ledger', ledgerRows)}
${buildWorksheetXml('Reconciliation', reconRows)}
${buildWorksheetXml('Assets', assetRows)}
</Workbook>`;

		const filename = `financy_export_${Date.now()}.xls`;
		return new Response(xmlContent, {
			headers: {
				'Content-Type': 'application/vnd.ms-excel',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Export failed';
		return json({ success: false, error: message }, { status: 500 });
	}
};
