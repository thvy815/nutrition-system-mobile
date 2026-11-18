import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOTTOM_SPACER, COLORS, SPACING } from '../constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Nội dung cuộn được (mặc định true). */
  scrollable?: boolean;
  keyboardAvoiding?: boolean;
  /** Bật kéo để làm mới khi truyền hàm này. */
  onRefresh?: () => Promise<unknown> | void;
  /** Phần cố định phía trên (không cuộn), vd: ScreenHeader. */
  header?: React.ReactNode;
  /** Màn hình con trong stack không có tab bar -> cần chừa safe area dưới. */
  withBottomInset?: boolean;
  /** Bỏ padding ngang mặc định. */
  noPadding?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function ScreenContainer({
  children,
  scrollable = true,
  keyboardAvoiding = false,
  onRefresh,
  header,
  withBottomInset = false,
  noPadding = false,
  contentStyle,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const padding = noPadding ? null : styles.padded;
  const bottom = withBottomInset ? insets.bottom : 0;

  const body = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        padding,
        { paddingBottom: BOTTOM_SPACER + bottom },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, { paddingBottom: bottom }, contentStyle]}>
      {children}
    </View>
  );

  const screen = (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {header}
      {body}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {screen}
      </KeyboardAvoidingView>
    );
  }

  return screen;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  padded: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
});
