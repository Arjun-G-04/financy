import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
} from 'react-native';
import { Svg, Path, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { LocalTransaction } from '@/services/database';
import { Spacing } from '@/constants/theme';

const fontTitle = 'Outfit-Bold';
const fontNumber = 'SpaceMono-Bold';
const fontNumberRegular = 'SpaceMono-Regular';

interface SwipeableLedgerRowProps {
  tx: LocalTransaction;
  colors: any;
  currencySymbol: string;
  catColor: string;
  initial: string;
  handleStartEdit: (tx: LocalTransaction) => void;
  handleDeleteLocalTx: (id: string, onResolve?: () => void) => void;
  editingTxId: string | null;
}

export function SwipeableLedgerRow({
  tx,
  colors,
  currencySymbol,
  catColor,
  initial,
  handleStartEdit,
  handleDeleteLocalTx,
  editingTxId,
}: SwipeableLedgerRowProps) {
  const swipeableRef = useRef<any>(null);

  useEffect(() => {
    if (editingTxId !== tx.id) {
      swipeableRef.current?.close();
    }
  }, [editingTxId, tx.id]);

  const renderLeftActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [0, 90],
      outputRange: [0.6, 1],
      extrapolate: 'clamp',
    });
    const opacity = dragX.interpolate({
      inputRange: [0, 70],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.swipeBackgroundLeft, { backgroundColor: colors.backgroundSelected }]}>
        <Animated.View style={[styles.swipeContentLeft, { opacity, transform: [{ scale }] }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <Path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={colors.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          <Text style={[styles.swipeActionText, { color: colors.text }]}>Edit</Text>
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [-90, 0],
      outputRange: [1, 0.6],
      extrapolate: 'clamp',
    });
    const opacity = dragX.interpolate({
      inputRange: [-70, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.swipeBackgroundRight, { backgroundColor: colors.rose }]}>
        <Animated.View style={[styles.swipeContentRight, { opacity, transform: [{ scale }] }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
          <Text style={[styles.swipeActionText, { color: '#FFFFFF' }]}>Delete</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      leftThreshold={160}
      rightThreshold={160}
      failOffsetY={[-10, 10]}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableLeftOpen={() => {
        handleStartEdit(tx);
      }}
      onSwipeableRightOpen={() => {
        handleDeleteLocalTx(tx.id, () => {
          swipeableRef.current?.close();
        });
      }}
      containerStyle={styles.swipeableContainer}
    >
      <View style={[styles.ledgerRow, { backgroundColor: colors.background }]}>
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
        <View style={styles.ledgerRowContent}>
          {/* Visual Initials Circle */}
          <View style={[styles.avatarCircle, { backgroundColor: catColor + '20' }]}>
            <Text style={[styles.avatarText, { color: catColor }]}>{initial}</Text>
          </View>

          <View style={{ flex: 1, paddingRight: Spacing.two }}>
            <Text style={[styles.ledgerName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
              {tx.name}
            </Text>
            <View style={styles.ledgerMetaRow}>
              <Text style={[styles.ledgerDate, { color: colors.textSecondary }]}>
                {tx.date.split('-').slice(1).reverse().join('/')}
              </Text>
            </View>
          </View>

          <View style={styles.ledgerRight}>
            <Text style={[styles.ledgerAmount, { color: tx.type === 'credit' ? colors.emerald : colors.rose }]}>
              {currencySymbol}{tx.amount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  ledgerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  ledgerRowContent: {
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
  ledgerName: {
    fontFamily: fontTitle,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  ledgerDate: {
    fontFamily: fontNumberRegular,
    fontSize: 12,
  },
  ledgerRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minWidth: 80,
  },
  ledgerAmount: {
    fontFamily: fontNumber,
    fontSize: 15,
    letterSpacing: -0.3,
    textAlign: 'right',
  },
  ledgerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 4,
  },
  swipeableContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  swipeBackgroundLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  swipeBackgroundRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  swipeContentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 16,
  },
  swipeContentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
  },
  swipeActionText: {
    fontFamily: fontTitle,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
