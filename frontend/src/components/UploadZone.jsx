import { useCallback, useState } from "react";
import { Upload, X, ChevronDown } from "lucide-react";

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];

export default function UploadZone({ charts, onChartsChange }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      if (charts.length >= 3) return;
      
      const url = URL.createObjectURL(file);
      const newChart = {
        id: Math.random().toString(36).substring(7),
        file,
        preview: url,
        timeframe: "1H" // Default
      };
      onChartsChange([...charts, newChart]);
    },
    [charts, onChartsChange]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);

  const onFileChange = (e) => handleFile(e.target.files[0]);

  const removeChart = (id) => {
    onChartsChange(charts.filter(c => c.id !== id));
  };

  const updateTimeframe = (id, tf) => {
    onChartsChange(charts.map(c => c.id === id ? { ...c, timeframe: tf } : c));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* List of uploaded charts */}
      {charts.length > 0 && (
        <div className="flex flex-col gap-3">
          {charts.map((chart, idx) => (
            <div key={chart.id} className="card p-3 flex items-center gap-4 bg-surface-2 animate-fade-in border border-white/10">
              <img src={chart.preview} alt={`Chart ${idx+1}`} className="w-16 h-16 object-cover rounded-lg bg-black/50" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-main mb-1">Chart {idx+1}</p>
                <div className="relative inline-block">
                  <select
                    value={chart.timeframe}
                    onChange={(e) => updateTimeframe(chart.id, e.target.value)}
                    className="appearance-none bg-surface border border-white/10 text-main text-xs rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-accent"
                  >
                    {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" size={12} />
                </div>
              </div>
              <button 
                onClick={() => removeChart(chart.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-muted hover:text-bearish transition-colors"
                title="Remove chart"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropzone for adding more */}
      {charts.length < 3 && (
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center text-center
            ${isDragging ? "border-accent bg-accent/10 scale-[1.01]" : "border-white/10 bg-surface hover:border-accent/40 hover:bg-surface-2"}
            ${charts.length > 0 ? "py-8" : "py-16 px-8"}
          `}
          style={{ minHeight: charts.length > 0 ? 120 : 320 }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer z-10"
            onChange={onFileChange}
          />
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
            <Upload className="text-accent" size={20} />
          </div>
          <p className="text-main font-semibold mb-1">
            {charts.length > 0 ? "Add another chart" : "Drop your chart here"}
          </p>
          <p className="text-muted text-xs">
            {charts.length > 0 ? `(${charts.length}/3 uploaded)` : "or click to browse — PNG, JPG, WebP"}
          </p>
        </div>
      )}
    </div>
  );
}
