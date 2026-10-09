import { useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/constants/theme';
import { dateKey } from '@/lib/training';

/** SVG text defaults to a serif face in browsers; match the UI font instead. */
const FONT = Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const parse = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Area line chart over dates: y gridlines with labels, month ticks, an optional dashed goal
 * line, and a dot on the latest point. x is placed by date, not by index, so a gap in logging
 * shows as a gap in time.
 */
export function AreaChart({
  points,
  goal,
  height = 170,
  format = (n: number) => String(Math.round(n)),
  empty,
}: {
  points: { date: string; value: number }[];
  goal?: number | null;
  height?: number;
  format?: (n: number) => string;
  empty: string;
}) {
  const t = useTheme();
  const [width, setWidth] = useState(0);

  if (points.length < 2) {
    return <Text style={{ color: t.textMuted, paddingVertical: 20, fontSize: 15 }}>{empty}</Text>;
  }

  const left = 30;
  const right = 14;
  const top = 10;
  const bottom = 24;
  const values = points.map((p) => p.value).concat(goal ? [goal] : []);
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  const pad = Math.max((hi - lo) * 0.15, 1);
  lo = Math.floor(lo - pad);
  hi = Math.ceil(hi + pad);
  const t0 = parse(points[0].date).getTime();
  const t1 = Math.max(parse(points[points.length - 1].date).getTime(), t0 + 86400000);
  const plotW = Math.max(1, width - left - right);
  const plotH = height - top - bottom;
  const x = (d: string) => left + ((parse(d).getTime() - t0) / (t1 - t0)) * plotW;
  const y = (v: number) => top + (1 - (v - lo) / (hi - lo)) * plotH;

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points[points.length - 1].date).toFixed(1)},${top + plotH} L${x(points[0].date).toFixed(1)},${top + plotH} Z`;
  const ticks = [lo, (lo + hi) / 2, hi];

  // One label per month boundary inside the range.
  const months: { x: number; label: string }[] = [];
  const cursor = new Date(parse(points[0].date));
  cursor.setDate(1);
  cursor.setMonth(cursor.getMonth() + 1);
  while (cursor.getTime() <= t1) {
    months.push({ x: x(dateKey(cursor)), label: MONTHS[cursor.getMonth()] });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const step = Math.ceil(months.length / 6);
  const last = points[points.length - 1];

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={t.accent} stopOpacity={0.35} />
              <Stop offset="1" stopColor={t.accent} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          {ticks.map((v) => (
            <SvgText fontFamily={FONT} key={v} x={0} y={y(v) + 4} fill={t.textMuted} fontSize={11}>
              {format(v)}
            </SvgText>
          ))}
          {months
            .filter((_, i) => i % step === 0)
            .map((m) => (
              <SvgText fontFamily={FONT} key={`${m.label}${m.x}`} x={m.x} y={height - 6} fill={t.textMuted} fontSize={11} textAnchor="middle">
                {m.label}
              </SvgText>
            ))}
          {months.map((m) => (
            <Line key={`g${m.x}`} x1={m.x} x2={m.x} y1={top} y2={top + plotH} stroke={t.border} strokeDasharray="2 4" />
          ))}
          <Path d={area} fill="url(#area)" />
          <Path d={line} stroke={t.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {goal ? (
            <>
              <Line x1={left} x2={width - right} y1={y(goal)} y2={y(goal)} stroke={t.gold} strokeWidth={1.5} strokeDasharray="7 6" />
              <SvgText fontFamily={FONT} x={width - right} y={y(goal) - 6} fill={t.gold} fontSize={11} fontWeight="700" textAnchor="end">
                {format(goal)}
              </SvgText>
            </>
          ) : null}
          <Circle cx={x(last.date)} cy={y(last.value)} r={5} fill={t.accent} />
        </Svg>
      ) : null}
    </View>
  );
}

/**
 * GitHub-style year of training: one column per week (Monday on top), shaded by minutes trained
 * that day, with today outlined. A year of readable cells is wider than a phone, so the grid
 * scrolls sideways and opens on the current week.
 */
export function Heatmap({ minutes, weeks = 53 }: { minutes: Map<string, number>; weeks?: number }) {
  const t = useTheme();
  const scroller = useRef<ScrollView>(null);
  const cell = 11;
  const gap = 3;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7);
  const todayKey = dateKey(today);
  const max = Math.max(30, ...minutes.values());
  const shade = (m: number) => (m <= 0 ? 0 : m < max * 0.25 ? 0.35 : m < max * 0.5 ? 0.55 : m < max * 0.75 ? 0.78 : 1);

  const cells: { x: number; y: number; key: string; m: number }[] = [];
  const monthLabels: { x: number; label: string }[] = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + w * 7 + d);
      if (day > today) continue;
      const key = dateKey(day);
      if (d === 0 && day.getDate() <= 7) monthLabels.push({ x: w * (cell + gap), label: MONTHS[day.getMonth()] });
      cells.push({ x: w * (cell + gap), y: d * (cell + gap), key, m: minutes.get(key) ?? 0 });
    }
  }
  const width = weeks * (cell + gap) - gap;
  const height = 7 * (cell + gap) + 16;

  return (
    <View>
      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}>
        <Svg width={width} height={height}>
          {monthLabels.map((m) => (
            <SvgText fontFamily={FONT} key={`${m.label}${m.x}`} x={m.x} y={10} fill={t.textMuted} fontSize={11}>
              {m.label}
            </SvgText>
          ))}
          {cells.map((c) => (
            <Rect
              key={c.key}
              x={c.x}
              y={c.y + 16}
              width={cell}
              height={cell}
              rx={3}
              fill={c.m ? t.accent : t.surfaceAlt}
              fillOpacity={c.m ? shade(c.m) : 1}
              stroke={c.key === todayKey ? t.accent : 'none'}
              strokeWidth={1.5}
            />
          ))}
        </Svg>
      </ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 8 }}>
        <Text style={{ color: t.textMuted, fontSize: 12, marginRight: 4 }}>Less time</Text>
        {[0, 0.35, 0.55, 0.78, 1].map((o) => (
          <View key={o} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: o ? t.accent : t.surfaceAlt, opacity: o || 1 }} />
        ))}
        <Text style={{ color: t.textMuted, fontSize: 12, marginLeft: 4 }}>More time</Text>
      </View>
    </View>
  );
}
