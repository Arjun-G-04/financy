import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { SheetTransaction } from '@/services/googleSheets';
import { Colors, Spacing } from '@/constants/theme';
import Toast from 'react-native-toast-message';

interface ImportTransactionModalProps {
  transaction: SheetTransaction | null;
  onClose: () => void;
  onConfirm: (name: string) => void;
  currencySymbol: string;
}

export function ImportTransactionModal({
  transaction,
  onClose,
  onConfirm,
  currencySymbol,
}: ImportTransactionModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'dark' : scheme];
  
  const [importNameInput, setImportNameInput] = useState('');

  const handleConfirmImport = () => {
    if (!importNameInput.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Input Missing',
        text2: 'Please enter a name for this transaction',
      });
      return;
    }
    onConfirm(importNameInput.trim());
  };

  if (!transaction) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      style={styles.inlineOverlayBg}
    >
      <ScrollView
        contentContainerStyle={styles.modalScrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.importDialogContent, { backgroundColor: colors.backgroundElement }]}>
          
          <View style={styles.importHeaderBlock}>
            <Text style={[styles.importDialogTitle, { color: colors.text }]}>Import to Ledger</Text>
            <Text style={[styles.importDialogSubtitle, { color: colors.textSecondary }]}>
              Specify a local name based on memory or clue
            </Text>
          </View>
          
          <View style={styles.tilesContainer}>
            {/* Row for Date, Type, Amount */}
            <View style={styles.tilesRow}>
              
              {/* Date Tile */}
              <View style={[styles.tileCard, { flex: 1.4, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>DATE</Text>
                <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1}>
                  {transaction.date}
                </Text>
              </View>

              {/* Type Tile */}
              <View style={[styles.tileCard, { flex: 0.6, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>TYPE</Text>
                <Text style={[styles.tileValue, { color: transaction.type === 'credit' ? colors.text : '#F43F5E', fontWeight: 'bold' }]} numberOfLines={1}>
                  {transaction.type === 'credit' ? 'C' : 'D'}
                </Text>
              </View>

              {/* Amount Tile */}
              <View style={[styles.tileCard, { flex: 1.0, backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
                <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>AMOUNT</Text>
                <Text style={[styles.tileValue, { color: colors.text }]} numberOfLines={1}>
                  {currencySymbol}{transaction.amount.toFixed(2)}
                </Text>
              </View>

            </View>

            {/* Full width Merchant Clue Tile */}
            <View style={[styles.tileCardFull, { backgroundColor: colors.background, borderColor: colors.backgroundSelected }]}>
              <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>MERCHANT INFO CLUE</Text>
              <Text style={[styles.tileValueLarge, { color: colors.text }]} numberOfLines={2}>
                {transaction.merchant}
              </Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ledger Transaction Name</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.backgroundSelected,
                  backgroundColor: colors.background,
                  height: 54,
                  fontSize: 15,
                }
              ]}
              placeholder="Enter custom description"
              placeholderTextColor={colors.textSecondary}
              value={importNameInput}
              onChangeText={setImportNameInput}
            />
          </View>

          <View style={styles.importActionsBlock}>
            <TouchableOpacity
              style={[styles.importActBtn, styles.importCancelBtn, { borderColor: colors.backgroundSelected }]}
              onPress={onClose}
            >
              <Text style={[styles.importActBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.importActBtn, styles.importConfirmBtn, { backgroundColor: colors.text }]}
              onPress={handleConfirmImport}
            >
              <Text style={[styles.importActBtnText, { color: colors.background }]}>Confirm Import</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inlineOverlayBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 999,
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  importDialogContent: {
    width: '90%',
    maxWidth: 450,
    borderRadius: 24,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    alignSelf: 'center',
  },
  importHeaderBlock: {
    marginTop: Spacing.two,
    gap: 4,
  },
  importDialogTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  importDialogSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  tilesContainer: {
    gap: Spacing.two,
    width: '100%',
    marginTop: Spacing.one,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
  },
  tileCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  tileCardFull: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    minHeight: 70,
  },
  tileLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  tileValueLarge: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
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
  importActionsBlock: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  importActBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importCancelBtn: {
    borderWidth: 1.5,
  },
  importConfirmBtn: {},
  importActBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
