import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Calendar, Loader2, Sparkles, UtensilsCrossed, Dumbbell, FileText, Stethoscope, ArrowLeft, ChevronRight, X } from 'lucide-react';
import { reportsAPI } from '../services/api';

/* ─────────────────────────────────────────
   Metric metadata: label, unit, normal range
   Keys match the backend PATTERNS dict exactly
───────────────────────────────────────── */
const METRIC_META = {
  // Blood Sugar
  blood_sugar:          { label: 'Blood Sugar (Fasting)', unit: 'mg/dL', normal: '70–99' },
  hba1c:                { label: 'HbA1c', unit: '%', normal: '<5.7' },

  // Lipid Profile
  total_cholesterol:    { label: 'Total Cholesterol', unit: 'mg/dL', normal: '<200' },
  hdl:                  { label: 'HDL Cholesterol', unit: 'mg/dL', normal: '>40' },
  ldl:                  { label: 'LDL Cholesterol', unit: 'mg/dL', normal: '<100' },
  vldl:                 { label: 'VLDL Cholesterol', unit: 'mg/dL', normal: '2–30' },
  triglycerides:        { label: 'Triglycerides', unit: 'mg/dL', normal: '<150' },
  chol_hdl_ratio:       { label: 'Chol/HDL Ratio', unit: '', normal: '<5' },
  ldl_hdl_ratio:        { label: 'LDL/HDL Ratio', unit: '', normal: '<3.5' },

  // Kidney Function
  creatinine:           { label: 'Creatinine', unit: 'mg/dL', normal: '0.7–1.3' },
  urea:                 { label: 'Blood Urea', unit: 'mg/dL', normal: '7–20' },
  bun:                  { label: 'BUN', unit: 'mg/dL', normal: '7–20' },
  uric_acid:            { label: 'Uric Acid', unit: 'mg/dL', normal: '3.4–7.0' },
  egfr:                 { label: 'eGFR', unit: 'mL/min', normal: '>60' },

  // Liver Function
  sgpt_alt:             { label: 'SGPT / ALT', unit: 'U/L', normal: '7–56' },
  sgot_ast:             { label: 'SGOT / AST', unit: 'U/L', normal: '10–40' },
  bilirubin_total:      { label: 'Total Bilirubin', unit: 'mg/dL', normal: '0.1–1.2' },
  bilirubin_direct:     { label: 'Direct Bilirubin', unit: 'mg/dL', normal: '0–0.3' },
  bilirubin_indirect:   { label: 'Indirect Bilirubin', unit: 'mg/dL', normal: '0.1–1.0' },
  alkaline_phosphatase: { label: 'Alkaline Phosphatase', unit: 'U/L', normal: '44–147' },
  protein_total:        { label: 'Total Protein', unit: 'g/dL', normal: '6.3–8.2' },
  albumin:              { label: 'Albumin', unit: 'g/dL', normal: '3.4–5.4' },
  globulin:             { label: 'Globulin', unit: 'g/dL', normal: '2.0–3.5' },
  a_g_ratio:            { label: 'A/G Ratio', unit: '', normal: '1.1–2.5' },

  // Complete Blood Count
  hemoglobin:           { label: 'Hemoglobin', unit: 'g/dL', normal: '12–17' },
  rbc:                  { label: 'RBC Count', unit: 'M/µL', normal: '4.5–5.5' },
  wbc:                  { label: 'WBC Count', unit: 'K/µL', normal: '4.5–11.0' },
  platelets:            { label: 'Platelets', unit: 'K/µL', normal: '150–400' },
  hematocrit:           { label: 'Hematocrit', unit: '%', normal: '38–52' },
  mcv:                  { label: 'MCV', unit: 'fL', normal: '80–100' },
  mch:                  { label: 'MCH', unit: 'pg', normal: '27–33' },
  mchc:                 { label: 'MCHC', unit: 'g/dL', normal: '32–36' },
  rdw:                  { label: 'RDW', unit: '%', normal: '11.5–14.5' },

  // Thyroid
  tsh:                  { label: 'TSH', unit: 'µIU/mL', normal: '0.4–4.0' },
  t3:                   { label: 'T3', unit: 'ng/dL', normal: '80–200' },
  t4:                   { label: 'T4', unit: 'µg/dL', normal: '5.0–12.0' },
  free_t3:              { label: 'Free T3', unit: 'pg/mL', normal: '2.3–4.2' },
  free_t4:              { label: 'Free T4', unit: 'ng/dL', normal: '0.8–1.8' },

  // Electrolytes
  sodium:               { label: 'Sodium', unit: 'mEq/L', normal: '136–145' },
  potassium:            { label: 'Potassium', unit: 'mEq/L', normal: '3.5–5.0' },
  chloride:             { label: 'Chloride', unit: 'mEq/L', normal: '98–106' },
  calcium:              { label: 'Calcium', unit: 'mg/dL', normal: '8.5–10.5' },
  magnesium:            { label: 'Magnesium', unit: 'mg/dL', normal: '1.7–2.2' },
  phosphorus:           { label: 'Phosphorus', unit: 'mg/dL', normal: '2.5–4.5' },

  // Vitamins
  vitamin_d:            { label: 'Vitamin D', unit: 'ng/mL', normal: '20–50' },
  vitamin_b12:          { label: 'Vitamin B12', unit: 'pg/mL', normal: '200–900' },
  folate:               { label: 'Folate', unit: 'ng/mL', normal: '>3.0' },

  // Urine Tests
  urine_ph:             { label: 'Urine pH', unit: '', normal: '4.5–8.0' },
  urine_protein:        { label: 'Urine Protein', unit: 'mg/dL', normal: 'Negative' },
  urine_glucose:        { label: 'Urine Glucose', unit: 'mg/dL', normal: 'Negative' },
  urine_ketone:         { label: 'Urine Ketone', unit: '', normal: 'Negative' },
  urine_rbc:            { label: 'Urine RBC', unit: '/HPF', normal: '0–2' },
  urine_wbc:            { label: 'Urine WBC', unit: '/HPF', normal: '0–5' },

  // Vitals
  blood_pressure:       { label: 'Blood Pressure', unit: 'mmHg', normal: '<120/80' },
  pulse:                { label: 'Pulse / Heart Rate', unit: 'bpm', normal: '60–100' },
  temperature:          { label: 'Temperature', unit: '°F', normal: '98.6' },
  weight:               { label: 'Weight', unit: 'kg', normal: '—' },
  height:               { label: 'Height', unit: 'cm', normal: '—' },
  bmi:                  { label: 'BMI', unit: 'kg/m²', normal: '18.5–24.9' },

  // Legacy / fallback keys
  cholesterol:          { label: 'Cholesterol', unit: 'mg/dL', normal: '<200' },
  sugar:                { label: 'Blood Sugar', unit: 'mg/dL', normal: '70–99' },
};

// Rotating colour palette for metric cards
const CARD_COLORS = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20',    val: 'text-blue-600 dark:text-blue-400',    lbl: 'text-blue-800 dark:text-blue-300',    note: 'text-blue-500' },
  { bg: 'bg-green-50 dark:bg-green-900/20',  val: 'text-green-600 dark:text-green-400',  lbl: 'text-green-800 dark:text-green-300',  note: 'text-green-500' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20',val: 'text-purple-600 dark:text-purple-400',lbl: 'text-purple-800 dark:text-purple-300', note: 'text-purple-500' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20',  val: 'text-amber-600 dark:text-amber-400',  lbl: 'text-amber-800 dark:text-amber-300',  note: 'text-amber-500' },
  { bg: 'bg-pink-50 dark:bg-pink-900/20',    val: 'text-pink-600 dark:text-pink-400',    lbl: 'text-pink-800 dark:text-pink-300',    note: 'text-pink-500' },
  { bg: 'bg-teal-50 dark:bg-teal-900/20',    val: 'text-teal-600 dark:text-teal-400',    lbl: 'text-teal-800 dark:text-teal-300',    note: 'text-teal-500' },
  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',val: 'text-indigo-600 dark:text-indigo-400',lbl: 'text-indigo-800 dark:text-indigo-300', note: 'text-indigo-500' },
  { bg: 'bg-rose-50 dark:bg-rose-900/20',    val: 'text-rose-600 dark:text-rose-400',    lbl: 'text-rose-800 dark:text-rose-300',    note: 'text-rose-500' },
];

/* ─────────────────────────────────────────
   AI Report Popup – option definitions
───────────────────────────────────────── */
const REPORT_AI_OPTIONS = [
  {
    id: 'food',
    label: 'Food Summary',
    description: 'Personalised diet & nutrition advice based on your report',
    icon: UtensilsCrossed,
    gradient: 'linear-gradient(135deg,#10b981,#059669)',
  },
  {
    id: 'workout',
    label: 'Workout Summary',
    description: 'Safe exercise plan tailored to your health metrics',
    icon: Dumbbell,
    gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
  },
  {
    id: 'short_summary',
    label: 'Short Report Summary',
    description: 'Plain-language overview of your key findings',
    icon: FileText,
    gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)',
  },
  {
    id: 'specialist',
    label: 'Specialist Doctor Check',
    description: 'Which specialist you should consult based on your report',
    icon: Stethoscope,
    gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  },
];

const AIReportPopup = ({ onClose, selectedReport }) => {
  const [activeOption, setActiveOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  const handleOptionSelect = async (option) => {
    setActiveOption(option);
    setLoading(true);
    setError('');
    setAiResult(null);

    try {
      // POST: send reportId + type to backend
      await reportsAPI.postReportAIInsights(selectedReport?.id, option.id);

      // GET: fetch the AI result from backend
      const res = await reportsAPI.fetchReportAIResult(selectedReport?.id, option.id);
      setAiResult(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        'Unable to fetch AI insights. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveOption(null);
    setAiResult(null);
    setError('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Popup – anchored bottom-right */}
      <div
        className="fixed bottom-24 right-6 z-50 w-[370px] max-h-[560px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.08)' }}
        >
          <div className="flex items-center gap-3">
            {activeOption && (
              <button
                onClick={handleBack}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                {activeOption ? activeOption.label : 'AI Report Assistant'}
              </h3>
              <p className="text-xs" style={{ color: 'rgba(148,163,184,0.8)' }}>
                {activeOption
                  ? selectedReport?.reportName || 'Report Analysis'
                  : 'Select an insight type'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!activeOption ? (
            <>
              {!selectedReport && (
                <div
                  className="p-3 rounded-xl text-center text-xs mb-3"
                  style={{
                    background: 'rgba(234,179,8,0.1)',
                    border: '1px solid rgba(234,179,8,0.2)',
                    color: '#fbbf24',
                  }}
                >
                  ⚠️ Select a report first to get personalised AI insights
                </div>
              )}
              {REPORT_AI_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option)}
                    disabled={!selectedReport}
                    className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: option.gradient }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{option.label}</p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(148,163,184,0.7)' }}>
                        {option.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                  </button>
                );
              })}
            </>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                <Loader2 className="h-7 w-7 text-white animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium text-sm">Analysing your report…</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(148,163,184,0.6)' }}>
                  AI is processing the data
                </p>
              </div>
            </div>
          ) : error ? (
            <div
              className="p-4 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#fca5a5',
              }}
            >
              <p className="font-medium mb-1">⚠️ Error</p>
              <p className="text-xs opacity-80">{error}</p>
              <button onClick={handleBack} className="mt-3 text-xs underline opacity-70 hover:opacity-100">
                Try another option
              </button>
            </div>
          ) : aiResult ? (
            <div className="space-y-3">
              <div
                className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(226,232,240,0.9)',
                }}
              >
                {typeof aiResult === 'string'
                  ? aiResult
                  : aiResult.result || aiResult.message || aiResult.text || JSON.stringify(aiResult, null, 2)}
              </div>
              {aiResult.tips && Array.isArray(aiResult.tips) && (
                <div className="space-y-2">
                  {aiResult.tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded-lg text-xs"
                      style={{ background: 'rgba(99,102,241,0.08)', color: 'rgba(196,181,253,0.9)' }}
                    >
                      <span className="mt-0.5 flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 flex items-center justify-between text-xs"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(100,116,139,0.7)',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <span>Powered by HealthAI</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
            Active
          </span>
        </div>
      </div>
    </>
  );
};

/* ─────────────────────────────────────────
   Main Reports Component
───────────────────────────────────────── */
const Reports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportsData, setReportsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAIPopup, setShowAIPopup] = useState(false);



  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await reportsAPI.getreportAnalysis();
        if (res.data && Array.isArray(res.data)) {
          setReportsData(res.data);
        } else {
          setReportsData([]);
        }
      } catch (err) {
        console.error('Error fetching reports data:', err);
        setReportsData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  /* Build metric entries from the selected report */
  const metricEntries = selectedReport?.metrics
    ? Object.entries(selectedReport.metrics)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([key, value]) => ({
          key,
          value,
          meta: METRIC_META[key] ?? { label: key.replace(/_/g, ' '), unit: '', normal: '—' },
        }))
    : [];

  const filtered = reportsData.filter((r) =>
    r.reportName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Report Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View and analyze your medical reports with AI-powered insights.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Reports List ── */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results</h3>
            </div>
            <div className="p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">No reports found</div>
              ) : filtered.map((result) => (
                <div
                  key={result.id}
                  onClick={() => setSelectedReport(result)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    selectedReport?.id === result.id
                      ? 'border-primary bg-primary/5 dark:bg-primary/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{result.reportName}</h4>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(result.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {result.status}
                        </span>
                      </div>
                    </div>
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Report Details ── */}
        <div className="lg:col-span-2 space-y-6">
          {selectedReport ? (
            <>
              {/* AI Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {selectedReport.reportName}
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Analysis Summary</h4>
                  <p className="text-gray-700 dark:text-gray-300">{selectedReport.aiSummary}</p>
                </div>
              </div>

              {/* Dynamic Metric Cards */}
              {metricEntries.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {metricEntries.map(({ key, value, meta }, idx) => {
                    const c = CARD_COLORS[idx % CARD_COLORS.length];
                    return (
                      <div key={key} className={`${c.bg} p-4 rounded-lg`}>
                        <div className={`text-2xl font-bold ${c.val}`}>
                          {value}
                          {meta.unit && (
                            <span className="text-xs font-normal ml-1 opacity-80">{meta.unit}</span>
                          )}
                        </div>
                        <div className={`text-sm font-medium mt-1 ${c.lbl}`}>
                          {meta.label}
                        </div>
                        {meta.normal && meta.normal !== '—' && (
                          <div className={`text-xs mt-1 ${c.note}`}>
                            Normal: {meta.normal}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400 shadow-sm border border-gray-100 dark:border-gray-700">
                  No metrics available for this report.
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Eye className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Report</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a report from the list to view detailed analysis and metrics.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ─── AI Floating Button ─── */}
      <button
        onClick={() => setShowAIPopup((prev) => !prev)}
        title="AI Report Assistant"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
        style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
          animation: 'ai-report-pulse 2.5s infinite',
        }}
      >
        <Sparkles className="h-6 w-6 text-white" />
      </button>

      <style>{`
        @keyframes ai-report-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.7); }
          70%  { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
      `}</style>

      {/* ─── AI Report Popup ─── */}
      {showAIPopup && (
        <AIReportPopup
          onClose={() => setShowAIPopup(false)}
          selectedReport={selectedReport}
        />
      )}
    </div>
  );
};

export default Reports;