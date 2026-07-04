import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SheetTransaction } from '@/services/googleSheets';
import { LocalTransaction, DatabaseService } from '@/services/database';
import { Colors, Spacing } from '@/constants/theme';
import { Svg, Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { useSheetsSync } from '@/hooks/useSheetsSync';
import { CustomDatePicker } from './CustomDatePicker';
import { ImportTransactionModal } from './ImportTransactionModal';

interface ImportTabProps {
  spreadsheetId: string;
  currencySymbol: string;
  localIds: Set<string>;
  onImportSuccess: () => void;
  setActiveTab: (tab: 'home' | 'import' | 'settings') => void;
}

export function ImportTab({
  spreadsheetId,
  currencySymbol,
  localIds,
  onImportSuccess,
  setActiveTab,
}: ImportTabProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];

  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sheetTransactions,
    loadingSheet,
    importError,
    fetchSheetData,
  } = useSheetsSync({ spreadsheetId, setActiveTab });

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end'>('start');

  // Import modal states
  const [activeImportTx, setActiveImportTx] = useState<SheetTransaction | null>(null);

  const openDatePicker = (target: 'start' | 'end') => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };

  const handleSelectDate = (dateStr: string) => {
    if (datePickerTarget === 'start') {
      setStartDate(dateStr);
    } else {
      setEndDate(dateStr);
    }
  };

  const handleSelectImportTx = (tx: SheetTransaction) => {
    setActiveImportTx(tx);
  };

  const handleConfirmImport = (customName: string) => {
    if (!activeImportTx) return;

    try {
      const localTx: LocalTransaction = {
        id: activeImportTx.id, // Keep matching ID to prevent duplicate imports
        date: activeImportTx.date,
        type: activeImportTx.type,
        amount: activeImportTx.amount,
        name: customName,
      };

      DatabaseService.saveTransaction(localTx);
      
      // Close overlay
      setActiveImportTx(null);
      
      // Refresh local databases via parent callback
      onImportSuccess();

      Toast.show({
        type: 'success',
        text1: 'Import Success',
        text2: 'Recorded to local ledger',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Database Error',
        text2: 'Failed to import transaction',
      });
    }
  };

  return (
    <View style={styles.viewSection}>
      {/* Date Filters & Fetch Control */}
      <View style={[styles.filterCard, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sheet Query Dates</Text>
        
        <View style={styles.formRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Start Date</Text>
            <TouchableOpacity
              style={[styles.datePickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
              onPress={() => openDatePicker('start')}
              activeOpacity={0.7}
            >
              <Text style={{ color: startDate ? colors.text : colors.textSecondary }}>
                {startDate || 'Select Date'}
              </Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M8 7V3M16 7V3M3 11H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
          </View>

          <View style={{ width: Spacing.two }} />

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>End Date</Text>
            <TouchableOpacity
              style={[styles.datePickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
              onPress={() => openDatePicker('end')}
              activeOpacity={0.7}
            >
              <Text style={{ color: endDate ? colors.text : colors.textSecondary }}>
                {endDate || 'Select Date'}
              </Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M8 7V3M16 7V3M3 11H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {importError && (
          <Text style={[styles.errorText, { color: '#F43F5E' }]}>{importError}</Text>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.text }]}
          onPress={fetchSheetData}
          disabled={loadingSheet}
          activeOpacity={0.8}
        >
          {loadingSheet ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={[styles.primaryButtonText, { color: colors.background }]}>Fetch Sheet Data</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        <Text style={[styles.listHeader, { color: colors.textSecondary }]}>
          Transactions on Sheet ({sheetTransactions.length})
        </Text>

        {sheetTransactions.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {loadingSheet ? 'Loading transactions from Google Sheets...' : 'No transactions loaded for this date range. Click "Fetch Sheet Data" to pull entries.'}
            </Text>
          </View>
        ) : (
          sheetTransactions.map(tx => {
            const isAlreadyImported = localIds.has(tx.id);
            return (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.sheetTxRow,
                  { borderBottomColor: colors.backgroundElement },
                  isAlreadyImported && { opacity: 0.55 },
                ]}
                onPress={() => !isAlreadyImported && handleSelectImportTx(tx)}
                disabled={isAlreadyImported}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1, paddingRight: Spacing.two }}>
                  <Text style={[styles.sheetMerchant, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {tx.merchant}
                  </Text>
                  <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                    {tx.date} • {tx.type === 'credit' ? 'Credit' : 'Debit'}
                  </Text>
                </View>
                
                <View style={styles.sheetTxRight}>
                  <Text style={[styles.sheetAmount, { color: colors.text }]}>
                    {tx.type === 'credit' ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(2)}
                  </Text>
                  
                  <View style={[styles.importedBadge, { backgroundColor: colors.backgroundSelected }]}>
                    <Text style={[styles.importedBadgeText, { color: isAlreadyImported ? colors.textSecondary : colors.text }]}>
                      {isAlreadyImported ? 'Imported' : 'Import'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <CustomDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={datePickerTarget === 'start' ? startDate : endDate}
        onSelect={handleSelectDate}
      />

      <ImportTransactionModal
        key={activeImportTx?.id || 'empty'}
        transaction={activeImportTx}
        onClose={() => setActiveImportTx(null)}
        onConfirm={handleConfirmImport}
        currencySymbol={currencySymbol}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewSection: {
    width: '100%',
    gap: Spacing.four,
  },
  filterCard: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  formRow: {
    flexDirection: 'row',
    width: '100%',
  },
  inputGroup: {
    gap: Spacing.one,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  datePickerTrigger: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    width: '100%',
    marginTop: Spacing.two,
  },
  listHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
  },
  emptyState: {
    padding: Spacing.four,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  sheetTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  sheetMerchant: {
    fontSize: 15,
    fontWeight: '600',
  },
  sheetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sheetTxRight: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  sheetAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  importedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  importedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
