import React, { memo, useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { colors } from '../../theme';
import { styles } from './CalendarDatePicker.styles';

export interface DateRange {
  start: string;
  end: string;
}

export interface CalendarDatePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  maxDate?: string;
  testID?: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number): string => String(n).padStart(2, '0');

const formatDay = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDay = (value: string): Date => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayDateString = (): string => formatDay(new Date());

export const addDays = (day: string, delta: number): string => {
  const date = parseDay(day);
  date.setDate(date.getDate() + delta);
  return formatDay(date);
};

const formatLong = (value: string): string => {
  const [y, m, d] = value.split('-').map(Number);
  return `${WEEKDAYS[parseDay(value).getDay()]}, ${MONTHS[m - 1]} ${d}, ${y}`;
};

const formatShort = (value: string, withYear: boolean): string => {
  const [y, m, d] = value.split('-').map(Number);
  return withYear ? `${MONTHS[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${d}`;
};

export const formatDateRange = ({ start, end }: DateRange): string => {
  if (start === end) {
    return formatLong(start);
  }
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatShort(start, !sameYear)} – ${formatShort(end, true)}`;
};

const eachDay = (start: string, end: string): string[] => {
  const days: string[] = [];
  const cursor = parseDay(start);
  const last = parseDay(end);
  while (cursor <= last) {
    days.push(formatDay(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

interface DayMark {
  startingDay?: boolean;
  endingDay?: boolean;
  color: string;
  textColor: string;
}

const buildMarks = (start: string, end: string): Record<string, DayMark> => {
  const days = eachDay(start, end);
  const marks: Record<string, DayMark> = {};
  days.forEach((day, index) => {
    const isStart = index === 0;
    const isEnd = index === days.length - 1;
    const isCap = isStart || isEnd;
    marks[day] = {
      startingDay: isStart,
      endingDay: isEnd,
      color: isCap ? colors.primary : colors.primaryWash,
      textColor: isCap ? colors.textOnPrimary : colors.textPrimary,
    };
  });
  return marks;
};

const CALENDAR_THEME = {
  todayTextColor: colors.primary,
  selectedDayBackgroundColor: colors.primary,
  selectedDayTextColor: colors.textOnPrimary,
  arrowColor: colors.primary,
  monthTextColor: colors.textPrimary,
  textMonthFontWeight: '700' as const,
  dayTextColor: colors.textPrimary,
  textDisabledColor: colors.border,
};

/**
 * A date-range field that opens a themed month calendar in a centered modal.
 *
 * Controlled: the parent owns `value` and is told of committed ranges via
 * `onChange`. Picking is two taps — the first sets the start, the second the
 * end and closes. A second tap *before* the first re-anchors the start instead
 * of producing a backwards range, so there's no invalid state to reject.
 * Anything after `maxDate` (today) is disabled and can't be reached at all.
 */
const CalendarDatePickerComponent: React.FC<CalendarDatePickerProps> = ({
  value,
  onChange,
  maxDate,
  testID = 'calendar-date-picker',
}) => {
  const [open, setOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  const ceiling = maxDate ?? todayDateString();

  const show = useCallback(() => {
    setPendingStart(null);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setPendingStart(null);
    setOpen(false);
  }, []);

  const handleDayPress = useCallback(
    (day: { dateString: string }) => {
      const picked = day.dateString;
      if (picked > ceiling) {
        return;
      }
      if (!pendingStart) {
        setPendingStart(picked);
        return;
      }
      if (picked < pendingStart) {
        setPendingStart(picked);
        return;
      }
      onChange({ start: pendingStart, end: picked });
      setPendingStart(null);
      setOpen(false);
    },
    [ceiling, pendingStart, onChange],
  );

  const marked = useMemo(
    () =>
      pendingStart
        ? buildMarks(pendingStart, pendingStart)
        : buildMarks(value.start, value.end),
    [pendingStart, value.start, value.end],
  );

  const label = formatDateRange(value);

  return (
    <>
      <Pressable
        style={styles.field}
        onPress={show}
        accessibilityRole="button"
        accessibilityLabel={`Selected dates ${label}. Tap to change.`}
        hitSlop={4}
        testID={testID}>
        <Text style={styles.fieldIcon}>📅</Text>
        <Text style={styles.fieldText} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.fieldChevron}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={close}>
        {/* Tap outside the sheet to dismiss. */}
        <Pressable style={styles.backdrop} onPress={close}>
          {/* Swallow presses inside the sheet so they don't dismiss. */}
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {pendingStart ? 'Pick the end date' : 'Pick the start date'}
              </Text>
              <Text style={styles.sheetHint}>
                {pendingStart
                  ? `From ${formatLong(pendingStart)}. Tap an earlier day to move the start.`
                  : 'Two taps: start, then end. Future days are unavailable.'}
              </Text>
            </View>

            {open ? (
              <Calendar
                current={pendingStart ?? value.end}
                maxDate={ceiling}
                onDayPress={handleDayPress}
                markedDates={marked}
                markingType="period"
                disableAllTouchEventsForDisabledDays
                enableSwipeMonths
                theme={CALENDAR_THEME}
                testID={`${testID}-calendar`}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export const CalendarDatePicker = memo(CalendarDatePickerComponent);
CalendarDatePicker.displayName = 'CalendarDatePicker';
