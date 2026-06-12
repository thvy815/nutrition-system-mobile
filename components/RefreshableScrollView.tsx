import React, { useState } from 'react';
import { ScrollView, RefreshControl, ScrollViewProps } from 'react-native';
import { COLORS } from '../constants/theme';

type Props = ScrollViewProps & {
  onRefreshData: () => Promise<void>;
};

export function RefreshableScrollView({
  children,
  onRefreshData,
  ...props
}: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onRefreshData();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
    >
      {children}
    </ScrollView>
  );
}