import { useCallback, useState, useEffect } from "react";
import { Upload, X, ChevronDown, BarChart2, Info, Image, TrendingUp, Target } from "lucide-react";

const TIMEFRAMES = [
  { value: "", label: "Select TF" },
  "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"
];

export default function UploadZone({ charts, onChartsChange, onChartClick }) {
  const [isDragging, setIsDragging] = useState(false);

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
      // Process all dropped files, not just the first one
      const files = Array.from(e.dataTransfer.files);
      files.forEach(file => handleFile(file));
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
      {charts.length > 0 && (
        <div className="flex flex-col gap-3">
          {charts.map((chart, idx) => (
            <div 
              key={chart.id} 
              className="card p-3 flex items-center gap-4 animate-fade-in-up"
              style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
            >
              <div className="relative group">
                <img 
                  src={chart.preview} 
                  alt={`Chart ${idx+1}`} 
                  className="w-16 h-16 object-cover rounded-xl cursor-zoom-in transition-transform group-hover:scale-105"
                  style={{ background: 'var(--surface)' }}
                  onClick={() => onChartClick && onChartClick(chart)}
                />
                <div 
                  className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-zoom-in"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                  onClick={() => onChartClick && onChartClick(chart)}
                >
                  <span className="text-white text-[10px] font-medium px-2 py-1 rounded-md" style={{ background: 'var(--accent)' }}>Zoom</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-display font-semibold text-main mb-2">Chart {idx+1}</p>
                <div className="relative inline-block">
                  <select
                    value={chart.timeframe}
                    onChange={(e) => updateTimeframe(chart.id, e.target.value)}
                    className={`appearance-none bg-surface border text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none transition-all cursor-pointer
                      ${!chart.timeframe 
                        ? 'border-amber-500/50 text-amber-500' 
                        : 'border border-gray-600/30 text-main hover:border-gray-500/50'
                      }`}
                    style={{ background: 'var(--surface)' }}
                  >
                    {TIMEFRAMES.map(tf => typeof tf === 'object' ? <option key={tf.value} value={tf.value}>{tf.label}</option> : <option key={tf} value={tf}>{tf}</option>)}
                  </select>
                  <ChevronDown 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" 
                    size={14} 
                    style={{ color: 'var(--muted)' }} 
                  />
                </div>
              </div>
              <button 
                onClick={() => removeChart(chart.id)}
                className="w-9 h-9 rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                title="Remove chart"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {charts.length < 3 && (
        <div
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden flex flex-col items-center justify-center text-center
            ${isDragging 
              ? "scale-[1.01]" 
              : "hover:scale-[1.005] hover:border-dashed"
            }
            ${charts.length > 0 ? "py-8 px-6" : "py-16 px-8"}
          `}
          style={{ 
            minHeight: charts.length > 0 ? 140 : 340,
            borderColor: isDragging ? 'var(--accent)' : 'var(--border)',
            background: isDragging ? 'var(--accent-glow)' : 'var(--surface)',
          }}
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
              <div className="relative mb-6">
                <div 
                  className="w-28 h-28 rounded-3xl flex items-center justify-center border animate-float"
                  style={{ 
                    background: 'linear-gradient(135deg, var(--accent-glow), var(--surface-2))', 
                    borderColor: 'var(--accent)',
                    boxShadow: '0 0 40px var(--accent-glow)'
                  }}
                >
                  <Image className="text-accent" size={48} />
                </div>
                <div 
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl flex items-center justify-center animate-pulse"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <BarChart2 className="text-accent" size={20} />
                </div>
              </div>
              
              <p className="text-main font-display font-semibold text-lg mb-2">Drop your chart here</p>
              <p className="text-muted text-sm mb-6">or click to browse — PNG, JPG, WebP</p>

              <div className="flex flex-wrap justify-center gap-3">
                <div className="group relative px-4 py-2.5 rounded-xl border text-xs font-medium cursor-help transition-all hover:scale-105" style={{ background: 'var(--accent-glow)', borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent)' }}>
                  <span className="flex items-center gap-2"><BarChart2 size={14} /> HTF + LTF</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 rounded-xl text-xs text-secondary w-56 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                    Upload at least 2 charts: Higher timeframe (4H/D1) and lower timeframe (15m/1H)
                  </div>
                </div>
                <div className="group relative px-4 py-2.5 rounded-xl border text-xs font-medium cursor-help transition-all hover:scale-105" style={{ background: 'var(--bullish-glow)', borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--bullish)' }}>
                  <span className="flex items-center gap-2"><TrendingUp size={14} /> Clear charts</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 rounded-xl text-xs text-secondary w-56 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                    Use clean charts with visible price action, structure, and liquidity levels
                  </div>
                </div>
                <div className="group relative px-4 py-2.5 rounded-xl border text-xs font-medium cursor-help transition-all hover:scale-105" style={{ background: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)', color: 'var(--neutral)' }}>
                  <span className="flex items-center gap-2"><Target size={14} /> Mark timeframes</span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 rounded-xl text-xs text-secondary w-56 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}>
                    Select the correct timeframe for each chart after uploading
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)' }}
              >
                <Upload className="text-accent" size={24} />
              </div>
              <p className="text-main font-display font-semibold mb-1">Add another chart</p>
              <p className="text-muted text-sm">
                ({charts.length}/3 uploaded)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}