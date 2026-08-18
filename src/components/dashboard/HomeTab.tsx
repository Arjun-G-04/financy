import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { LocalTransaction, DatabaseService, Category } from '@/services/database';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { Svg, Path } from 'react-native-svg';
import Toast from 'react-native-toast-message';
import { SwipeableLedgerRow } from './SwipeableLedgerRow';
import { TransactionFormModal } from './TransactionFormModal';
import { CategoryFilterModal } from './CategoryFilterModal';
import { getCategoryColor } from '@/utils/category';

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

type MonthDividerItem = {
  type: 'month_divider';
  id: string;
  title: string;
};

type DayDividerItem = {
  type: 'day_divider';
  id: string;
  title: string;
};

type TransactionItem = {
  type: 'transaction';
  id: string;
  tx: LocalTransaction;
};

type LedgerListItem = MonthDividerItem | DayDividerItem | TransactionItem;

const PAGE_SIZE = 25;

const formatMonthHeader = (dateStr: string) => {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = new Date(y, m, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatDayHeader = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const txDate = new Date(y, m, d);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(y, m, d);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - targetDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dayOfWeek = txDate.toLocaleDateString('en-US', { weekday: 'short' });
  const monthName = txDate.toLocaleDateString('en-US', { month: 'short' });

  if (diffDays === 0) {
    return `Today · ${d} ${monthName}`;
  } else if (diffDays === 1) {
    return `Yesterday · ${d} ${monthName}`;
  } else {
    return `${dayOfWeek} · ${d} ${monthName}`;
  }
};

import { formatIndianNumber } from '@/utils/format';

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

  // Pagination state for lazy loading
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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

  // Category filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [showCategoryFilterModal, setShowCategoryFilterModal] = useState(false);

  useEffect(() => {
    try {
      const cats = DatabaseService.getCategories();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load categories in HomeTab:', e);
    }
  }, [showForm]);

  // Derived list of all distinct categories & counts from localTransactions
  const { allAvailableCategoryNames, categoryCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    const catSet = new Set<string>();
    for (const tx of localTransactions) {
      const cat = tx.category?.trim() || 'Uncategorized';
      catSet.add(cat);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return {
      allAvailableCategoryNames: Array.from(catSet).sort(),
      categoryCounts: counts,
    };
  }, [localTransactions]);

  // Filtered transactions based on active category filter
  const filteredTransactions = useMemo(() => {
    if (!selectedCategoryFilter) return localTransactions;
    return localTransactions.filter(
      (tx) => (tx.category?.trim() || 'Uncategorized') === selectedCategoryFilter
    );
  }, [localTransactions, selectedCategoryFilter]);

  const handleLoadMore = () => {
    if (visibleCount < filteredTransactions.length) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredTransactions.length));
    }
  };

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
      const existing = editingTxId ? localTransactions.find(t => t.id === editingTxId) : null;
      const newTx: LocalTransaction = {
        id: editingTxId || `manual_${Date.now()}`,
        date: manualDate,
        type: manualType,
        amount: amt,
        name: manualName.trim(),
        category: manualCategory,
        createdAt: existing?.createdAt ?? Date.now(),
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
                text2: 'Transaction removed from ledger',
              });
            } catch {
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: 'Could not remove transaction',
              });
            } finally {
              if (onResolve) onResolve();
            }
          },
        },
      ]
    );
  };

  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'credit') {
        credit += t.amount;
      } else {
        debit += t.amount;
      }
    });
    return { credit, debit, net: credit - debit };
  }, [filteredTransactions]);

  // Grouped list with Month & Day Dividers, sliced by visibleCount for lazy loading
  const visibleTransactions = useMemo(() => {
    return filteredTransactions.slice(0, visibleCount);
  }, [filteredTransactions, visibleCount]);

  const groupedListItems = useMemo<LedgerListItem[]>(() => {
    const items: LedgerListItem[] = [];
    let currentMonth = '';
    let currentDay = '';

    for (const tx of visibleTransactions) {
      const txMonth = tx.date ? tx.date.substring(0, 7) : '';
      const txDay = tx.date || '';

      if (txMonth && txMonth !== currentMonth) {
        currentMonth = txMonth;
        items.push({
          type: 'month_divider',
          id: `month_${txMonth}`,
          title: formatMonthHeader(tx.date),
        });
        currentDay = '';
      }

      if (txDay && txDay !== currentDay) {
        currentDay = txDay;
        items.push({
          type: 'day_divider',
          id: `day_${txDay}`,
          title: formatDayHeader(tx.date),
        });
      }

      items.push({
        type: 'transaction',
        id: tx.id,
        tx,
      });
    }

    return items;
  }, [visibleTransactions]);

  const renderItem = ({ item }: { item: LedgerListItem }) => {
    if (item.type === 'month_divider') {
      return (
        <View style={styles.monthDividerContainer}>
          <View style={[styles.monthDividerLine, { backgroundColor: colors.backgroundSelected }]} />
          <View style={[styles.monthDividerBadge, { backgroundColor: colors.backgroundElement, borderColor: colors.backgroundSelected }]}>
            <Text style={[styles.monthDividerText, { color: colors.textSecondary }]}>
              {item.title}
            </Text>
          </View>
          <View style={[styles.monthDividerLine, { backgroundColor: colors.backgroundSelected }]} />
        </View>
      );
    }

    if (item.type === 'day_divider') {
      return (
        <View style={styles.dayDividerContainer}>
          <Text style={[styles.dayDividerText, { color: colors.textSecondary }]}>
            {item.title}
          </Text>
          <View style={[styles.dayDividerLine, { backgroundColor: colors.backgroundSelected }]} />
        </View>
      );
    }

    const { tx } = item;
    const catColor = tx.category ? getCategoryColor(tx.category) : '#94A3B8';
    const initial = tx.category ? tx.category.charAt(0).toUpperCase() : (tx.name ? tx.name.charAt(0).toUpperCase() : 'T');

    return (
      <View style={styles.transactionItemWrapper}>
        <SwipeableLedgerRow
          tx={tx}
          colors={colors}
          currencySymbol={currencySymbol}
          catColor={catColor}
          initial={initial}
          handleStartEdit={handleStartEdit}
          handleDeleteLocalTx={handleDeleteLocalTx}
          editingTxId={editingTxId}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
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

      {/* Compact Category Filter Modal */}
      <CategoryFilterModal
        visible={showCategoryFilterModal}
        onClose={() => setShowCategoryFilterModal(false)}
        categories={allAvailableCategoryNames}
        selectedCategory={selectedCategoryFilter}
        onSelectCategory={setSelectedCategoryFilter}
        colors={colors}
        categoryCounts={categoryCounts}
        totalCount={localTransactions.length}
      />

      <FlatList
        data={groupedListItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Financial Dashboard Summary Card */}
            <View style={[styles.dashboardCard, { backgroundColor: 'transparent' }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.dashboardCardLabel, { color: colors.textSecondary }]}>
                  {selectedCategoryFilter ? `Net (${selectedCategoryFilter})` : 'Net Balance'}
                </Text>

                {/* Subtle, compact Category Filter Button */}
                <TouchableOpacity
                  style={[
                    styles.categoryFilterBtn,
                    {
                      backgroundColor: selectedCategoryFilter
                        ? colors.backgroundSelected
                        : colors.backgroundElement,
                      borderColor: selectedCategoryFilter
                        ? getCategoryColor(selectedCategoryFilter)
                        : colors.backgroundSelected,
                    },
                  ]}
                  onPress={() => setShowCategoryFilterModal(true)}
                  activeOpacity={0.7}
                >
                  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 6h18M6 12h12m-9 6h6"
                      stroke={selectedCategoryFilter ? colors.emerald : colors.textSecondary}
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text
                    style={[
                      styles.categoryFilterBtnText,
                      { color: selectedCategoryFilter ? colors.text : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedCategoryFilter || 'Filter'}
                  </Text>
                  {selectedCategoryFilter && (
                    <TouchableOpacity
                      onPress={(e: any) => {
                        e.stopPropagation();
                        setSelectedCategoryFilter(null);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.filterClearCrossBtn}
                    >
                      <Text style={[styles.filterClearCross, { color: colors.rose }]}>✕</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.balanceValueContainer}>
                <Text style={[styles.dashboardCardValue, { color: totals.net >= 0 ? colors.emerald : colors.rose }]}>
                  {currencySymbol}{formatIndianNumber(Math.abs(totals.net))}
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
                      {currencySymbol}{formatIndianNumber(totals.credit)}
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
                      {currencySymbol}{formatIndianNumber(totals.debit)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              {selectedCategoryFilter
                ? `No transactions found under category "${selectedCategoryFilter}".`
                : 'No transactions recorded. Go to "Import" to fetch from sheet or use the FAB in the bottom right corner to add manual records.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          visibleTransactions.length < filteredTransactions.length && filteredTransactions.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
            </View>
          ) : (
            <View style={styles.listBottomSpacing} />
          )
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={11}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  flatListContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  headerContainer: {
    width: '100%',
    marginBottom: 8,
  },
  dashboardCard: {
    borderRadius: 4,
    paddingTop: 16,
    paddingBottom: 12,
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
  monthDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  monthDividerLine: {
    flex: 1,
    height: 1,
  },
  monthDividerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  monthDividerText: {
    fontFamily: fontTitle,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dayDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 6,
    gap: 8,
  },
  dayDividerLine: {
    flex: 1,
    height: 1,
  },
  dayDividerText: {
    fontFamily: fontTitle,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  transactionItemWrapper: {
    marginBottom: 8,
  },
  emptyState: {
    padding: Spacing.three,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  emptyStateText: {
    fontFamily: fontLight,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBottomSpacing: {
    height: 32,
  },
  categoryFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    maxWidth: 160,
  },
  categoryFilterBtnText: {
    fontFamily: fontTitle,
    fontSize: 10,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  filterClearCrossBtn: {
    marginLeft: 2,
    paddingHorizontal: 2,
  },
  filterClearCross: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
