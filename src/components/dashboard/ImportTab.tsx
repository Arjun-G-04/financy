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
import { Svg, Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { useSheetsSync } from '@/hooks/useSheetsSync';
import { CustomDatePicker } from './CustomDatePicker';
import { ImportTransactionModal } from './ImportTransactionModal';
import { getCategoryColor } from '@/utils/category';




interface ImportTabProps {
  spreadsheetId: string;
  currencySymbol: string;
  localIds: Set<string>;
  onImportSuccess: () => void;
  setActiveTab: (tab: 'home' | 'import' | 'settings') => void;
}

const fontTitle = 'Outfit-Bold';
const fontLight = 'Outfit-Regular';
const fontNumber = 'SpaceMono-Bold';
const fontNumberRegular = 'SpaceMono-Regular';

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

  const handleConfirmImport = (customName: string, category: string | null) => {
    if (!activeImportTx) return;

    try {
      const localTx: LocalTransaction = {
        id: activeImportTx.id, // Keep matching ID to prevent duplicate imports
        date: activeImportTx.date,
        type: activeImportTx.type,
        amount: activeImportTx.amount,
        name: customName,
        category: category,
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
      <Text style={[styles.pageHeading, { color: colors.text }]}>Import Ledger</Text>
      
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
              <Text style={[styles.datePickerText, { color: startDate ? colors.text : colors.textSecondary }]}>
                {startDate || 'Select Date'}
              </Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M8 7V3M16 7V3M3 11H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z" stroke={colors.textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
              <Text style={[styles.datePickerText, { color: endDate ? colors.text : colors.textSecondary }]}>
                {endDate || 'Select Date'}
              </Text>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path d="M8 7V3M16 7V3M3 11H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z" stroke={colors.textSecondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
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
            const catColor = getCategoryColor(tx.merchant || 'Sheet');
            const initial = tx.merchant ? tx.merchant.charAt(0).toUpperCase() : 'S';
            
            return (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.sheetTxRow,
                  { backgroundColor: colors.background },
                  isAlreadyImported && { opacity: 0.55 },
                ]}
                onPress={() => !isAlreadyImported && handleSelectImportTx(tx)}
                disabled={isAlreadyImported}
                activeOpacity={0.7}
              >
                {/* Category accent gradient */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Svg height="100%" width="100%">
                    <Defs>
                      <RadialGradient id={`rowGrad${tx.id}`} cx="0%" cy="50%" rx="90%" ry="140%">
                        <Stop offset="0%" stopColor={catColor} stopOpacity="0.14" />
                        <Stop offset="100%" stopColor={catColor} stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill={`url(#rowGrad${tx.id})`} />
                  </Svg>
                </View>

                <View style={styles.sheetTxRowContent}>
                  {/* Visual Initials Circle */}
                  <View style={[styles.avatarCircle, { backgroundColor: catColor + '20' }]}>
                    <Text style={[styles.avatarText, { color: catColor }]}>{initial}</Text>
                  </View>

                  <View style={{ flex: 1, paddingRight: Spacing.two }}>
                    <Text style={[styles.sheetMerchant, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                      {tx.merchant}
                    </Text>
                    <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                      {tx.date.split('-').slice(1).reverse().join('/')}
                    </Text>
                  </View>
                  
                  <View style={styles.sheetTxRight}>
                    <Text style={[styles.sheetAmount, { color: tx.type === 'credit' ? colors.emerald : colors.rose }]}>
                      {currencySymbol}{tx.amount.toFixed(2)}
                    </Text>
                    
                    <View style={[styles.importedBadge, { backgroundColor: colors.backgroundSelected }]}>
                      <Text style={[styles.importedBadgeText, { color: isAlreadyImported ? colors.textSecondary : colors.text }]}>
                        {isAlreadyImported ? 'Imported' : 'Import'}
                      </Text>
                    </View>
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
  pageHeading: {
    fontFamily: fontTitle,
    fontSize: 24,
    letterSpacing: -0.6,
    marginBottom: 8,
    marginTop: 8,
  },
  viewSection: {
    width: '100%',
    gap: Spacing.three,
  },
  filterCard: {
    borderRadius: 4,
    padding: 20,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontFamily: fontTitle,
    fontSize: 16,
    letterSpacing: -0.4,
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
    fontFamily: fontTitle,
    fontSize: 12,
    letterSpacing: -0.1,
  },
  datePickerTrigger: {
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontFamily: fontNumberRegular,
    fontSize: 14,
  },
  errorText: {
    fontFamily: fontLight,
    fontSize: 13,
  },
  primaryButton: {
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonText: {
    fontFamily: fontTitle,
    fontSize: 14,
  },
  listContainer: {
    width: '100%',
    marginTop: Spacing.two,
    gap: 12,
  },
  listHeader: {
    fontFamily: fontTitle,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.one,
  },
  emptyState: {
    padding: Spacing.three,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontFamily: fontLight,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  sheetTxRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
  },
  sheetTxRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  avatarText: {
    fontFamily: fontTitle,
    fontSize: 14,
  },
  sheetMerchant: {
    fontFamily: fontTitle,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  sheetSub: {
    fontFamily: fontNumberRegular,
    fontSize: 12,
    marginTop: 4,
  },
  sheetTxRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minWidth: 80,
    gap: Spacing.one,
  },
  sheetAmount: {
    fontFamily: fontNumber,
    fontSize: 15,
    letterSpacing: -0.3,
    textAlign: 'right',
  },
  importedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  importedBadgeText: {
    fontFamily: fontTitle,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
