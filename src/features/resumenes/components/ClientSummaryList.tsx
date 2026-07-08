import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { Summary } from '../../../services/types';
import { ClientSummaryCard } from './ClientSummaryCard';

type ClientSummaryListProps = {
  summaries: Summary[];
  clientTimezone?: string;
  onPress: (summaryId: string) => void;
  onDownload: (summaryId: string) => void;
  onPay?: (summaryId: string) => void;
};

export function ClientSummaryList({
  summaries,
  clientTimezone,
  onPress,
  onDownload,
  onPay,
}: ClientSummaryListProps) {
  return (
    <View style={styles.container}>
      {summaries.map((summary, index) => (
        <ClientSummaryCard
          key={summary.id}
          summary={summary}
          clientTimezone={clientTimezone}
          isFirst={index === 0}
          isLast={index === summaries.length - 1}
          onPress={onPress}
          onDownload={onDownload}
          onPay={onPay}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
