// Dashboard screen entry
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Svg, Path, Defs, RadialGradient, Stop, Circle, Rect } from 'react-native-svg';
import { useLocalLedger } from '@/hooks/useLocalLedger';
import { useSheetsSync } from '@/hooks/useSheetsSync';
import { HomeTab } from '@/components/dashboard/HomeTab';
import { AnalyticsTab } from '@/components/dashboard/AnalyticsTab';
import { HistoryTab } from '@/components/dashboard/HistoryTab';
import { ReconcileTab } from '@/components/dashboard/ReconcileTab';
import { ImportTab } from '@/components/dashboard/ImportTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';

type ActiveTab = 'home' | 'analytics' | 'history' | 'reconcile' | 'import' | 'settings';

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Hook for local DB ledger state and operations
  const {
    localTransactions,
    localIds,
    refreshLocalLedger,
    saveTransaction,
    deleteTransaction,
  } = useLocalLedger();

  // Hook for Google Sheets sync state (persisted across tab switches)
  const {
    startDate: sheetStartDate,
    setStartDate: setSheetStartDate,
    endDate: sheetEndDate,
    setEndDate: setSheetEndDate,
    sheetTransactions,
    loadingSheet,
    importError: sheetImportError,
    fetchSheetData,
  } = useSheetsSync({
    spreadsheetId,
    onSuccess: refreshLocalLedger,
    setActiveTab,
  });

  // Load spreadsheet and currency settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const storedId = await SecureStore.getItemAsync('transactions_sheet_id');
        if (storedId) {
          setSpreadsheetId(storedId);
        }
        
        const storedCurrency = await SecureStore.getItemAsync('financy_currency_symbol');
        if (storedCurrency) {
          setCurrencySymbol(storedCurrency);
        }
      } catch (e) {
        console.error('Failed to load settings from SecureStore:', e);
      } finally {
        setIsInitializing(false);
      }
    }

    loadSettings();
  }, []);

  if (isInitializing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textSecondary }}>Initializing wallet...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Global Screen Background Mesh Gradient */}
      <View style={StyleSheet.absoluteFill}>
        {activeTab === 'home' ? (
          <Svg height="100%" width="100%">
            <Defs>
              <RadialGradient id="homeGrad" cx="50%" cy="0%" rx="100%" ry="100%">
                <Stop offset="0%" stopColor="#d946ef" stopOpacity={scheme === 'dark' ? 0.22 : 0.15} />
                <Stop offset="40%" stopColor="#8b5cf6" stopOpacity={scheme === 'dark' ? 0.12 : 0.08} />
                <Stop offset="100%" stopColor="#000000" stopOpacity={1} />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#homeGrad)" />
          </Svg>
        ) : (
          <Svg height="100%" width="100%">
            <Defs>
              <RadialGradient id="screenEmerald" cx="80%" cy="35%" rx="70%" ry="70%">
                <Stop offset="0%" stopColor={colors.emerald} stopOpacity={scheme === 'dark' ? 0.08 : 0.06} />
                <Stop offset="100%" stopColor={colors.emerald} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="screenRose" cx="20%" cy="70%" rx="60%" ry="60%">
                <Stop offset="0%" stopColor={colors.rose} stopOpacity={scheme === 'dark' ? 0.06 : 0.04} />
                <Stop offset="100%" stopColor={colors.rose} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="transparent" />
            <Circle cx="80%" cy="35%" r="280" fill="url(#screenEmerald)" />
            <Circle cx="20%" cy="70%" r="220" fill="url(#screenRose)" />
          </Svg>
        )}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {activeTab === 'home' ? (
          <HomeTab
            localTransactions={localTransactions}
            currencySymbol={currencySymbol}
            saveTransaction={saveTransaction}
            deleteTransaction={deleteTransaction}
            showForm={showAddForm}
            setShowForm={setShowAddForm}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'analytics' && (
              <AnalyticsTab
                localTransactions={localTransactions}
                currencySymbol={currencySymbol}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTab
                localTransactions={localTransactions}
                currencySymbol={currencySymbol}
              />
            )}

            {activeTab === 'reconcile' && (
              <ReconcileTab
                localTransactions={localTransactions}
                currencySymbol={currencySymbol}
              />
            )}

            {activeTab === 'import' && (
              <ImportTab
                spreadsheetId={spreadsheetId}
                currencySymbol={currencySymbol}
                localIds={localIds}
                onImportSuccess={refreshLocalLedger}
                startDate={sheetStartDate}
                setStartDate={setSheetStartDate}
                endDate={sheetEndDate}
                setEndDate={setSheetEndDate}
                sheetTransactions={sheetTransactions}
                loadingSheet={loadingSheet}
                importError={sheetImportError}
                fetchSheetData={fetchSheetData}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                spreadsheetId={spreadsheetId}
                setSpreadsheetId={setSpreadsheetId}
                currencySymbol={currencySymbol}
                setCurrencySymbol={setCurrencySymbol}
              />
            )}
          </ScrollView>
        )}

        {/* Floating Action Button (FAB) at Bottom Right above bottom nav */}
        {activeTab === 'home' && (
          <TouchableOpacity
            style={[
              styles.fab,
              {
                backgroundColor: colors.text,
                bottom: 16,
              }
            ]}
            onPress={() => setShowAddForm(true)}
            activeOpacity={0.85}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5V19M5 12H19" stroke={colors.background} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </TouchableOpacity>
        )}
      </SafeAreaView>

      {/* Bottom Navigation Bar flush with bottom */}
      <View
        style={[
          styles.bottomTabBarContainer,
          {
            backgroundColor: colors.backgroundElement,
            borderTopColor: colors.backgroundSelected,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            height: 52 + (insets.bottom > 0 ? insets.bottom : 8),
          }
        ]}
      >
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.7}
        >
          <View style={styles.pillIndicator}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ opacity: activeTab === 'home' ? 1.0 : 0.4 }}>
              <Path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M9 21V12H15V21" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('analytics')}
          activeOpacity={0.7}
        >
          <View style={styles.pillIndicator}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ opacity: activeTab === 'analytics' ? 1.0 : 0.4 }}>
              <Path d="M21.21 15.89A10 10 0 1 1 8 2.83" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M22 12A10 10 0 0 0 12 2V12Z" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <View style={styles.pillIndicator}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ opacity: activeTab === 'history' ? 1.0 : 0.4 }}>
              <Path d="M3 3v18h18" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M19 9l-5 5-4-4-3 3" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('reconcile')}
          activeOpacity={0.7}
        >
          <View style={styles.pillIndicator}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ opacity: activeTab === 'reconcile' ? 1.0 : 0.4 }}>
              <Path d="M12 3v18M3 21h18M12 7H4.5M12 7h7.5M4.5 7L3 13h3L4.5 7zm15 0L18 13h3l-1.5-6z" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('import')}
          activeOpacity={0.7}
        >
          <View style={styles.pillIndicator}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ opacity: activeTab === 'import' ? 1.0 : 0.4 }}>
              <Path d="M12 3V16M12 16L7 11M12 16L17 11" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M4 20H20" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <View style={styles.pillIndicator}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" style={{ opacity: activeTab === 'settings' ? 1.0 : 0.4 }}>
              <Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={colors.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  bottomTabBarContainer: {
    width: '100%',
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  pillIndicator: {
    width: 56,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 999,
  },
});
