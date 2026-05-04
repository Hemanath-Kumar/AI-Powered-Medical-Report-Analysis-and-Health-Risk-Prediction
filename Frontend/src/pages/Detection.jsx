import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Activity, Brain, Shield, X, Loader2, Sparkles, UtensilsCrossed, FileText, BookOpen, ArrowLeft, ChevronRight } from 'lucide-react';
import { detectionAPI } from '../services/api';

/* ─────────────────────────────────────────
   Heart-Risk Analyse Modal
───────────────────────────────────────── */
const AnalyseModal = ({ onClose }) => {
  const initialForm = {
    male: '', age: '', cigsPerDay: '', BPMeds: '',
    prevalentHyp: '', diabetes: '', totChol: '',
    sysBP: '', BMI: '', glucose: '',
  };

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        gender: Number(form.male), age: Number(form.age),
        cigsPerDay: Number(form.cigsPerDay), BPMeds: Number(form.BPMeds),
        prevalentHyp: Number(form.prevalentHyp), diabetes: Number(form.diabetes),
        totChol: Number(form.totChol), sysBP: Number(form.sysBP),
        BMI: parseFloat(form.BMI), glucose: Number(form.glucose),
      };
      const res = await detectionAPI.analyze(payload);
      setResult(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        'Failed to get prediction. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    { name: 'male', label: 'Sex', type: 'select', options: [{ label: 'Male', value: '1' }, { label: 'Female', value: '0' }] },
    { name: 'age', label: 'Age', placeholder: 'e.g. 45', type: 'number', min: 0 },
    { name: 'cigsPerDay', label: 'Cigarettes Per Day', placeholder: 'e.g. 0', type: 'number', min: 0 },
    { name: 'BPMeds', label: 'On BP Medication', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'prevalentHyp', label: 'Prevalent Hypertension', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'diabetes', label: 'Diabetes', type: 'select', options: [{ label: 'Yes', value: '1' }, { label: 'No', value: '0' }] },
    { name: 'totChol', label: 'Total Cholesterol', placeholder: 'e.g. 200 (mg/dL)', type: 'number', min: 0 },
    { name: 'sysBP', label: 'Systolic BP', placeholder: 'e.g. 120 (mmHg)', type: 'number', min: 0 },
    { name: 'BMI', label: 'BMI', placeholder: 'e.g. 24.5', type: 'number', min: 0 },
    { name: 'glucose', label: 'Glucose Level', placeholder: 'e.g. 85 (mg/dL)', type: 'number', min: 0 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Heart Risk Analysis</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Enter patient details for prediction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ name, label, placeholder, type, options, min }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                {type === 'select' ? (
                  <select
                    name={name} value={form[name]}
                    onChange={handleChange} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                  >
                    <option value="">Select…</option>
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number" name={name} value={form[name]}
                    onChange={handleChange} placeholder={placeholder}
                    step="any" min={min ?? undefined} required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-lg border text-sm ${result.risk === 'High' || result.prediction === 1
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              }`}>
              <p className="font-semibold text-base mb-1">
                {/* {result.risk === 'High' || result.prediction === 1
                  ? '⚠️ High Risk of Heart Disease'
                  : '✅ Low Risk of Heart Disease'} */}
              </p>
              {result.probability !== undefined && (
                <p>Probability: <span className="font-medium">{(result.probability * 100).toFixed(1)}%</span></p>
              )}
              {result.message && <p className="mt-1">{result.message}</p>}
            </div>
          )}

          <button
            type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (<><Loader2 className="h-4 w-4 animate-spin" />Analysing…</>) : 'Analyse'}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   AI Insight Popup
───────────────────────────────────────── */
const AI_OPTIONS = [
  {
    id: 'q1',
    label: 'Heart Attack Risk',
    description: 'Am I at risk of a heart attack?',
    icon: Activity,
    color: 'from-rose-500 to-red-600',
  },
  {
    id: 'q2',
    label: 'Urgency & Timeline',
    description: 'How soon could this become dangerous?',
    icon: Brain,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'q3',
    label: 'Warning Signs',
    description: 'What are the warning signs of a heart attack?',
    icon: AlertTriangle,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'q4',
    label: 'Emergency Action',
    description: 'When should I go to the hospital immediately?',
    icon: Shield,
    color: 'from-emerald-500 to-teal-600',
  },
];



const AIInsightPopup = ({ onClose, selectedResult }) => {
  const [activeOption, setActiveOption] = useState(null); // which option was selected
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState('');

  const handleOptionSelect = async (option) => {
    setActiveOption(option);
    setLoading(true);
    setError('');
    setAiResult(null);
    try {
      // POST to trigger generation, then GET to fetch the result
      const predictionQuestionId = option.id;
      const reportId = selectedResult?.id;
      const reportName = selectedResult?.reportName;
  

      await detectionAPI.postAIInsights(reportId, predictionQuestionId);
      const res = await detectionAPI.getAIInsights(reportId, predictionQuestionId);
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

      {/* Popup panel – anchored bottom-right */}
      <div
        className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[520px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
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
            <div
              className="p-1.5 rounded-lg"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">
                {activeOption ? activeOption.label : 'AI Health Assistant'}
              </h3>
              <p className="text-xs" style={{ color: 'rgba(148,163,184,0.8)' }}>
                {activeOption
                  ? selectedResult?.reportName || 'Report Analysis'
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
            /* Options view */
            <>
              {!selectedResult && (
                <div
                  className="p-3 rounded-xl text-center text-xs mb-3"
                  style={{
                    background: 'rgba(234,179,8,0.1)',
                    border: '1px solid rgba(234,179,8,0.2)',
                    color: '#fbbf24',
                  }}
                >
                  ⚠️ Select a detection result first to get personalised insights
                </div>
              )}
              {AI_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option)}
                    disabled={!selectedResult}
                    className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <div
                      className="p-2.5 rounded-xl flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${option.color.replace('from-', '').replace(' to-', ', ')})` }}
                    >
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
            /* Loading */
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
            /* Error */
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
              <button
                onClick={handleBack}
                className="mt-3 text-xs underline opacity-70 hover:opacity-100"
              >
                Try another option
              </button>
            </div>
          ) : aiResult ? (
            /* Result */
            <div className="space-y-3">
              <div
                className="p-4 rounded-xl text-sm leading-relaxed"
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
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#22c55e' }}
            />
            Active
          </span>
        </div>
      </div>
    </>
  );
};



const Detection = () => {
  const [selectedResult, setSelectedResult] = useState(null);
  const [showAnalyseModal, setShowAnalyseModal] = useState(false);
  const [showAIPopup, setShowAIPopup] = useState(false);

  // Detection results list state
  const [detectionResults, setDetectionResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(true);

  // Fetch all detection results in one GET call (aiSummary is embedded in each result)
  // Same pattern as reportsAPI.getreportAnalysis() used in Reports.jsx
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setResultsLoading(true);
        const res = await detectionAPI.getResults();
        console.log('Fetched detection results:', res.data);
        if (res.data && Array.isArray(res.data)) {
          setDetectionResults(res.data);
        } else {
          setDetectionResults([]);
        }
      } catch {
        setDetectionResults([]);
      } finally {
        setResultsLoading(false);
      }
    };
    fetchResults();
  }, []);

  const getAiSummaryText = (summary) =>
    summary?.summary || summary?.overview || summary?.result || summary?.message;

  const getAiSummaryFindings = (summary) => {
    if (Array.isArray(summary?.key_findings)) return summary.key_findings;
    if (Array.isArray(summary?.keyFindings)) return summary.keyFindings;
    return [];
  };

  const getAiDoctorAction = (summary) =>
    summary?.doctors_note || summary?.doctorNote;

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] dark:shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-inset ring-emerald-500/20 dark:ring-emerald-500/30 backdrop-blur-md';
      case 'medium':
        return 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] dark:shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-inset ring-amber-500/20 dark:ring-amber-500/30 backdrop-blur-md';
      case 'high':
        return 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)] dark:shadow-[0_0_25px_rgba(226,29,72,0.2)] ring-1 ring-inset ring-rose-500/20 dark:ring-rose-500/30 backdrop-blur-md';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-500/10 dark:ring-gray-500/20 backdrop-blur-md';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} />;
      case 'medium':
        return <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />;
      case 'high':
        return <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} />;
      default:
        return <Shield className="h-3.5 w-3.5" strokeWidth={2.5} />;
    }
  };

  return (
    <div className="space-y-8">
      {showAnalyseModal && <AnalyseModal onClose={() => setShowAnalyseModal(false)} />}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Disease Detection</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          AI-powered analysis for early disease detection and risk assessment.
        </p>
      </div>

      {/* Stats Overview intentionally hidden */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Results List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detection Results</h3>
              <button
                onClick={() => setShowAnalyseModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark active:scale-95 transition-all shadow-sm"
              >
                <Activity className="h-4 w-4" />
                Analyse
              </button>
            </div>
            <div className="p-4 space-y-4">
              {resultsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : detectionResults.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">No detection results found</div>
              ) : detectionResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => setSelectedResult(result)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${selectedResult?.id === result.id
                    ? 'border-primary bg-primary/5 dark:bg-primary/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white leading-snug">{result.reportName}</h4>
                    <div
                      className={`flex-shrink-0 flex items-center px-3 py-1.5 rounded-full border ${getRiskColor(
                        result.prediction.risk
                      )}`}
                    >
                      {getRiskIcon(result.prediction.risk)}
                      <span className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.1em]">
                        {result.prediction.risk} Risk
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {result.prediction.condition}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(result.date).toLocaleDateString()}</span>
                    <span>{result.prediction.confidence}% confidence</span>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>

        {/* Result Details */}
        <div className="lg:col-span-2">
          {selectedResult ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white leading-tight">
                    {selectedResult.reportName}
                  </h3>
                  <div
                    className={`w-fit flex-shrink-0 flex items-center px-4 py-2 rounded-full border ${getRiskColor(
                      selectedResult.prediction.risk
                    )}`}
                  >
                    {getRiskIcon(selectedResult.prediction.risk)}
                    <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.1em]">
                      {selectedResult.prediction.risk} Risk
                    </span>
                  </div>
                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Analysis</h4>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
                      {selectedResult.prediction.condition}
                    </p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${selectedResult.prediction.confidence}%` }}
                        />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedResult.prediction.confidence}% AI Confidence
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Risk Assessment</h4>
                    <div
                      className={`inline-flex items-center px-4 py-2 rounded-full border ${getRiskColor(
                        selectedResult.prediction.risk
                      )}`}
                    >
                      {getRiskIcon(selectedResult.prediction.risk)}
                      <span className="ml-2 text-[11px] font-bold uppercase tracking-[0.1em]">
                        {selectedResult.prediction.risk} Risk Level
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Based on AI analysis of imaging data
                    </p>
                  </div>
                </div>

                <div className="bg-primary/5 dark:bg-primary/20 p-4 rounded-lg">
                  <h4 className="font-medium text-primary-dark dark:text-primary-light mb-3">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {selectedResult.prediction.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-primary-dark dark:text-primary-light">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ── AI Summary (embedded from getResults response) ── */}
                {selectedResult.aiSummary && (
                  <div className="mt-6 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">AI Summary</h4>
                    </div>
                    <div className="space-y-4">
                      {/* Overview */}
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {getAiSummaryText(selectedResult.aiSummary) || JSON.stringify(selectedResult.aiSummary)}
                      </p>
                      {/* Key Findings */}
                      {getAiSummaryFindings(selectedResult.aiSummary).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-2">Key Findings</p>
                          <ul className="space-y-1.5">
                            {getAiSummaryFindings(selectedResult.aiSummary).map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {/* Doctor Action */}
                      {getAiDoctorAction(selectedResult.aiSummary) && (
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
                          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">🩺 Doctor Action</p>
                          <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">{getAiDoctorAction(selectedResult.aiSummary)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <Brain className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a Detection Result
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a result from the list to view detailed AI analysis and
                recommendations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── AI Floating Button ─── */}
      <button
        onClick={() => setShowAIPopup((prev) => !prev)}
        title="AI Health Assistant"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95"
        style={{
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
          boxShadow: '0 0 0 0 rgba(99,102,241,0.7)',
          animation: 'ai-pulse 2.5s infinite',
        }}
      >
        <Sparkles className="h-6 w-6 text-white" />
      </button>

      {/* Pulse keyframes */}
      <style>{`
        @keyframes ai-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.7); }
          70%  { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
      `}</style>

      {/* ─── AI Insight Popup ─── */}
      {showAIPopup && (
        <AIInsightPopup
          onClose={() => setShowAIPopup(false)}
          selectedResult={selectedResult}
        />
      )}
    </div>
  );
};

export default Detection;