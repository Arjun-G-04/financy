import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  useColorScheme,
} from 'react-native';
import { LocalTransaction, DatabaseService, Category } from '@/services/database';
import { Colors, Spacing } from '@/constants/theme';
import { Svg, Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { SwipeableLedgerRow } from './SwipeableLedgerRow';
import { TransactionFormModal } from './TransactionFormModal';

interface HomeTabProps {
  localTransactions: LocalTransaction[];
  currencySymbol: string;
  saveTransaction: (tx: LocalTransaction) => void;
  deleteTransaction: (id: string) => void;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
}

const fontTitle = 'Outfit-Bold';
const fontLight = 'Outfit-Regular';
const fontNumber = 'SpaceMono-Bold';

// Generate stable category color based on name hash
const getCategoryColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorsList = [
    '#38BDF8', // sky
    '#34D399', // emerald
    '#FB7185', // rose
    '#FBBF24', // amber
    '#C084FC', // purple
    '#F472B6', // pink
    '#FB923C', // orange
    '#2DD4BF', // teal
  ];
  const index = Math.abs(hash) % colorsList.length;
  return colorsList[index];
};

export function HomeTab({
  localTransactions,
  currencySymbol,
  saveTransaction,
  deleteTransaction,
  showForm,
  setShowForm,
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
  const [manualCategory, setManualCategory] = useState<string | null>(null);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Available categories
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    try {
      const cats = DatabaseService.getCategories();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load categories in HomeTab:', e);
    }
  }, [showForm]);

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
        category: manualCategory,
      };

      saveTransaction(newTx);
      
      // Reset inputs (keep date)
      setManualAmount('');
      setManualName('');
      setManualCategory(null);
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
    setManualCategory(tx.category || null);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingTxId(null);
    setShowForm(false);
    setManualAmount('');
    setManualName('');
    setManualCategory(null);
    const today = new Date();
    const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setManualDate(formatted);
  };

  const handleDeleteLocalTx = (id: string, onResolve?: () => void) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this transaction locally?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            if (onResolve) onResolve();
          }
        },
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
            } finally {
              if (onResolve) onResolve();
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
      <View style={[styles.dashboardCard, { backgroundColor: 'transparent' }]}>
        {/* Card Content */}
        <View style={styles.cardHeader}>
          <Text style={[styles.dashboardCardLabel, { color: colors.textSecondary }]}>Net Balance</Text>
        </View>

        <View style={styles.balanceValueContainer}>
          <Text style={[styles.dashboardCardValue, { color: totals.net >= 0 ? colors.emerald : colors.rose }]}>
            {currencySymbol}{Math.abs(totals.net).toFixed(2)}
          </Text>
        </View>

        {/* Sub metrics — accent chip cards */}
        <View style={styles.subMetrics}>
          <View style={[styles.metricChip, { backgroundColor: colors.emerald + '0D' }]}>
            <View style={styles.metricChipBody}>
              <View style={styles.metricHeader}>
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" style={{ marginRight: 3 }}>
                  <Path d="M12 19V5M12 5L5 12M12 5L19 12" stroke={colors.emerald} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
                <Text style={[styles.metricLabel, { color: colors.emerald + 'CC' }]}>Income</Text>
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {currencySymbol}{totals.credit.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={[styles.metricChip, { backgroundColor: colors.rose + '0D' }]}>
            <View style={styles.metricChipBody}>
              <View style={styles.metricHeader}>
                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" style={{ marginRight: 3 }}>
                  <Path d="M12 5V19M12 19L5 12M12 19L19 12" stroke={colors.rose} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </Svg>
                <Text style={[styles.metricLabel, { color: colors.rose + 'CC' }]}>Expense</Text>
              </View>
              <Text style={[styles.metricValue, { color: colors.rose }]}>
                {currencySymbol}{totals.debit.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Manual Entry Form Dialog Modal */}
      <TransactionFormModal
        showForm={showForm}
        setShowForm={setShowForm}
        editingTxId={editingTxId}
        handleCancelEdit={handleCancelEdit}
        colors={colors}
        currencySymbol={currencySymbol}
        manualDate={manualDate}
        setManualDate={setManualDate}
        manualType={manualType}
        setManualType={setManualType}
        manualAmount={manualAmount}
        setManualAmount={setManualAmount}
        manualName={manualName}
        setManualName={setManualName}
        manualCategory={manualCategory}
        setManualCategory={setManualCategory}
        categories={categories}
        handleSaveManualEntry={handleSaveManualEntry}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
      />

      {/* Local Ledger List */}
      <View style={styles.listContainer}>
        {localTransactions.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              No transactions recorded. Go to &quot;Import&quot; to fetch from sheet or use the FAB in the bottom right corner to add manual records.
            </Text>
          </View>
        ) : (
          localTransactions.map(tx => {
            const catColor = tx.category ? getCategoryColor(tx.category) : '#94A3B8';
            const initial = tx.category ? tx.category.charAt(0).toUpperCase() : (tx.name ? tx.name.charAt(0).toUpperCase() : 'T');
            
            return (
              <SwipeableLedgerRow
                key={tx.id}
                tx={tx}
                colors={colors}
                currencySymbol={currencySymbol}
                catColor={catColor}
                initial={initial}
                handleStartEdit={handleStartEdit}
                handleDeleteLocalTx={handleDeleteLocalTx}
                editingTxId={editingTxId}
              />
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewSection: {
    width: '100%',
    gap: 8,
  },
  dashboardCard: {
    borderRadius: 4,
    padding: 20,
    gap: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 0,
  },
  dashboardCardLabel: {
    fontFamily: fontTitle,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  balanceValueContainer: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  dashboardCardValue: {
    fontFamily: fontNumber,
    fontSize: 40,
    letterSpacing: -1.5,
  },
  subMetrics: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metricChip: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricChipBody: {
    flex: 1,
    padding: 8,
    gap: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: fontTitle,
    fontSize: 10,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontFamily: fontNumber,
    fontSize: 15,
    letterSpacing: -0.4,
  },
  listContainer: {
    width: '100%',
    marginTop: 0,
    gap: 12,
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
});
