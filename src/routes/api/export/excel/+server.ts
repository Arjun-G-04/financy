import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransactions, getSettings, type LocalTransaction } from '#lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		const [transactions, settings] = await Promise.all([
			getTransactions(),
			getSettings()
		]);

		const escapeXml = (str: string) => {
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
		};

		let ledgerCredit = 0;
		let ledgerDebit = 0;
		transactions.forEach((tx: LocalTransaction) => {
			if (tx.type === 'credit') {
				ledgerCredit += tx.amount;
			} else {
				ledgerDebit += tx.amount;
			}
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

		let ledgerRows = '';
		transactions.forEach((tx: LocalTransaction) => {
			const date = escapeXml(tx.date);
			const name = escapeXml(tx.name);
			const category = tx.category ? escapeXml(tx.category) : '';
			const type = escapeXml(tx.type);
			const amount = tx.amount;

			ledgerRows += `\n   <Row>
    <Cell><Data ss:Type="String">${date}</Data></Cell>
    <Cell><Data ss:Type="String">${name}</Data></Cell>
    <Cell><Data ss:Type="String">${category}</Data></Cell>
    <Cell><Data ss:Type="String">${type}</Data></Cell>
    <Cell><Data ss:Type="Number">${amount}</Data></Cell>
   </Row>`;
		});

		const reconRows = `
   <Row>
     <Cell><Data ss:Type="String">Last Reconciled Timestamp</Data></Cell>
     <Cell><Data ss:Type="String">${escapeXml(r.lastUpdated || 'N/A')}</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
     <Cell ss:StyleID="BoldStyle"><Data ss:Type="String">Metric</Data></Cell>
     <Cell ss:StyleID="BoldStyle"><Data ss:Type="String">Value</Data></Cell>
   </Row>
   <Row>
     <Cell><Data ss:Type="String">Ledger Net Balance</Data></Cell>
     <Cell><Data ss:Type="Number">${ledgerNet.toFixed(2)}</Data></Cell>
   </Row>
   <Row>
     <Cell><Data ss:Type="String">Credit Card Unpaid Bill (CC Debt)</Data></Cell>
     <Cell><Data ss:Type="Number">${numCcDebt.toFixed(2)}</Data></Cell>
   </Row>
   <Row>
     <Cell ss:StyleID="BoldStyle"><Data ss:Type="String">Total Theoretical Money</Data></Cell>
     <Cell ss:StyleID="BoldStyle"><Data ss:Type="Number">${theoreticalMoney.toFixed(2)}</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
     <Cell><Data ss:Type="String">HDFC Bank Balance</Data></Cell>
     <Cell><Data ss:Type="Number">${numHdfc.toFixed(2)}</Data></Cell>
   </Row>
   <Row>
     <Cell><Data ss:Type="String">KVB Bank Balance</Data></Cell>
     <Cell><Data ss:Type="Number">${numKvb.toFixed(2)}</Data></Cell>
   </Row>
   <Row>
     <Cell><Data ss:Type="String">Cash Balance</Data></Cell>
     <Cell><Data ss:Type="Number">${numCash.toFixed(2)}</Data></Cell>
   </Row>
   <Row>
     <Cell><Data ss:Type="String">My Credit (Owed by Others)</Data></Cell>
     <Cell><Data ss:Type="Number">${numCredits.toFixed(2)}</Data></Cell>
   </Row>
   <Row>
     <Cell ss:StyleID="BoldStyle"><Data ss:Type="String">Total Actual Money</Data></Cell>
     <Cell ss:StyleID="BoldStyle"><Data ss:Type="Number">${actualMoney.toFixed(2)}</Data></Cell>
   </Row>
   <Row></Row>
   <Row>
     <Cell><Data ss:Type="String">Net Difference</Data></Cell>
     <Cell><Data ss:Type="Number">${netDifference.toFixed(2)}</Data></Cell>
   </Row>`;

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
 <Worksheet ss:Name="Ledger">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">Date</Data></Cell>
    <Cell><Data ss:Type="String">Name</Data></Cell>
    <Cell><Data ss:Type="String">Category</Data></Cell>
    <Cell><Data ss:Type="String">Type</Data></Cell>
    <Cell><Data ss:Type="String">Amount</Data></Cell>
   </Row>${ledgerRows}
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Reconciliation">
  <Table>${reconRows}
  </Table>
 </Worksheet>
</Workbook>`;

		const filename = `financy_export_${Date.now()}.xls`;
		return new Response(xmlContent, {
			headers: {
				'Content-Type': 'application/vnd.ms-excel',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (error: any) {
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
