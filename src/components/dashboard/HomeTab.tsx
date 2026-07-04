import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { LocalTransaction } from '@/services/database';
import { Colors, Spacing } from '@/constants/theme';
import { Svg, Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { CustomDatePicker } from './CustomDatePicker';

interface HomeTabProps {
  localTransactions: LocalTransaction[];
  currencySymbol: string;
  saveTransaction: (tx: LocalTransaction) => void;
  deleteTransaction: (id: string) => void;
}

export function HomeTab({
  localTransactions,
  currencySymbol,
  saveTransaction,
  deleteTransaction,
}: HomeTabProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];
  
  // Manual Entry Form state
  const [manualDate, setManualDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [manualType, setManualType] = useState<'credit' | 'debit'>('debit');
  const [manualAmount, setManualAmount] = useState('');
  const [manualName, setManualName] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSaveManualEntry = () => {
    if (!manualDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Date must be in YYYY-MM-DD format',
      });
      return;
    }
    const amt = parseFloat(manualAmount);
    if (isNaN(amt) || amt <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please enter a valid positive amount',
      });
      return;
    }
    if (!manualName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please enter a transaction name',
      });
      return;
    }

    try {
      const newTx: LocalTransaction = {
        id: editingTxId || `manual_${Date.now()}`,
        date: manualDate,
        type: manualType,
        amount: amt,
        name: manualName.trim(),
      };

      saveTransaction(newTx);
      
      // Reset inputs (keep date)
      setManualAmount('');
      setManualName('');
      setEditingTxId(null);
      setShowForm(false);
      
      Toast.show({
        type: 'success',
        text1: editingTxId ? 'Transaction Updated' : 'Transaction Logged',
        text2: 'Saved to local SQLite ledger',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Database Error',
        text2: 'Failed to record local transaction',
      });
    }
  };

  const handleStartEdit = (tx: LocalTransaction) => {
    setEditingTxId(tx.id);
    setManualDate(tx.date);
    setManualType(tx.type);
    setManualAmount(tx.amount.toString());
    setManualName(tx.name);
    setShowForm(true);
    
    Toast.show({
      type: 'info',
      text1: 'Editing Mode',
      text2: 'Transaction details loaded into form above',
    });
  };

  const handleCancelEdit = () => {
    setEditingTxId(null);
    setShowForm(false);
    setManualAmount('');
    setManualName('');
    const today = new Date();
    const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setManualDate(formatted);
  };

  const handleDeleteLocalTx = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this transaction locally?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteTransaction(id);
              Toast.show({
                type: 'success',
                text1: 'Deleted',
                text2: 'Transaction removed from local ledger',
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Database Error',
                text2: 'Failed to delete transaction',
              });
            }
          },
        },
      ]
    );
  };

  const getTotals = () => {
    let credit = 0;
    let debit = 0;
    localTransactions.forEach(t => {
      if (t.type === 'credit') {
        credit += t.amount;
      } else {
        debit += t.amount;
      }
    });
    return { credit, debit, net: credit - debit };
  };

  const totals = getTotals();

  return (
    <View style={styles.viewSection}>
      {/* Financial Dashboard Summary Card */}
      <View style={[styles.dashboardCard, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.dashboardCardLabel, { color: colors.textSecondary }]}>Net Balance</Text>
        <Text style={[styles.dashboardCardValue, { color: totals.net >= 0 ? colors.text : '#F43F5E' }]}>
          {totals.net >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(totals.net).toFixed(2)}
        </Text>

        <View style={[styles.subMetrics, { borderTopColor: colors.backgroundSelected }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Credits</Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              +{currencySymbol}{totals.credit.toFixed(2)}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Debits</Text>
            <Text style={[styles.metricValue, { color: '#F43F5E' }]}>
              -{currencySymbol}{totals.debit.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {!showForm ? (
        <TouchableOpacity
          style={[styles.addTxButton, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}
          onPress={() => setShowForm(true)}
          activeOpacity={0.7}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5V19M5 12H19" stroke={colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          <Text style={[styles.addTxButtonText, { color: colors.text }]}>Add Transaction</Text>
        </TouchableOpacity>
      ) : (
        /* Manual Entry Form */
        <View style={[styles.formContainer, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {editingTxId ? 'Edit Transaction' : 'Add Transaction'}
          </Text>
          
          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date</Text>
              <TouchableOpacity
                style={[styles.datePickerTrigger, { borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={{ color: manualDate ? colors.text : colors.textSecondary }}>
                  {manualDate || 'Select Date'}
                </Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Path d="M8 7V3M16 7V3M3 11H21M5 5H19C20.1046 5 21 5.89543 21 7V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7C3 5.89543 3.89543 5 5 5Z" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
              </TouchableOpacity>
            </View>

            <View style={{ width: Spacing.two }} />

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
              <View style={styles.typeToggleContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, manualType === 'debit' && { backgroundColor: '#F43F5E' }]}
                  onPress={() => setManualType('debit')}
                >
                  <Text style={[styles.typeButtonText, { color: manualType === 'debit' ? '#ffffff' : colors.textSecondary }]}>Debit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, manualType === 'credit' && { backgroundColor: colors.text }]}
                  onPress={() => setManualType('credit')}
                >
                  <Text style={[styles.typeButtonText, { color: manualType === 'credit' ? colors.background : colors.textSecondary }]}>Credit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount ({currencySymbol})</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
              placeholder="0.00"
              placeholderTextColor={colors.textSecondary}
              value={manualAmount}
              onChangeText={setManualAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Transaction Name</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
              placeholder="e.g. Weekly Groceries"
              placeholderTextColor={colors.textSecondary}
              value={manualName}
              onChangeText={setManualName}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.text }]}
            onPress={handleSaveManualEntry}
            activeOpacity={0.8}
          >
            <Text style={[styles.primaryButtonText, { color: colors.background }]}>
              {editingTxId ? 'Update Transaction' : 'Save Transaction'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.backgroundSelected, marginTop: Spacing.two }]}
            onPress={editingTxId ? handleCancelEdit : () => setShowForm(false)}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              {editingTxId ? 'Cancel Edit' : 'Close Form'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Local Ledger List */}
      <View style={styles.listContainer}>
        <Text style={[styles.listHeader, { color: colors.textSecondary }]}>
          Local Ledger ({localTransactions.length})
        </Text>
        
        {localTransactions.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No transactions recorded. Go to &quot;Import&quot; to fetch from sheet or use the form above to add manual records.
            </Text>
          </View>
        ) : (
          localTransactions.map(tx => (
            <View key={tx.id} style={[styles.ledgerRow, { borderBottomColor: colors.backgroundElement }]}>
              <View style={{ flex: 1, paddingRight: Spacing.two }}>
                <Text style={[styles.ledgerName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {tx.name}
                </Text>
                <Text style={[styles.ledgerDate, { color: colors.textSecondary }]}>{tx.date}</Text>
              </View>
              <View style={styles.ledgerRight}>
                <Text style={[styles.ledgerAmount, { color: colors.text }]}>
                  {tx.type === 'credit' ? '+' : '-'}{currencySymbol}{tx.amount.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleStartEdit(tx)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <Path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={colors.textSecondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteLocalTx(tx.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <CustomDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={manualDate}
        onSelect={setManualDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  viewSection: {
    width: '100%',
    gap: Spacing.four,
  },
  dashboardCard: {
    borderRadius: 20,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  dashboardCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dashboardCardValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  subMetrics: {
    width: '100%',
    flexDirection: 'row',
    borderTopWidth: 1,
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  addTxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: Spacing.two,
    marginVertical: Spacing.two,
    width: '100%',
  },
  addTxButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  formContainer: {
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
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
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
  typeToggleContainer: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '700',
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
  secondaryButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  secondaryButtonText: {
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
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  ledgerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  ledgerDate: {
    fontSize: 12,
    marginTop: 2,
  },
  ledgerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  ledgerAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    padding: Spacing.one,
  },
});
