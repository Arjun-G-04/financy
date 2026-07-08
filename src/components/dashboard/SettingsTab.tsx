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
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing } from '@/constants/theme';
import { Svg, Path } from 'react-native-svg';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { DatabaseService, Category } from '@/services/database';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

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

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadCategories = () => {
    try {
      const cats = DatabaseService.getCategories();
      setCategories(cats);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories();
  }, []);

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Category name cannot be empty',
      });
      return;
    }
    if (DatabaseService.categoryExists(trimmed)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Category already exists',
      });
      return;
    }
    try {
      DatabaseService.saveCategory(trimmed);
      setNewCategoryName('');
      loadCategories();
      Toast.show({
        type: 'success',
        text1: 'Category Added',
        text2: `"${trimmed}" is now available`,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Database Error',
        text2: 'Failed to add category',
      });
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    try {
      DatabaseService.deleteCategory(id);
      loadCategories();
      Toast.show({
        type: 'success',
        text1: 'Category Deleted',
        text2: `Removed "${name}"`,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Database Error',
        text2: 'Failed to delete category',
      });
    }
  };

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

  const handleExportExcel = async () => {
    try {
      const transactions = DatabaseService.getTransactions();
      if (transactions.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'Export Info',
          text2: 'No transactions in ledger to export',
        });
        return;
      }

      // CSV Content with UTF-8 BOM to ensure Excel opens it correctly
      let csvContent = '\ufeffdate,txn name,category,type,amt\n';

      transactions.forEach(tx => {
        const date = tx.date;
        const name = `"${tx.name.replace(/"/g, '""')}"`;
        const category = tx.category ? `"${tx.category.replace(/"/g, '""')}"` : '""';
        const type = tx.type;
        const amount = tx.amount.toFixed(2);

        csvContent += `${date},${name},${category},${type},${amount}\n`;
      });

      const filename = `financy_ledger_${Date.now()}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Ledger to Excel/CSV',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Export Failed',
          text2: 'Sharing is not available on this device',
        });
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Export Failed',
        text2: 'Error occurred while generating Excel file',
      });
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

      {/* Category Management Setting */}
      <View style={[styles.settingsCard, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.settingsHeader}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M4 6H20M4 12H20M4 18H20" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>Manage Categories</Text>
        </View>

        <View style={styles.addCategoryInputRow}>
          <TextInput
            style={[styles.textInput, { flex: 1, color: colors.text, borderColor: colors.backgroundSelected, backgroundColor: colors.background }]}
            placeholder="Add category (e.g. Groceries)"
            placeholderTextColor={colors.textSecondary}
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.addCategoryBtn, { backgroundColor: colors.text }]}
            onPress={handleAddCategory}
            activeOpacity={0.8}
          >
            <Text style={{ color: colors.background, fontWeight: '700', fontSize: 13 }}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesListContainer}>
          {categories.length === 0 ? (
            <Text style={[styles.emptyCategoriesText, { color: colors.textSecondary }]}>
              No categories added yet. Add one above.
            </Text>
          ) : (
            categories.map(cat => (
              <View key={cat.id} style={[styles.categoryRow, { borderBottomColor: colors.background }]}>
                <Text style={[styles.categoryRowName, { color: colors.text }]}>{cat.name}</Text>
                <TouchableOpacity
                  style={styles.categoryDeleteBtn}
                  onPress={() => handleDeleteCategory(cat.id, cat.name)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </Svg>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Export Ledger Data Setting */}
      <View style={[styles.settingsCard, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.settingsHeader}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke={colors.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          <Text style={[styles.settingsTitle, { color: colors.text }]}>Export Ledger</Text>
        </View>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
          Download your local ledger as an Excel-compatible CSV spreadsheet.
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.text }]}
          onPress={handleExportExcel}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryButtonText, { color: colors.background }]}>Export to Excel (CSV)</Text>
        </TouchableOpacity>
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
  addCategoryInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
  },
  addCategoryBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  categoriesListContainer: {
    marginTop: Spacing.one,
    gap: Spacing.one,
  },
  emptyCategoriesText: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: Spacing.two,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  categoryRowName: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryDeleteBtn: {
    padding: Spacing.one,
  },
});
