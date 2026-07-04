import { useState, useEffect, useCallback } from 'react';
import { DatabaseService, LocalTransaction } from '@/services/database';

export function useLocalLedger() {
  const [localTransactions, setLocalTransactions] = useState<LocalTransaction[]>([]);
  const [localIds, setLocalIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const refreshLocalLedger = useCallback(() => {
    try {
      const txs = DatabaseService.getTransactions();
      setLocalTransactions(txs);
      setLocalIds(new Set(txs.map(t => t.id)));
    } catch (e) {
      console.error('Failed to refresh local database:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshLocalLedger();
  }, [refreshLocalLedger]);

  const saveTransaction = useCallback((tx: LocalTransaction) => {
    DatabaseService.saveTransaction(tx);
    refreshLocalLedger();
  }, [refreshLocalLedger]);

  const deleteTransaction = useCallback((id: string) => {
    DatabaseService.deleteTransaction(id);
    refreshLocalLedger();
  }, [refreshLocalLedger]);

  return {
    localTransactions,
    localIds,
    isLoading,
    refreshLocalLedger,
    saveTransaction,
    deleteTransaction,
  };
}
