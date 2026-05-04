import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { reportsAPI } from '../services/api';

/* ─────────────── CHART THEME CONSTANTS ─────────────── */
const PAGE_BG    = 'var(--dash-page-bg)';
const CARD_BG    = 'var(--dash-card-bg)';
const CARD_BDR   = 'var(--dash-card-border)';
const GRID_CLR   = 'var(--dash-grid)';
const TICK_CLR   = 'var(--dash-tick)';
const TEAL_LABEL = 'var(--dash-accent-label)';
const TEXT_PRI   = 'var(--dash-text-primary)';
const TEXT_SUB   = 'var(--dash-text-secondary)';
const TOOLTIP_BG = 'var(--dash-tooltip-bg)';
const EMPTY_ICON_BG = 'var(--dash-empty-icon-bg)';

/* ─────────────── DATA HELPERS (original, unchanged) ─────────────── */

const groupByDateAndAverage = (dataList, valueKey = 'value') => {
  if (!Array.isArray(dataList) || dataList.length === 0) return [];
  const grouped = dataList.reduce((acc, curr) => {
    if (curr[valueKey] == null) return acc;
    if (!acc[curr.date]) acc[curr.date] = { sum: 0, count: 0 };
    acc[curr.date].sum += Number(curr[valueKey]);
    acc[curr.date].count += 1;
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([date, { sum, count }]) => ({ date, [valueKey]: Number((sum / count).toFixed(2)) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const groupMultipleMetrics = (metricsMap) => {
  const grouped = {};
  let hasData = false;
  Object.entries(metricsMap).forEach(([key, dataList]) => {
    if (!Array.isArray(dataList) || dataList.length === 0) return;
    dataList.forEach(item => {
      if (item.value == null) return;
      hasData = true;
      if (!grouped[item.date]) grouped[item.date] = {};
      if (!grouped[item.date][key]) grouped[item.date][key] = { sum: 0, count: 0 };
      grouped[item.date][key].sum += Number(item.value);
      grouped[item.date][key].count += 1;
    });
  });
  if (!hasData) return [];
  return Object.entries(grouped)
    .map(([date, metrics]) => {
      const entry = { date };
      Object.entries(metrics).forEach(([key, { sum, count }]) => {
        entry[key] = Number((sum / count).toFixed(2));
      });
      return entry;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const parseBloodPressure = (bpList) => {
  if (!Array.isArray(bpList) || bpList.length === 0) return [];
  const grouped = bpList.reduce((acc, curr) => {
    if (!curr.value || typeof curr.value !== 'string' || !curr.value.includes('/')) return acc;
    const [sys, dia] = curr.value.split('/');
    if (!acc[curr.date]) acc[curr.date] = { sysSum: 0, diaSum: 0, count: 0 };
    acc[curr.date].sysSum += Number(sys);
    acc[curr.date].diaSum += Number(dia);
    acc[curr.date].count += 1;
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([date, { sysSum, diaSum, count }]) => ({
      date,
      systolic: Math.round(sysSum / count),
      diastolic: Math.round(diaSum / count),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const formatMetricLabel = (metricKey = '') =>
  metricKey.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\b\w/g, c => c.toUpperCase());

const extractNumericValue = (rawValue) => {
  if (rawValue == null) return null;
  if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : null;
  const asString = String(rawValue).trim();
  if (!asString) return null;
  const matched = asString.match(/-?\d*\.?\d+/);
  if (!matched) return null;
  const parsed = Number(matched[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildNumericSeries = (dataList) => {
  if (!Array.isArray(dataList) || dataList.length === 0) return [];
  const grouped = dataList.reduce((acc, item) => {
    if (!item?.date) return acc;
    const numericValue = extractNumericValue(item.value);
    if (numericValue == null) return acc;
    if (!acc[item.date]) acc[item.date] = { sum: 0, count: 0 };
    acc[item.date].sum += numericValue;
    acc[item.date].count += 1;
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([date, { sum, count }]) => ({ date, value: Number((sum / count).toFixed(2)) }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/* ─────────────── FORMAT DATE FOR X AXIS ─────────────── */
const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return d; }
};

/* ─────────────── CUSTOM TOOLTIP ─────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: TOOLTIP_BG,
      border: `1px solid ${CARD_BDR}`,
      borderRadius: 10,
      padding: '12px 16px',
      boxShadow: '0 16px 40px rgba(0,0,0,.7)',
    }}>
      <p style={{ fontSize: 11, color: TEXT_SUB, marginBottom: 8, letterSpacing: '.05em' }}>
        {fmtDate(label)}
      </p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 3 }}>
          <span style={{ fontSize: 12, color: TEXT_SUB }}>{p.name}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─────────────── CHART CARD ─────────────── */
/**
 * accentColor — controls the LATEST badge colour.
 * Single-line charts get an AreaChart with gradient fill.
 * Multi-line charts get a LineChart with a legend.
 */
const ChartCard = ({ title, data, lines, latestStat = null, accentColor = TEAL_LABEL }) => {
  // Prepend zero-value point one day before first data point (original logic)
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const firstDate = new Date(data[0].date);
    firstDate.setDate(firstDate.getDate() - 1);
    const zeroPoint = { date: firstDate.toISOString().split('T')[0] };
    lines.forEach(l => { zeroPoint[l.dataKey] = 0; });
    return [zeroPoint, ...data];
  }, [data, lines]);

  if (!chartData || chartData.length === 0) return null;

  const isSingle = lines.length === 1;
  const primaryColor = lines[0]?.color ?? accentColor;
  const gradientId = `grad_${lines[0]?.dataKey ?? 'default'}`;

  const axisProps = {
    axisLine: false,
    tickLine: false,
    tick: { fill: TICK_CLR, fontSize: 11, fontFamily: 'inherit' },
  };

  const sharedProps = {
    data: chartData,
    margin: { top: 8, right: 12, left: -18, bottom: 0 },
  };

  return (
    <div
      style={{
        background: CARD_BG,
        border: `1px solid ${CARD_BDR}`,
        borderRadius: 16,
        padding: '20px 22px 16px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color .25s, box-shadow .25s, transform .25s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${accentColor}55`;
        e.currentTarget.style.boxShadow = `0 8px 40px rgba(0,0,0,.5)`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = CARD_BDR;
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* ── Card header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.13em',
            textTransform: 'uppercase', color: TEAL_LABEL, marginBottom: 5,
          }}>
            Metric
          </p>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRI, lineHeight: 1 }}>
            {title}
          </h3>
        </div>

        {latestStat && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}45`,
            borderRadius: 10,
            padding: '7px 14px',
            minWidth: 80,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '.13em',
              textTransform: 'uppercase', color: accentColor, lineHeight: 1,
            }}>
              Latest
            </span>
            <span style={{
              fontSize: 22, fontWeight: 800, color: accentColor,
              lineHeight: 1.25, marginTop: 3, whiteSpace: 'nowrap',
            }}>
              {latestStat}
            </span>
          </div>
        )}
      </div>

      {/* ── Chart area ── */}
      <div style={{ height: 240, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {isSingle ? (
            <AreaChart {...sharedProps}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={primaryColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke={GRID_CLR} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} dy={8} {...axisProps} />
              <YAxis domain={[0, 'auto']} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey={lines[0].dataKey}
                name={lines[0].name}
                stroke={lines[0].color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: lines[0].color }}
              />
            </AreaChart>
          ) : (
            <LineChart {...sharedProps}>
              <CartesianGrid strokeDasharray="3 6" stroke={GRID_CLR} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtDate} dy={8} {...axisProps} />
              <YAxis domain={[0, 'auto']} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: 14 }}
                iconType="circle"
                iconSize={7}
                formatter={v => <span style={{ color: TEXT_SUB, fontSize: 12 }}>{v}</span>}
              />
              {lines.map(line => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: line.color }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ─────────────── MAIN DASHBOARD ─────────────── */
export default function Dashboard() {
  const [data, setData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await reportsAPI.getAll();
        setData(res.data || {});
      } catch (err) {
        console.log('Error fetching API data:', err);
        setData({
          blood_sugar: [
            { date: '2026-01-05', value: 95  }, { date: '2026-01-20', value: 110 },
            { date: '2026-02-05', value: 102 }, { date: '2026-02-20', value: 125 },
            { date: '2026-03-05', value: 118 }, { date: '2026-03-20', value: 130 },
            { date: '2026-04-05', value: 105 }, { date: '2026-04-20', value: 112 },
            { date: '2026-05-05', value: 120 }, { date: '2026-05-20', value: 135 },
            { date: '2026-06-05', value: 115 }, { date: '2026-06-20', value: 108 },
          ],
          urine: [
            { date: '2026-01-05', value: 1 }, { date: '2026-01-20', value: 0 },
            { date: '2026-02-05', value: 1 }, { date: '2026-02-20', value: 0 },
            { date: '2026-03-05', value: 0 }, { date: '2026-03-20', value: 1 },
            { date: '2026-04-05', value: 0 }, { date: '2026-04-20', value: 0 },
            { date: '2026-05-05', value: 1 }, { date: '2026-05-20', value: 0 },
            { date: '2026-06-05', value: 0 }, { date: '2026-06-20', value: 1 },
          ],
          thyroid: [
            { date: '2026-01-05', value: 2.5 }, { date: '2026-01-20', value: 3.0 },
            { date: '2026-02-05', value: 2.8 }, { date: '2026-02-20', value: 3.2 },
            { date: '2026-03-05', value: 2.9 }, { date: '2026-03-20', value: 3.5 },
            { date: '2026-04-05', value: 2.7 }, { date: '2026-04-20', value: 3.1 },
            { date: '2026-05-05', value: 3.4 }, { date: '2026-05-20', value: 2.6 },
            { date: '2026-06-05', value: 3.0 }, { date: '2026-06-20', value: 2.8 },
          ],
          total_cholesterol: [
            { date: '2026-01-05', value: 180 }, { date: '2026-01-20', value: 190 },
            { date: '2026-02-05', value: 175 }, { date: '2026-02-20', value: 200 },
            { date: '2026-03-05', value: 210 }, { date: '2026-03-20', value: 195 },
            { date: '2026-04-05', value: 185 }, { date: '2026-04-20', value: 205 },
            { date: '2026-05-05', value: 198 }, { date: '2026-05-20', value: 220 },
            { date: '2026-06-05', value: 210 }, { date: '2026-06-20', value: 200 },
          ],
          hdl: [
            { date: '2026-01-05', value: 45 }, { date: '2026-01-20', value: 50 },
            { date: '2026-02-05', value: 48 }, { date: '2026-02-20', value: 52 },
            { date: '2026-03-05', value: 46 }, { date: '2026-03-20', value: 55 },
            { date: '2026-04-05', value: 49 }, { date: '2026-04-20', value: 53 },
            { date: '2026-05-05', value: 47 }, { date: '2026-05-20', value: 54 },
            { date: '2026-06-05', value: 50 }, { date: '2026-06-20', value: 52 },
          ],
          ldl: [
            { date: '2026-01-05', value: 110 }, { date: '2026-01-20', value: 120 },
            { date: '2026-02-05', value: 105 }, { date: '2026-02-20', value: 130 },
            { date: '2026-03-05', value: 125 }, { date: '2026-03-20', value: 135 },
            { date: '2026-04-05', value: 115 }, { date: '2026-04-20', value: 140 },
            { date: '2026-05-05', value: 130 }, { date: '2026-05-20', value: 145 },
            { date: '2026-06-05', value: 138 }, { date: '2026-06-20', value: 128 },
          ],
          triglycerides: [
            { date: '2026-01-05', value: 140 }, { date: '2026-01-20', value: 150 },
            { date: '2026-02-05', value: 135 }, { date: '2026-02-20', value: 160 },
            { date: '2026-03-05', value: 145 }, { date: '2026-03-20', value: 170 },
            { date: '2026-04-05', value: 155 }, { date: '2026-04-20', value: 165 },
            { date: '2026-05-05', value: 150 }, { date: '2026-05-20', value: 175 },
            { date: '2026-06-05', value: 160 }, { date: '2026-06-20', value: 155 },
          ],
          pulse: [
            { date: '2026-01-05', value: 72 }, { date: '2026-01-20', value: 75 },
            { date: '2026-02-05', value: 70 }, { date: '2026-02-20', value: 78 },
            { date: '2026-03-05', value: 74 }, { date: '2026-03-20', value: 80 },
            { date: '2026-04-05', value: 73 }, { date: '2026-04-20', value: 76 },
            { date: '2026-05-05', value: 72 }, { date: '2026-05-20', value: 79 },
            { date: '2026-06-05', value: 77 }, { date: '2026-06-20', value: 74 },
          ],
          blood_pressure: [
            { date: '2026-01-05', value: '120/80' }, { date: '2026-01-20', value: '130/85' },
            { date: '2026-02-05', value: '125/82' }, { date: '2026-02-20', value: '135/88' },
            { date: '2026-03-05', value: '128/84' }, { date: '2026-03-20', value: '140/90' },
            { date: '2026-04-05', value: '122/80' }, { date: '2026-04-20', value: '132/86' },
            { date: '2026-05-05', value: '138/89' }, { date: '2026-05-20', value: '142/92' },
            { date: '2026-06-05', value: '135/87' }, { date: '2026-06-20', value: '130/85' },
          ],
        });
      }
    };
    fetchData();
  }, []);

  // 1. CONDITIONAL LOGIC: Determine if we have *any* primary priority metrics
  const hasPriorityStats = useMemo(() => {
    const priorityKeys = ['blood_sugar', 'blood_pressure', 'pulse', 'total_cholesterol', 'hdl', 'ldl', 'triglycerides', 'hemoglobin', 'urea', 'creatinine', 'uric_acid', 'vldl', 'chol_hdl_ratio', 'ldl_hdl_ratio'];
    return priorityKeys.some(key => Array.isArray(data[key]) && data[key].length > 0);
  }, [data]);

  // 1b. Determine if we have any secondary metrics
  const hasSecondaryStats = useMemo(() => {
    const secondaryKeys = ['tsh', 'urine_ph', 'urine_protein', 'urine_glucose', 'urine_ketone', 'weight'];
    return secondaryKeys.some(key => Array.isArray(data[key]) && data[key].length > 0);
  }, [data]);

  const knownMetricKeys = useMemo(
    () => new Set([
      'blood_sugar',
      'blood_pressure',
      'pulse',
      'total_cholesterol',
      'hdl',
      'ldl',
      'triglycerides',
      'vldl',
      'hemoglobin',
      'urea',
      'creatinine',
      'uric_acid',
      'chol_hdl_ratio',
      'ldl_hdl_ratio',
      'tsh',
      'urine_ph',
      'urine_protein',
      'urine_glucose',
      'urine_ketone',
      'weight',
    ]),
    []
  );

  const dynamicMetrics = useMemo(() => {
    return Object.entries(data)
      .filter(([metricKey, metricList]) => (
        !knownMetricKeys.has(metricKey) &&
        Array.isArray(metricList) &&
        metricList.length > 0
      ))
      .map(([metricKey, metricList]) => {
        const numericSeries = buildNumericSeries(metricList);
        const latest = [...metricList]
          .filter(item => item?.date)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .at(-1) || metricList.at(-1);

        return {
          key: metricKey,
          label: formatMetricLabel(metricKey),
          latest,
          numericSeries,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data, knownMetricKeys]);

  const hasAnyMetrics = useMemo(
    () => hasPriorityStats || hasSecondaryStats || dynamicMetrics.length > 0,
    [hasPriorityStats, hasSecondaryStats, dynamicMetrics]
  );

  // 2. DATA PROCESSING: Format PRIORITY data cleanly
  const bloodSugarData = useMemo(() => groupByDateAndAverage(data.blood_sugar), [data.blood_sugar]);
  const bloodPressureData = useMemo(() => parseBloodPressure(data.blood_pressure), [data.blood_pressure]);
  const pulseData = useMemo(() => groupByDateAndAverage(data.pulse), [data.pulse]);
  const hemoglobinData = useMemo(() => groupByDateAndAverage(data.hemoglobin), [data.hemoglobin]);

  const cholesterolData = useMemo(() => groupMultipleMetrics({
    total_cholesterol: data.total_cholesterol,
    hdl: data.hdl,
    ldl: data.ldl,
    triglycerides: data.triglycerides,
    vldl: data.vldl,
  }), [data.total_cholesterol, data.hdl, data.ldl, data.triglycerides, data.vldl]);

  const cholRatioData = useMemo(() => groupMultipleMetrics({
    chol_hdl_ratio: data.chol_hdl_ratio,
    ldl_hdl_ratio: data.ldl_hdl_ratio,
  }), [data.chol_hdl_ratio, data.ldl_hdl_ratio]);

  const kidneyData = useMemo(() => groupMultipleMetrics({
    urea: data.urea,
    creatinine: data.creatinine,
    uric_acid: data.uric_acid,
  }), [data.urea, data.creatinine, data.uric_acid]);

  // 3. DATA PROCESSING: Format SECONDARY data cleanly
  // Note: backend key for thyroid is 'tsh' not 'thyroid'
  const thyroidData = useMemo(() => groupByDateAndAverage(data.tsh), [data.tsh]);
  const urineData = useMemo(() => groupMultipleMetrics({
    ph: data.urine_ph,
    protein: data.urine_protein,
    glucose: data.urine_glucose,
    ketone: data.urine_ketone,
  }), [data.urine_ph, data.urine_protein, data.urine_glucose, data.urine_ketone]);
  const weightData = useMemo(() => groupByDateAndAverage(data.weight), [data.weight]);

  // Utils to fetch the latest value for our stat cards bonus
  const getLatest = (arr) => arr.length > 0 ? arr[arr.length - 1] : null;
  const latestSugar = getLatest(bloodSugarData);
  const latestBP = getLatest(bloodPressureData);
  const latestPulse = getLatest(pulseData);
  const latestHgb   = getLatest(hemoglobinData);
  const latestTSH   = getLatest(thyroidData);

  /* ── shared grid layout ── */
  const grid2col = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))',
    gap: 24,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: PAGE_BG,
      padding: '32px 32px 64px',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Page header ── */}
        <header style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT_PRI, letterSpacing: '-.02em' }}>
            Health Dashboard
          </h1>
          <p style={{ color: TEXT_SUB, marginTop: 6, fontSize: 14 }}>
            Overview of your health metrics
          </p>
        </header>

        {/* ── PRIORITY METRICS ── */}
        {hasPriorityStats && (
          <div style={grid2col}>

            {bloodPressureData.length > 0 && (
              <ChartCard
                title="Blood Pressure"
                data={bloodPressureData}
                latestStat={latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : null}
                accentColor="#ef4444"
                lines={[
                  { dataKey: 'systolic',  name: 'Systolic',  color: '#ef4444' },
                  { dataKey: 'diastolic', name: 'Diastolic', color: '#60a5fa' },
                ]}
              />
            )}

            {cholesterolData.length > 0 && (
              <ChartCard
                title="Cholesterol Profile"
                data={cholesterolData}
                accentColor="#10b981"
                lines={[
                  { dataKey: 'total_cholesterol', name: 'Total',         color: '#6366f1' },
                  { dataKey: 'hdl',               name: 'HDL',           color: '#10b981' },
                  { dataKey: 'ldl',               name: 'LDL',           color: '#f59e0b' },
                  { dataKey: 'triglycerides',     name: 'Triglycerides', color: '#0ea5e9' },
                  { dataKey: 'vldl',              name: 'VLDL',          color: '#f97316' },
                ]}
              />
            )}

            {cholRatioData.length > 0 && (
              <ChartCard
                title="Cholesterol Ratios"
                data={cholRatioData}
                accentColor="#a855f7"
                lines={[
                  { dataKey: 'chol_hdl_ratio', name: 'Chol/HDL Ratio', color: '#a855f7' },
                  { dataKey: 'ldl_hdl_ratio',  name: 'LDL/HDL Ratio',  color: '#ec4899' },
                ]}
              />
            )}

            {hemoglobinData.length > 0 && (
              <ChartCard
                title="Hemoglobin Trend"
                data={hemoglobinData}
                latestStat={latestHgb ? `${latestHgb.value} g/dL` : null}
                accentColor="#dc2626"
                lines={[{ dataKey: 'value', name: 'Hemoglobin (g/dL)', color: '#dc2626' }]}
              />
            )}

            {kidneyData.length > 0 && (
              <ChartCard
                title="Kidney Profile"
                data={kidneyData}
                accentColor="#0891b2"
                lines={[
                  { dataKey: 'urea',       name: 'Urea (mg/dL)',       color: '#0891b2' },
                  { dataKey: 'creatinine', name: 'Creatinine (mg/dL)', color: '#16a34a' },
                  { dataKey: 'uric_acid',  name: 'Uric Acid (mg/dL)',  color: '#ca8a04' },
                ]}
              />
            )}

            {pulseData.length > 0 && (
              <ChartCard
                title="Heart Rate (Pulse)"
                data={pulseData}
                latestStat={latestPulse ? `${latestPulse.value} bpm` : null}
                accentColor="#a78bfa"
                lines={[{ dataKey: 'value', name: 'Pulse (bpm)', color: '#a78bfa' }]}
              />
            )}

            {bloodSugarData.length > 0 && (
              <ChartCard
                title="Blood Sugar Trend"
                data={bloodSugarData}
                latestStat={latestSugar ? `${latestSugar.value} mg/dL` : null}
                accentColor="#ef4444"
                lines={[{ dataKey: 'value', name: 'Blood Sugar', color: '#ef4444' }]}
              />
            )}

          </div>
        )}

        {/* ── SECONDARY METRICS ── */}
        {(!hasPriorityStats || hasSecondaryStats) && (
          <div style={{ ...grid2col, marginTop: hasPriorityStats ? 24 : 0 }}>

            {thyroidData.length > 0 && (
              <ChartCard
                title="Thyroid (TSH) Trend"
                data={thyroidData}
                latestStat={latestTSH ? `${latestTSH.value} mIU/L` : null}
                accentColor="#8b5cf6"
                lines={[{ dataKey: 'value', name: 'TSH (mIU/L)', color: '#8b5cf6' }]}
              />
            )}

            {urineData.length > 0 && (
              <ChartCard
                title="Urine Test Trend"
                data={urineData}
                accentColor="#f43f5e"
                lines={[
                  { dataKey: 'ph',      name: 'pH',      color: '#f43f5e' },
                  { dataKey: 'protein', name: 'Protein', color: '#3b82f6' },
                  { dataKey: 'glucose', name: 'Glucose', color: '#f59e0b' },
                  { dataKey: 'ketone',  name: 'Ketone',  color: '#10b981' },
                ]}
              />
            )}

            {weightData.length > 0 && (
              <ChartCard
                title="Weight Tracking"
                data={weightData}
                accentColor="#10b981"
                lines={[{ dataKey: 'value', name: 'Weight (kg)', color: '#10b981' }]}
              />
            )}

          </div>
        )}

        {/* ── DYNAMIC / UNKNOWN METRICS ── */}
        {dynamicMetrics.length > 0 && (
          <section style={{ marginTop: 48 }}>
            <header style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRI }}>
                Additional Metrics
              </h2>
              <p style={{ color: TEXT_SUB, fontSize: 13, marginTop: 4 }}>
                Automatically generated from uploaded report fields
              </p>
            </header>

            <div style={grid2col}>
              {dynamicMetrics.map((metric) =>
                metric.numericSeries.length > 0 ? (
                  <ChartCard
                    key={metric.key}
                    title={metric.label}
                    data={metric.numericSeries}
                    latestStat={metric.latest?.value ? String(metric.latest.value) : null}
                    accentColor="#0ea5e9"
                    lines={[{ dataKey: 'value', name: metric.label, color: '#0ea5e9' }]}
                  />
                ) : (
                  /* Non-numeric metric — show value card */
                  <div key={metric.key} style={{
                    background: CARD_BG, border: `1px solid ${CARD_BDR}`,
                    borderRadius: 16, padding: '20px 22px',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.13em',
                      textTransform: 'uppercase', color: TEAL_LABEL, marginBottom: 6 }}>
                      Metric
                    </p>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: TEXT_PRI, marginBottom: 18 }}>
                      {metric.label}
                    </h3>
                    <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em',
                      color: TEXT_SUB, marginBottom: 4 }}>
                      Latest Value
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 800, color: '#0ea5e9' }}>
                      {metric.latest?.value ?? 'N/A'}
                    </p>
                    <p style={{ fontSize: 12, color: TEXT_SUB, marginTop: 6 }}>
                      Date: {metric.latest?.date ?? 'N/A'}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* ── HEALTH INSIGHTS ── */}
        {/* <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 24,
          marginTop: 48,
          alignItems: 'start',
        }}>
          <div />

          <div style={{
            background: CARD_BG, border: `1px solid ${CARD_BDR}`,
            borderRadius: 16, padding: '20px 22px',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRI, marginBottom: 18 }}>
              Health Insights
            </h3>

            {hasAnyMetrics ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: '#14291f', border: '1px solid #1db95430',
                  borderRadius: 12, padding: 16,
                }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: '#1db95420', border: '1px solid #1db95440',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <TrendingUp size={14} color="#4ade80" />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#4ade80', marginBottom: 4 }}>
                        Target Achieved
                      </p>
                      <p style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6 }}>
                        Your latest blood sugar test results are within the normal range. Keep up the good work!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    bg: '#14291f', bdr: '#1db95430',
                    iconBg: '#1db95420', iconBdr: '#1db95440',
                    icon: <TrendingUp size={14} color="#4ade80" />,
                    title: 'Great Progress!', titleColor: '#4ade80',
                    body: 'Your cholesterol levels have improved by 15% this month.',
                  },
                  {
                    bg: CARD_BG, bdr: '#6366f130',
                    iconBg: '#6366f120', iconBdr: '#6366f140',
                    icon: <Activity size={14} color="#818cf8" />,
                    title: 'Recommendation', titleColor: '#818cf8',
                    body: 'Schedule your next mammogram screening next month.',
                  },
                ].map((ins, i) => (
                  <div key={i} style={{
                    background: ins.bg, border: `1px solid ${ins.bdr}`,
                    borderRadius: 12, padding: 16,
                  }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: ins.iconBg, border: `1px solid ${ins.iconBdr}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {ins.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: ins.titleColor, marginBottom: 4 }}>
                          {ins.title}
                        </p>
                        <p style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6 }}>{ins.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div> */}

        {/* ── EMPTY STATE ── */}
        {!hasAnyMetrics && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: 64, marginTop: 32,
            background: CARD_BG, borderRadius: 20,
            border: `2px dashed ${CARD_BDR}`,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: EMPTY_ICON_BG, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: 16,
            }}>
              <svg width="26" height="26" fill="none" stroke={TEXT_SUB} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT_PRI }}>No health data available</h3>
            <p style={{ color: TEXT_SUB, marginTop: 6, fontSize: 13 }}>
              Upload or sync your health records to see insights.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
