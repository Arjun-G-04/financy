import { useState, useCallback } from 'react';
import { GoogleAuthService } from '@/services/googleAuth';
import { GoogleSheetsService, SheetTransaction } from '@/services/googleSheets';
import { DatabaseService } from '@/services/database';
import Toast from 'react-native-toast-message';

interface UseSheetsSyncProps {
  spreadsheetId: string;
  onSuccess?: () => void;
  setActiveTab?: (tab: 'home' | 'import' | 'settings') => void;
}

export function useSheetsSync({ spreadsheetId, onSuccess, setActiveTab }: UseSheetsSyncProps) {
  const [startDate, setStartDate] = useState(() => {
    try {
      const txs = DatabaseService.getTransactions();
      if (txs.length > 0) {
        return txs[0].date;
      }
    } catch (e) {
      console.error('Failed to get transactions for default start date:', e);
    }
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [sheetTransactions, setSheetTransactions] = useState<SheetTransaction[]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchSheetData = useCallback(async () => {
    if (!spreadsheetId.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Configuration Missing',
        text2: 'Save a spreadsheet ID in settings first.',
      });
      if (setActiveTab) {
        setActiveTab('settings');
      }
      return;
    }

    if (!startDate || !endDate) {
      Toast.show({
        type: 'error',
        text1: 'Date Filter Required',
        text2: 'Please select a date range before querying.',
      });
      return;
    }

    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/) || !endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setImportError('Dates must be in YYYY-MM-DD format');
      return;
    }

    setLoadingSheet(true);
    setImportError(null);

    try {
      const accessToken = await GoogleAuthService.getFreshAccessToken();
      
      // Fetches and processes only rows within the selected date range
      const result = await GoogleSheetsService.getTransactionsFromSheet(
        spreadsheetId.trim(),
        accessToken,
        startDate,
        endDate
      );
      
      const filtered = result.transactions;
      
      // Sort: latest dates first
      filtered.sort((a, b) => b.date.localeCompare(a.date));

      setSheetTransactions(filtered);
      
      Toast.show({
        type: 'success',
        text1: 'Sync Complete',
        text2: `Synced ${filtered.length} rows in selected range.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (e: any) {
      console.error(e);
      setImportError(e.message || 'Failed to fetch spreadsheet transactions');
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: e.message || 'Error connecting to Google Sheet',
      });
    } finally {
      setLoadingSheet(false);
    }
  }, [spreadsheetId, startDate, endDate, onSuccess, setActiveTab]);

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sheetTransactions,
    setSheetTransactions,
    loadingSheet,
    importError,
    setImportError,
    fetchSheetData,
  };
}
