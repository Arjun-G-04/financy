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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalLedger } from '@/hooks/useLocalLedger';
import { HomeTab } from '@/components/dashboard/HomeTab';
import { ImportTab } from '@/components/dashboard/ImportTab';
import { SettingsTab } from '@/components/dashboard/SettingsTab';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import * as SecureStore from 'expo-secure-store';

type ActiveTab = 'home' | 'import' | 'settings';

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  // Hook for local DB ledger state and operations
  const {
    localTransactions,
    localIds,
    refreshLocalLedger,
    saveTransaction,
    deleteTransaction,
  } = useLocalLedger();

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
      <SafeAreaView style={styles.safeArea}>
        
        {/* Navigation Tabs Header */}
        <View style={[styles.tabBar, { borderBottomColor: colors.backgroundElement }]}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'home' && { borderBottomColor: colors.text }]}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === 'home' ? colors.text : colors.textSecondary }]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'import' && { borderBottomColor: colors.text }]}
            onPress={() => setActiveTab('import')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === 'import' ? colors.text : colors.textSecondary }]}>Import</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'settings' && { borderBottomColor: colors.text }]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === 'settings' ? colors.text : colors.textSecondary }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'home' && (
            <HomeTab
              localTransactions={localTransactions}
              currencySymbol={currencySymbol}
              saveTransaction={saveTransaction}
              deleteTransaction={deleteTransaction}
            />
          )}

          {activeTab === 'import' && (
            <ImportTab
              spreadsheetId={spreadsheetId}
              currencySymbol={currencySymbol}
              localIds={localIds}
              onImportSuccess={refreshLocalLedger}
              setActiveTab={setActiveTab}
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
      </SafeAreaView>
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
});
