import { useEffect, useState } from 'react';
import { Upload, File, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AnchorDate {
  company_name: string;
  free_date: string;
  status: 'upcoming' | 'active' | 'expired';
  notes?: string;
}

export default function AnchorFreeDateUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [anchorDates, setAnchorDates] = useState<AnchorDate[]>([]);
  const [showDates, setShowDates] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAnchorDates();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/anchor-free-dates/stats/overview`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnchorDates = async () => {
    try {
      const response = await fetch(`${API_URL}/api/anchor-free-dates`);
      if (response.ok) {
        const data = await response.json();
        setAnchorDates(data.dates || []);
      }
    } catch (err) {
      console.error('Error fetching dates:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select an Excel file (.xlsx or .xls)');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];

        const response = await fetch(`${API_URL}/api/anchor-free-dates/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64 }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(`✅ Successfully uploaded ${data.count} anchor free dates!`);
          setSelectedFile(null);
          fetchStats();
          fetchAnchorDates();

          // Clear file input
          const input = document.getElementById('file-input') as HTMLInputElement;
          if (input) input.value = '';
        } else {
          setError(data.error || 'Upload failed');
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-center space-y-3 theme-card rounded-xl">
        <RefreshCw className="w-6 h-6 text-brand-500 animate-spin mx-auto" />
        <p className="text-xs font-semibold theme-muted">Loading anchor free dates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-color)]">
        <Upload className="w-5 h-5 text-brand-500" />
        <h2 className="text-lg font-bold theme-heading">Upload Anchor Free Dates</h2>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Upload Section */}
      <div className="space-y-4 p-4 rounded-xl theme-card-subtle">
        <div className="space-y-3">
          <label className="block text-xs font-semibold theme-heading">
            📁 Select Excel File
          </label>
          <p className="text-[10px] theme-muted">
            Expected columns: Company Name, Free Date, Notes (optional)
          </p>
        </div>

        {/* File Input */}
        <div className="relative">
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label
            htmlFor="file-input"
            className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-brand-500/30 hover:border-brand-500/60 bg-brand-50/20 dark:bg-brand-950/20 cursor-pointer transition"
          >
            <File size={20} className="text-brand-500" />
            <div className="text-center">
              <p className="text-xs font-semibold theme-heading">
                {selectedFile ? selectedFile.name : 'Click to select Excel file'}
              </p>
              <p className="text-[10px] theme-muted mt-1">or drag and drop</p>
            </div>
          </label>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold text-xs transition"
        >
          {uploading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={14} />
              Upload File
            </>
          )}
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="space-y-3 p-4 rounded-xl theme-card-subtle">
          <h3 className="text-xs font-semibold theme-heading mb-3">📊 Statistics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-lg font-bold text-brand-500">{stats.total}</p>
              <p className="text-[10px] theme-muted mt-1">Total Dates</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-800/20">
              <p className="text-lg font-bold text-amber-600">{stats.upcoming}</p>
              <p className="text-[10px] theme-muted mt-1">Upcoming</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-800/20">
              <p className="text-lg font-bold text-green-600">{stats.active}</p>
              <p className="text-[10px] theme-muted mt-1">Active Today</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-800/20">
              <p className="text-lg font-bold text-red-600">{stats.expired}</p>
              <p className="text-[10px] theme-muted mt-1">Expired</p>
            </div>
          </div>
        </div>
      )}

      {/* Anchor Dates Table */}
      <div className="space-y-3 p-4 rounded-xl theme-card-subtle">
        <button
          onClick={() => setShowDates(!showDates)}
          className="flex items-center justify-between w-full text-xs font-semibold theme-heading hover:opacity-80 transition"
        >
          <span>🔓 Current Anchor Free Dates ({anchorDates.length})</span>
          <span>{showDates ? '−' : '+'}</span>
        </button>

        {showDates && anchorDates.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {anchorDates.map((date, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold theme-heading truncate">
                      {date.company_name}
                    </p>
                    {date.notes && (
                      <p className="text-[10px] theme-muted mt-0.5 truncate">{date.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-1 rounded whitespace-nowrap ${
                        date.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-400'
                          : date.status === 'upcoming'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-800/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-400'
                      }`}
                    >
                      {date.status}
                    </span>
                    <span className="text-[10px] font-semibold theme-heading whitespace-nowrap">
                      {new Date(date.free_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showDates && anchorDates.length === 0 && (
          <p className="text-[10px] theme-muted mt-3 text-center py-4">
            No anchor free dates uploaded yet
          </p>
        )}
      </div>

      {/* Instructions */}
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 space-y-2">
        <p className="font-semibold">📋 Excel Format:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Column 1: Company Name (required)</li>
          <li>Column 2: Free Date (DD/MM/YYYY or YYYY-MM-DD)</li>
          <li>Column 3: Notes (optional)</li>
        </ul>
      </div>

      {/* Download Template */}
      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-center">
        <p className="font-semibold theme-heading mb-2">Need a template?</p>
        <p className="theme-muted mb-3">Create Excel with columns: Company Name | Free Date | Notes</p>
        <button
          onClick={() => {
            const csv = 'Company Name,Free Date,Notes\nNTPC Ltd,25/09/2026,Strong market response\nBharti Airtel,15/10/2026,Expected listing Sept 20';
            const element = document.createElement('a');
            element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
            element.setAttribute('download', 'anchor_template.csv');
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition"
        >
          <Download size={12} />
          Download CSV Template
        </button>
      </div>
    </div>
  );
}
