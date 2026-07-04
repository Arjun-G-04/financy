import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing } from '@/constants/theme';
import { Svg, Path } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';

interface SettingsTabProps {
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
}

export function SettingsTab({
  spreadsheetId,
  setSpreadsheetId,
  currencySymbol,
  setCurrencySymbol,
}: SettingsTabProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];
  const { user, logout } = useAuth();

  const [hasSavedId, setHasSavedId] = useState(!!spreadsheetId);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveSettings = async () => {
    if (!spreadsheetId.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Configuration Error',
        text2: 'Spreadsheet ID cannot be empty',
      });
      return;
    }
    setSavingSettings(true);
    try {
      await SecureStore.setItemAsync('transactions_sheet_id', spreadsheetId.trim());
      setHasSavedId(true);
      Toast.show({
        type: 'success',
        text1: 'Settings Saved',
        text2: 'Spreadsheet ID linked successfully',
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Configuration Error',
        text2: 'Failed to save spreadsheet settings',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleEditSettings = () => {
    setHasSavedId(false);
  };

  const handleSaveCurrency = async (symbol: string) => {
    setCurrencySymbol(symbol);
    try {
      await SecureStore.setItemAsync('financy_currency_symbol', symbol);
      Toast.show({
        type: 'success',
        text1: 'Currency Updated',
        text2: `Primary prefix set to ${symbol === '₹' ? 'INR (₹)' : 'USD ($)'}`,
      });
    } catch (e) {
      console.error('Failed to save currency setting', e);
    }
  };

  return (
    <View style={styles.viewSection}>
      {/* Currency Selector Setting */}
      <View style={[styles.settingsCard, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.settingsHeader}>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>Currency Configuration</Text>
        </View>
        <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: Spacing.half }]}>
          Select Currency Symbol
        </Text>
        <View style={styles.currencyToggleContainer}>
          <TouchableOpacity
            style={[
              styles.currencyToggleBtn,
              { borderColor: colors.backgroundSelected },
              currencySymbol === '₹' && { backgroundColor: colors.text, borderColor: colors.text }
            ]}
            onPress={() => handleSaveCurrency('₹')}
          >
            <Text style={[styles.currencyToggleText, { color: currencySymbol === '₹' ? colors.background : colors.text }]}>
              INR (₹)
            </Text>
          </TouchableOpacity>

          <View style={{ width: Spacing.two }} />

          <TouchableOpacity
            style={[
              styles.currencyToggleBtn,
              { borderColor: colors.backgroundSelected },
              currencySymbol === '$' && { backgroundColor: colors.text, borderColor: colors.text }
            ]}
            onPress={() => handleSaveCurrency('$')}
          >
            <Text style={[styles.currencyToggleText, { color: currencySymbol === '$' ? colors.background : colors.text }]}>
              USD ($)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sheet Configuration Link Setting */}
      <View style={[styles.settingsCard, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.settingsHeader}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>Google Sheet Connection</Text>
        </View>

        {hasSavedId ? (
          <View style={styles.savedIdBlock}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Active Spreadsheet Link ID</Text>
            <View style={[styles.idDisplayBox, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
              <Text style={[styles.idDisplayText, { color: colors.text }]} numberOfLines={1}>
                {spreadsheetId}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.backgroundSelected }]}
              onPress={handleEditSettings}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Change Sheet Link</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Transactions Sheet Link ID</Text>
            <TextInput
              style={[styles.textInput, { color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
              placeholder="Enter Spreadsheet ID"
              placeholderTextColor={colors.textSecondary}
              value={spreadsheetId}
              onChangeText={setSpreadsheetId}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.text }]}
              onPress={handleSaveSettings}
              disabled={savingSettings}
              activeOpacity={0.8}
            >
              {savingSettings ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={[styles.primaryButtonText, { color: colors.background }]}>Save Configuration</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* User Profile */}
      <View style={[styles.profileCard, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.userInfoRow}>
          <View style={[styles.avatarBox, { backgroundColor: colors.backgroundSelected }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {user?.givenName?.[0] || user?.name?.[0] || 'U'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.name || 'User Account'}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: '#F43F5E' }]}
          onPress={logout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Sign Out from Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewSection: {
    width: '100%',
    gap: Spacing.four,
  },
  settingsCard: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  currencyToggleContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  currencyToggleBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyToggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  savedIdBlock: {
    gap: Spacing.two,
  },
  idDisplayBox: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  idDisplayText: {
    fontSize: 14,
    fontWeight: '500',
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
  inputGroup: {
    gap: Spacing.one,
  },
  textInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
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
  profileCard: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 13,
  },
  logoutButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F43F5E',
  },
});
