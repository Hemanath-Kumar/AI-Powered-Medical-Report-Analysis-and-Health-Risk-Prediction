import React, { useState, useEffect, useRef } from 'react';
import { Upload as UploadIcon, X, FileText, Image as ImageIcon, Calendar, CheckCircle, AlertCircle, Loader2, CloudUpload } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { reportsAPI } from '../services/api';

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png';

function getFileIcon(file) {
  if (!file) return null;
  if (file.type === 'application/pdf') return <FileText className="w-6 h-6 text-red-400" />;
  return <ImageIcon className="w-6 h-6 text-blue-400" />;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Upload Modal ────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSuccess }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [report, setReport] = useState({ date: '', files: [] });
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const overlayRef = useRef(null);

  // Disable background scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleDateChange(value) {
    setReport(prev => ({ ...prev, date: value }));
    if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
  }

  function handleFilesChange(newFiles) {
    if (!newFiles || newFiles.length === 0) return;

    const validFiles = [];
    const fileErrors = [];

    Array.from(newFiles).forEach(file => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        fileErrors.push(`"${file.name}" is not a supported type (PDF, JPG, PNG only).`);
      } else if (file.size > MAX_FILE_SIZE) {
        fileErrors.push(`"${file.name}" exceeds 10 MB limit (${formatBytes(file.size)}).`);
      } else {
        validFiles.push(file);
      }
    });

    if (fileErrors.length > 0) {
      setErrors(prev => ({ ...prev, file: fileErrors.join(' ') }));
    } else {
      setErrors(prev => ({ ...prev, file: '' }));
    }

    setReport(prev => ({ ...prev, files: [...prev.files, ...validFiles] }));
  }

  function removeFile(index) {
    setReport(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validate() {
    const newErrors = {};
    if (!report.date) newErrors.date = 'Please select a report date.';
    if (report.files.length === 0) newErrors.file = 'Please select at least one file to upload.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    setUploading(true);
    try {
      // Build payload
      const formData = new FormData();
      formData.append('date', report.date);
      report.files.forEach(file => formData.append('medicalimage', file));

      await reportsAPI.upload(formData);

      setUploaded(true);
      setTimeout(() => {
        onSuccess?.({ date: report.date, files: report.files });
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMessage = err.response?.data?.error || 'Upload failed. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setUploading(false);
    }
  }

  // ── Drag & Drop ─────────────────────────────────────────────────────────

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files?.length) handleFilesChange(files);
  }

  // Close on outside click
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  // ── Styles ───────────────────────────────────────────────────────────────

  const card = isDark
    ? 'bg-gray-900 border-gray-700 text-white'
    : 'bg-white border-gray-200 text-gray-900';

  const inputBase = `w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-all duration-200 focus:ring-2 ${isDark
    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-primary focus:ring-primary/30'
    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-primary/20'
    }`;

  const label = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl ${card} animate-fadeIn`}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <CloudUpload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold">Upload Medical Report</h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>PDF, JPG or PNG · Max 10 MB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">

          {/* ── Date Picker ── */}
          <div>
            <label className={label}>
              <Calendar className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
              Report Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={report.date}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => handleDateChange(e.target.value)}
              className={`${inputBase} ${errors.date ? (isDark ? 'border-red-500' : 'border-red-400') : ''}`}
              style={isDark ? { colorScheme: 'dark' } : {}}
            />
            {errors.date && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.date}
              </p>
            )}
          </div>

          {/* ── File Upload ── */}
          <div>
            <label className={label}>
              <UploadIcon className="inline w-3.5 h-3.5 mr-1 mb-0.5" />
              Report Files <span className="text-red-400">*</span>
            </label>

            {/* Drop Zone — always visible so more files can be added */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${dragOver
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : errors.file
                  ? (isDark ? 'border-red-500/60 bg-red-500/5' : 'border-red-300 bg-red-50')
                  : (isDark ? 'border-gray-600 hover:border-primary hover:bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-primary/5')
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <UploadIcon className={`w-5 h-5 ${dragOver ? 'text-primary' : (isDark ? 'text-gray-400' : 'text-gray-500')}`} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {dragOver ? 'Drop files here!' : 'Click or drag & drop'}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>PDF, JPG, PNG up to 10 MB each · Multiple files allowed</p>
              </div>
            </div>

            {/* File Preview List */}
            {report.files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {report.files.map((file, idx) => (
                  <li key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-800 border-primary/30' : 'bg-primary/5 border-primary/20'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                      {getFileIcon(file)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatBytes(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${isDark ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              multiple
              className="hidden"
              onChange={e => handleFilesChange(e.target.files)}
            />

            {errors.file && (
              <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.file}
              </p>
            )}
          </div>

          {/* ── Submit Error ── */}
          {errors.submit && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{errors.submit}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={`px-6 py-4 border-t flex items-center justify-end gap-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <button
            onClick={onClose}
            disabled={uploading}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${isDark
              ? 'text-gray-400 hover:text-white hover:bg-gray-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } disabled:opacity-40`}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={uploading || uploaded}
            className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${uploaded
              ? 'bg-primary text-white cursor-default'
              : 'bg-primary hover:bg-primary-dark active:scale-95 text-white shadow-lg shadow-primary/20'
              } disabled:opacity-60`}
          >
            {uploaded ? (
              <><CheckCircle className="w-4 h-4" /> Uploaded!</>
            ) : uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
            ) : (
              <><CloudUpload className="w-4 h-4" /> Upload</>
            )}
          </button>
        </div>
      </div>

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Upload Page ────────────────────────────────────────────────────────

const Upload = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [showModal, setShowModal] = useState(false);
  const [lastUpload, setLastUpload] = useState(null);

  function handleSuccess(payload) {
    setLastUpload(payload);
  }

  return (
    <div className={`min-h-screen p-6 sm:p-10 font-sans ${isDark ? 'bg-gray-900' : 'bg-slate-50'}`}>
      <div className="max-w-2xl mx-auto space-y-8">

        {/* ── Page Header ── */}
        <header>
          <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Upload Reports
          </h1>
          <p className={`mt-1 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
            Securely upload your medical reports for AI‑powered analysis.
          </p>
        </header>

        {/* ── Action Card ── */}
        <div className={`rounded-2xl border p-8 flex flex-col items-center text-center gap-6 shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
          }`}>
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CloudUpload className="w-10 h-10 text-primary" />
          </div>

          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Upload Medical Reports
            </h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Supports PDF, JPG and PNG · Maximum file size 10 MB
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark active:scale-95 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all duration-200"
          >
            <UploadIcon className="w-4 h-4" />
            Upload Medical Reports
          </button>

          {/* ── Last Upload Badge ── */}
          {lastUpload && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border w-full ${isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
              }`}>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">Upload successful!</p>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-green-500/70' : 'text-green-600/70'}`}>
                  {lastUpload.files.length} file{lastUpload.files.length !== 1 ? 's' : ''} uploaded &nbsp;·&nbsp; {lastUpload.date}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Guidelines Card ── */}
        <div className={`rounded-2xl border p-6 shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wide mb-4 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
            Upload Guidelines
          </h3>
          <ul className="space-y-3">
            {[
              'Ensure documents are clear and fully legible.',
              'Supported formats: PDF, JPG, PNG.',
              'Maximum file size: 10 MB per report.',
              'Only upload reports related to your personal health.',
            ].map((tip, i) => (
              <li key={i} className={`flex items-start gap-2.5 text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default Upload;