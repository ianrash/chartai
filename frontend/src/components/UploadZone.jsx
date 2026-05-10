import { useCallback, useState, useEffect } from "react";
import { Upload, X, ChevronDown, BarChart2, Info, Image } from "lucide-react";

const TIMEFRAMES = [
  { value: "", label: "Select TF" },
  "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"
];

export default function UploadZone({ charts, onChartsChange, onChartClick }) {
  const [isDragging, setIsDragging] = useState(false);

  // Cleanup function to revoke all blob URLs when component unmounts
  useEffect(() => {
    return () => {
      charts.forEach(chart => {
        if (chart.preview) {
          URL.revokeObjectURL(chart.preview);
        }
      });
    };
  }, []);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) return;
      if (charts.length >= 3) return;

      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert("File too large. Maximum size is 10MB.");
        return;
      }

      const url = URL.createObjectURL(file);
      const newChart = {
        id: crypto.randomUUID(),
        file,
        preview: url,
        timeframe: ""
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

  // Fix memory leak - revoke blob URL when removing charts
  const removeChart = (id) => {
    const chartToRemove = charts.find(c => c.id === id);
    if (chartToRemove && chartToRemove.preview) {
      URL.revokeObjectURL(chartToRemove.preview);
    }
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
              <div className="relative">
                <img 
                  src={chart.preview} 
                  alt={`Chart ${idx+1}`} 
                  className="w-16 h-16 object-cover rounded-lg bg-black/50 cursor-zoom-in"
                  onClick={() => onChartClick && onChartClick(chart)}
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors rounded-lg cursor-zoom-in flex items-center justify-center" onClick={() => onChartClick && onChartClick(chart)}>
                  <span className="opacity-0 hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Zoom</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-main mb-1">Chart {idx+1}</p>
                <div className="relative inline-block">
                  <select
                    value={chart.timeframe}
                    onChange={(e) => updateTimeframe(chart.id, e.target.value)}
                    className={`appearance-none bg-surface border text-xs rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-accent ${!chart.timeframe ? 'border-yellow-500/50 text-yellow-500' : 'border-white/10 text-main'}`}
                  >
                    {TIMEFRAMES.map(tf => typeof tf === 'object' ? <option key={tf.value} value={tf.value}>{tf.label}</option> : <option key={tf} value={tf}>{tf}</option>)}
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
          {charts.length === 0 ? (
            <>
              {/* Illustrated empty state */}
              <div className="relative mb-4">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                  <Image className="text-accent/60" size={40} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-surface border border-white/10 flex items-center justify-center">
                  <BarChart2 className="text-muted" size={18} />
                </div>
              </div>
              <p className="text-main font-semibold mb-1">Drop your chart here</p>
              <p className="text-muted text-xs mb-4">or click to browse — PNG, JPG, WebP</p>

              {/* Helpful tips */}
              <div className="flex flex-wrap justify-center gap-2 max-w-xs">
                <div className="group relative px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent cursor-help">
                  <span className="flex items-center gap-1.5"><BarChart2 size={12} /> HTF + LTF</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-white/10 rounded-lg text-xs text-main w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Upload at least 2 charts: Higher timeframe (4H/D1) and lower timeframe (15m/1H)
                  </div>
                </div>
                <div className="group relative px-3 py-1.5 rounded-lg bg-bullish/10 border border-bullish/20 text-xs text-bullish cursor-help">
                  <span className="flex items-center gap-1.5">📈 Clear charts</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-white/10 rounded-lg text-xs text-main w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Use clean charts with visible price action, structure, and liquidity levels
                  </div>
                </div>
                <div className="group relative px-3 py-1.5 rounded-lg bg-neutral/10 border border-neutral/20 text-xs text-neutral cursor-help">
                  <span className="flex items-center gap-1.5">🎯 Mark timeframes</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface border border-white/10 rounded-lg text-xs text-main w-48 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Select the correct timeframe for each chart after uploading
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-3">
                <Upload className="text-accent" size={20} />
              </div>
              <p className="text-main font-semibold mb-1">Add another chart</p>
              <p className="text-muted text-xs">
                ({charts.length}/3 uploaded)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
