import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { LocalTransaction } from '@/services/database';
import { Colors, Spacing } from '@/constants/theme';
import { Svg, Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

interface ReconcileTabProps {
  localTransactions: LocalTransaction[];
  currencySymbol: string;
}

const fontTitle = 'Outfit-Bold';
const fontLight = 'Outfit-Regular';
const fontNumber = 'SpaceMono-Bold';

export function ReconcileTab({ localTransactions, currencySymbol }: ReconcileTabProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];

  const [isLoading, setIsLoading] = useState(true);
  const [ccDebt, setCcDebt] = useState('');
  const [hdfcBalance, setHdfcBalance] = useState('');
  const [kvbBalance, setKvbBalance] = useState('');
  const [cashBalance, setCashBalance] = useState('');
  const [creditsOwed, setCreditsOwed] = useState('');
  const [editingField, setEditingField] = useState<'ccDebt' | 'hdfc' | 'kvb' | 'cash' | 'credits' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Helper to format timestamp
  const formatTimestamp = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  // Load saved balances from SecureStore
  useEffect(() => {
    async function loadSavedBalances() {
      try {
        const [
          savedCcDebt,
          savedHdfc,
          savedKvb,
          savedCash,
          savedCredits,
          savedLastUpdated,
        ] = await Promise.all([
          SecureStore.getItemAsync('reconcile_cc_debt'),
          SecureStore.getItemAsync('reconcile_hdfc_balance'),
          SecureStore.getItemAsync('reconcile_kvb_balance'),
          SecureStore.getItemAsync('reconcile_cash_balance'),
          SecureStore.getItemAsync('reconcile_credits_owed'),
          SecureStore.getItemAsync('reconcile_last_updated'),
        ]);

        if (savedCcDebt !== null) setCcDebt(savedCcDebt);
        if (savedHdfc !== null) setHdfcBalance(savedHdfc);
        if (savedKvb !== null) setKvbBalance(savedKvb);
        if (savedCash !== null) setCashBalance(savedCash);
        if (savedCredits !== null) setCreditsOwed(savedCredits);
        if (savedLastUpdated !== null) setLastUpdated(savedLastUpdated);
      } catch (e) {
        console.error('Failed to load reconciliation balances:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSavedBalances();
  }, []);

  const getFieldDisplayName = (key: string) => {
    switch (key) {
      case 'reconcile_cc_debt': return 'Credit Card Unpaid Bill';
      case 'reconcile_hdfc_balance': return 'HDFC Bank Balance';
      case 'reconcile_kvb_balance': return 'KVB Bank Balance';
      case 'reconcile_cash_balance': return 'Cash Balance';
      case 'reconcile_credits_owed': return 'My Credit';
      default: return 'Balance';
    }
  };

  // Save a single field and update timestamp
  const handleSaveField = async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
      const now = new Date();
      const formattedDate = formatTimestamp(now);
      await SecureStore.setItemAsync('reconcile_last_updated', formattedDate);
      setLastUpdated(formattedDate);
      Toast.show({
        type: 'success',
        text1: `${getFieldDisplayName(key)} Updated`,
        text2: `Saved at ${formattedDate.split(', ')[1]}`,
      });
    } catch (e) {
      console.error('Failed to save field:', e);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: `Could not save ${getFieldDisplayName(key)}`,
      });
    }
  };

  // Guarded single field save handler to prevent double execution
  const saveField = (field: 'ccDebt' | 'hdfc' | 'kvb' | 'cash' | 'credits') => {
    if (editingField !== field) return;
    setEditingField(null);
    switch (field) {
      case 'ccDebt':
        handleSaveField('reconcile_cc_debt', ccDebt);
        break;
      case 'hdfc':
        handleSaveField('reconcile_hdfc_balance', hdfcBalance);
        break;
      case 'kvb':
        handleSaveField('reconcile_kvb_balance', kvbBalance);
        break;
      case 'cash':
        handleSaveField('reconcile_cash_balance', cashBalance);
        break;
      case 'credits':
        handleSaveField('reconcile_credits_owed', creditsOwed);
        break;
    }
  };


  // Math Logic
  const getLedgerNet = () => {
    let credit = 0;
    let debit = 0;
    localTransactions.forEach((t) => {
      if (t.type === 'credit') {
        credit += t.amount;
      } else {
        debit += t.amount;
      }
    });
    return credit - debit;
  };

  const ledgerNet = getLedgerNet();
  const numCcDebt = parseFloat(ccDebt) || 0;
  const numHdfc = parseFloat(hdfcBalance) || 0;
  const numKvb = parseFloat(kvbBalance) || 0;
  const numCash = parseFloat(cashBalance) || 0;
  const numCredits = parseFloat(creditsOwed) || 0;

  const theoreticalMoney = ledgerNet + numCcDebt;
  const actualMoney = numHdfc + numKvb + numCash + numCredits;
  const netDifference = theoreticalMoney - actualMoney;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading reconciliation data...</Text>
      </View>
    );
  }

  // Determine difference status and metadata
  const isPerfectMatch = Math.abs(netDifference) < 0.01;
  const isPositive = netDifference >= 0.01;

  let statusColor: string = colors.emerald;
  let statusText = 'Fully Balanced';
  let statusExplanation = 'Theoretical and actual balances are perfectly aligned.';
  let bgGradientColor: string = colors.emerald;

  if (isPositive) {
    statusColor = colors.rose;
    statusText = 'Outflow Discrepancy';
    statusExplanation = 'Unrecorded outflow. You likely forgot to log some expenses in your ledger.';
    bgGradientColor = colors.rose;
  } else if (netDifference <= -0.01) {
    statusColor = '#8B5CF6'; // purple accent
    statusText = 'Inflow Discrepancy';
    statusExplanation = 'Unrecorded inflow. You likely forgot to log some income/receipts in your ledger.';
    bgGradientColor = '#8B5CF6';
  }

  return (
    <View style={styles.viewSection}>
      <Text style={[styles.pageHeading, { color: colors.text }]}>Reconciliation</Text>

      {/* Reconciliation Summary Card */}
      <View style={[styles.summaryCard, { borderColor: colors.backgroundSelected }]}>
        {/* Dynamic Background Mesh Gradient */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg height="100%" width="100%">
            <Defs>
              <RadialGradient id="summaryGrad" cx="10%" cy="10%" rx="80%" ry="100%">
                <Stop offset="0%" stopColor={bgGradientColor} stopOpacity="0.12" />
                <Stop offset="100%" stopColor={bgGradientColor} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#summaryGrad)" />
          </Svg>
        </View>

        <View style={styles.cardHeader}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Net Difference</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.diffValueContainer}>
          <Text style={[styles.diffValue, { color: isPerfectMatch ? colors.text : statusColor }]}>
            {netDifference < 0 ? '-' : ''}{currencySymbol}{Math.abs(netDifference).toFixed(2)}
          </Text>
        </View>

        <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
          {statusExplanation}
        </Text>
        {lastUpdated ? (
          <Text style={[styles.lastUpdatedText, { color: colors.textSecondary }]}>
            Last reconciled: {lastUpdated}
          </Text>
        ) : null}
      </View>

      {/* Forms Section */}
      <View style={styles.formsContainer}>
        {/* Theoretical Money Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.sectionHeaderRow}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Theoretical Money</Text>
          </View>

          {/* Ledger net balance info */}
          <View style={[styles.infoRow, { borderBottomColor: colors.backgroundSelected }]}>
            <Text style={[styles.infoRowLabel, { color: colors.text }]}>Ledger Net Balance</Text>
            <Text style={[styles.infoRowValue, { color: ledgerNet >= 0 ? colors.emerald : colors.rose }]}>
              {ledgerNet < 0 ? '-' : ''}{currencySymbol}{Math.abs(ledgerNet).toFixed(2)}
            </Text>
          </View>

          {/* Credit card unpaid debt row */}
          {editingField === 'ccDebt' ? (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>Credit Card Unpaid Bill</Text>
              <View style={styles.inlineEditContainer}>
                <TextInput
                  style={[styles.textInputInline, { color: colors.text, borderColor: colors.emerald, backgroundColor: colors.background }]}
                  value={ccDebt}
                  onChangeText={setCcDebt}
                  keyboardType="numeric"
                  autoFocus
                  returnKeyType="done"
                  onBlur={() => saveField('ccDebt')}
                  onSubmitEditing={() => saveField('ccDebt')}
                />
                <TouchableOpacity
                  style={[styles.inlineCheckBtn, { backgroundColor: colors.text }]}
                  onPress={() => saveField('ccDebt')}
                  activeOpacity={0.8}
                >
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17L4 12" stroke={colors.background} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.infoRow, { borderBottomWidth: 0 }]}
              onPress={() => setEditingField('ccDebt')}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>Credit Card Unpaid Bill</Text>
              <Text style={[styles.infoRowValue, { color: colors.text }]}>
                {currencySymbol}{numCcDebt.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Theoretical Total */}
          <View style={[styles.totalRowBlock, { backgroundColor: colors.backgroundSelected }]}>
            <Text style={[styles.totalRowLabel, { color: colors.text }]}>Total Theoretical</Text>
            <Text style={[styles.totalRowValue, { color: colors.text }]}>
              {theoreticalMoney < 0 ? '-' : ''}{currencySymbol}{Math.abs(theoreticalMoney).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Actual Money Card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.backgroundElement }]}>
          <View style={styles.sectionHeaderRow}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
              <Path d="M3 10h18M7 15h1m4 0h1m-7 4h18a1 1 0 001-1V6a1 1 0 00-1-1H3a1 1 0 00-1 1v12a1 1 0 001 1z" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Actual Money</Text>
          </View>

          {/* HDFC Bank balance row */}
          {editingField === 'hdfc' ? (
            <View style={[styles.infoRow, { borderBottomColor: colors.backgroundSelected }]}>
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>HDFC Bank Balance</Text>
              <View style={styles.inlineEditContainer}>
                <TextInput
                  style={[styles.textInputInline, { color: colors.text, borderColor: colors.emerald, backgroundColor: colors.background }]}
                  value={hdfcBalance}
                  onChangeText={setHdfcBalance}
                  keyboardType="numeric"
                  autoFocus
                  returnKeyType="done"
                  onBlur={() => saveField('hdfc')}
                  onSubmitEditing={() => saveField('hdfc')}
                />
                <TouchableOpacity
                  style={[styles.inlineCheckBtn, { backgroundColor: colors.text }]}
                  onPress={() => saveField('hdfc')}
                  activeOpacity={0.8}
                >
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17L4 12" stroke={colors.background} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.infoRow, { borderBottomColor: colors.backgroundSelected }]}
              onPress={() => setEditingField('hdfc')}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>HDFC Bank Balance</Text>
              <Text style={[styles.infoRowValue, { color: colors.text }]}>
                {currencySymbol}{numHdfc.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}

          {/* KVB Bank balance row */}
          {editingField === 'kvb' ? (
            <View style={[styles.infoRow, { borderBottomColor: colors.backgroundSelected }]}>
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>KVB Bank Balance</Text>
              <View style={styles.inlineEditContainer}>
                <TextInput
                  style={[styles.textInputInline, { color: colors.text, borderColor: colors.emerald, backgroundColor: colors.background }]}
                  value={kvbBalance}
                  onChangeText={setKvbBalance}
                  keyboardType="numeric"
                  autoFocus
                  returnKeyType="done"
                  onBlur={() => saveField('kvb')}
                  onSubmitEditing={() => saveField('kvb')}
                />
                <TouchableOpacity
                  style={[styles.inlineCheckBtn, { backgroundColor: colors.text }]}
                  onPress={() => saveField('kvb')}
                  activeOpacity={0.8}
                >
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17L4 12" stroke={colors.background} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.infoRow, { borderBottomColor: colors.backgroundSelected }]}
              onPress={() => setEditingField('kvb')}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>KVB Bank Balance</Text>
              <Text style={[styles.infoRowValue, { color: colors.text }]}>
                {currencySymbol}{numKvb.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Cash row */}
          {editingField === 'cash' ? (
            <View style={[styles.infoRow, { borderBottomColor: colors.backgroundSelected }]}>
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>Cash</Text>
              <View style={styles.inlineEditContainer}>
                <TextInput
                  style={[styles.textInputInline, { color: colors.text, borderColor: colors.emerald, backgroundColor: colors.background }]}
                  value={cashBalance}
                  onChangeText={setCashBalance}
                  keyboardType="numeric"
                  autoFocus
                  returnKeyType="done"
                  onBlur={() => saveField('cash')}
                  onSubmitEditing={() => saveField('cash')}
                />
                <TouchableOpacity
                  style={[styles.inlineCheckBtn, { backgroundColor: colors.text }]}
                  onPress={() => saveField('cash')}
                  activeOpacity={0.8}
                >
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17L4 12" stroke={colors.background} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.infoRow, { borderBottomColor: colors.backgroundSelected }]}
              onPress={() => setEditingField('cash')}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>Cash</Text>
              <Text style={[styles.infoRowValue, { color: colors.text }]}>
                {currencySymbol}{numCash.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Credits owed row */}
          {editingField === 'credits' ? (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>My Credit</Text>
              <View style={styles.inlineEditContainer}>
                <TextInput
                  style={[styles.textInputInline, { color: colors.text, borderColor: colors.emerald, backgroundColor: colors.background }]}
                  value={creditsOwed}
                  onChangeText={setCreditsOwed}
                  keyboardType="numeric"
                  autoFocus
                  returnKeyType="done"
                  onBlur={() => saveField('credits')}
                  onSubmitEditing={() => saveField('credits')}
                />
                <TouchableOpacity
                  style={[styles.inlineCheckBtn, { backgroundColor: colors.text }]}
                  onPress={() => saveField('credits')}
                  activeOpacity={0.8}
                >
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 6L9 17L4 12" stroke={colors.background} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.infoRow, { borderBottomWidth: 0 }]}
              onPress={() => setEditingField('credits')}
              activeOpacity={0.7}
            >
              <Text style={[styles.infoRowLabel, { color: colors.text }]}>My Credit</Text>
              <Text style={[styles.infoRowValue, { color: colors.text }]}>
                {currencySymbol}{numCredits.toFixed(2)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Actual Total */}
          <View style={[styles.totalRowBlock, { backgroundColor: colors.backgroundSelected }]}>
            <Text style={[styles.totalRowLabel, { color: colors.text }]}>Total Actual</Text>
            <Text style={[styles.totalRowValue, { color: colors.text }]}>
              {actualMoney < 0 ? '-' : ''}{currencySymbol}{Math.abs(actualMoney).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  loadingText: {
    fontFamily: fontLight,
    fontSize: 14,
    marginTop: Spacing.two,
  },
  viewSection: {
    width: '100%',
    gap: 16,
  },
  summaryCard: {
    borderRadius: 4,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  cardLabel: {
    fontFamily: fontTitle,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontFamily: fontTitle,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  diffValueContainer: {
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  diffValue: {
    fontFamily: fontNumber,
    fontSize: 36,
    letterSpacing: -1,
  },
  explanationText: {
    fontFamily: fontLight,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  formsContainer: {
    gap: 16,
  },
  sectionCard: {
    borderRadius: 4,
    padding: 20,
    gap: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fontTitle,
    fontSize: 16,
    letterSpacing: -0.4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoRowLabel: {
    fontFamily: fontTitle,
    fontSize: 14,
  },
  infoRowSub: {
    fontFamily: fontLight,
    fontSize: 12,
    marginTop: 2,
  },
  infoRowValue: {
    fontFamily: fontNumber,
    fontSize: 15,
  },
  textInputInline: {
    fontFamily: fontNumber,
    fontSize: 15,
    height: 34,
    width: 100,
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 0,
    textAlign: 'right',
  },
  inlineEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineCheckBtn: {
    width: 28,
    height: 28,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontFamily: fontLight,
    fontSize: 11,
    marginTop: 4,
    opacity: 0.8,
  },
  totalRowBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 8,
  },
  totalRowLabel: {
    fontFamily: fontTitle,
    fontSize: 15,
  },
  totalRowValue: {
    fontFamily: fontNumber,
    fontSize: 18,
  },
  saveButton: {
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontFamily: fontTitle,
    fontSize: 14,
  },
});
