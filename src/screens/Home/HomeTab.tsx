import React, { memo, useMemo } from 'react';
import { Animated, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CountUp, countUpDurationMs } from '../../components/CountUp';
import { DriverMap } from '../../components/DriverMap';
import { LiveBadge } from '../../components/LiveBadge';
import { ProgressBar } from '../../components/ProgressBar';
import { StatCard } from '../../components/StatCard';
import { colors } from '../../theme';
import { useHomeTabAnimation } from './useHomeTabAnimation';
import { styles } from './HomeTab.styles';

/** Order counts for the selected period, as shown in the summary sheet. */
export interface TodayStats {
  total: number;
  done: number;
  pending: number;
  rejected: number;
}

export interface TodayEarnings {
  amount: number;
  currency: string;
}

export interface HomeTabProps {
  latitude: number;
  longitude: number;
  /** True once a real GPS fix has replaced the fallback centre. */
  hasFix: boolean;
  stats: TodayStats;
  earnings: TodayEarnings;
  /** The days these figures cover — the Orders tab's date range, spelled out. */
  periodLabel: string;
}

/** Below this the sheet drops its second line and shrinks the money figure. */
const COMPACT_HEIGHT = 700;

const EARNINGS_ICON_SIZE = 22;
const PILL_ICON_SIZE = 13;

const STAT_STAGGER_MS = 90;

const currencySymbol = (currency: string): string =>
  currency === 'USD' ? '$' : '';

const formatMoney = (amount: number, currency: string): string =>
  `${currencySymbol(currency)}${amount.toFixed(2)}`;

const HomeTabComponent: React.FC<HomeTabProps> = ({
  latitude,
  longitude,
  hasFix,
  stats,
  earnings,
  periodLabel,
}) => {
  const { height } = useWindowDimensions();
  const animated = useHomeTabAnimation();

  const compact = height < COMPACT_HEIGHT;

  const mapStyle = useMemo(
    () => [styles.mapSection, animated.map],
    [animated.map],
  );

  const sheetStyle = useMemo(
    () => [styles.sheet, compact ? styles.sheetCompact : null, animated.sheet],
    [compact, animated.sheet],
  );

  const earningsValueStyle = useMemo(
    () => [styles.earningsValue, compact ? styles.earningsValueCompact : null],
    [compact],
  );

  const progress = stats.total > 0 ? stats.done / stats.total : 0;
  const percent = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <Animated.View style={mapStyle}>
        <DriverMap latitude={latitude} longitude={longitude} />
        <View style={styles.mapOverlay} pointerEvents="box-none">
          <LiveBadge active={hasFix} testID="home-live-badge" />
        </View>
      </Animated.View>

      <Animated.View style={sheetStyle} testID="home-summary-sheet">
        <View style={styles.handle} />

        <View style={styles.head}>
          <Text style={styles.overline} numberOfLines={1}>
            {periodLabel}
          </Text>
          <View
            style={styles.countPill}
            accessible
            accessibilityRole="text"
            accessibilityLabel={`${stats.total} orders in ${periodLabel}`}>
            <Ionicons
              name="cube-outline"
              size={PILL_ICON_SIZE}
              color={colors.primary}
            />
            <Text style={styles.countPillText}>
              <CountUp value={stats.total} />
              {' orders'}
            </Text>
          </View>
        </View>

        {/* The hero line: what the day is worth so far. */}
        <View
          style={styles.earningsRow}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`Earned ${formatMoney(
            earnings.amount,
            earnings.currency,
          )} in ${periodLabel}`}>
          <View style={styles.earningsIconBox}>
            <Ionicons
              name="wallet"
              size={EARNINGS_ICON_SIZE}
              color={colors.primary}
            />
          </View>
          <View style={styles.earningsText}>
            <Text style={styles.earningsLabel}>Earned</Text>
            {compact ? null : (
              <Text style={styles.earningsSub} numberOfLines={1}>
                <CountUp value={stats.done} />
                {' deliveries paid'}
              </Text>
            )}
          </View>
          <CountUp
            value={earnings.amount}
            decimals={2}
            prefix={currencySymbol(earnings.currency)}
            style={earningsValueStyle}
            numberOfLines={1}
          />
        </View>

        {/* How far through the day — the nudge the old "keep it rolling" line
            was gesturing at, with an actual number behind it. */}
        <View style={styles.progressBlock}>
          <ProgressBar
            progress={progress}
            // Same beat as the percentage counting beside it.
            durationMs={countUpDurationMs(percent)}
            accessibilityLabel="Orders completed"
            testID="home-progress"
          />
          <View style={styles.progressLegend}>
            <Text
              style={styles.progressText}
              numberOfLines={1}
              accessibilityLabel={`${stats.done} of ${stats.total} completed`}>
              <CountUp value={stats.done} />
              {' of '}
              <CountUp value={stats.total} />
              {' completed'}
            </Text>
            <CountUp
              value={percent}
              suffix="%"
              style={styles.progressPercent}
              accessibilityLabel={`${percent} percent`}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon="checkmark-circle"
            value={stats.done}
            label="Done"
            color={colors.success}
            tint={colors.successWash}
            animate
            testID="home-stat-done"
          />
          <StatCard
            icon="time-outline"
            value={stats.pending}
            label="Pending"
            color={colors.warning}
            tint={colors.warningWash}
            animate
            animationDelayMs={STAT_STAGGER_MS}
            testID="home-stat-pending"
          />
          <StatCard
            icon="close-circle"
            value={stats.rejected}
            label="Rejected"
            color={colors.danger}
            tint={colors.dangerWash}
            animate
            animationDelayMs={STAT_STAGGER_MS * 2}
            testID="home-stat-rejected"
          />
        </View>
      </Animated.View>
    </View>
  );
};

export const HomeTab = memo(HomeTabComponent);
HomeTab.displayName = 'HomeTab';
