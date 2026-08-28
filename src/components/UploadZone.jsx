import { useCallback, useState, useEffect, useRef } from "react";
import { Upload, X, ChevronDown, BarChart2, Image, TrendingUp, Target } from "lucide-react";

const TIMEFRAMES = [
  { value: "", label: "Select TF" },
  "M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"
];

export default function UploadZone({ charts, onChartsChange, onChartClick }) {
  const [isDragging, setIsDragging] = useState(false);
  const previewUrlsRef = useRef(new Set());

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      previewUrlsRef.current.clear();
    };
  }, []);

  const handleFile = useCallback(
    (file) => {
      if (!file) return false;
      if (!file.type.startsWith("image/")) return false;
      if (charts.length >= 3) return false;

      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        alert("File too large. Maximum size is 10MB.");
        return false;
      }

      const url = URL.createObjectURL(file);
      previewUrlsRef.current.add(url);
      const newChart = {
        id: crypto.randomUUID(),
        file,
        preview: url,
        timeframe: ""
      };
      onChartsChange([...charts, newChart]);
      return true;
    },
    [charts, onChartsChange]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const incoming = Array.from(e.dataTransfer.files)
        .filter(f => f.type.startsWith("image/"))
        .slice(0, 3 - charts.length);
      const newCharts = incoming.map(file => {
        const url = URL.createObjectURL(file);
        previewUrlsRef.current.add(url);
        return {
          id: crypto.randomUUID(),
          file,
          preview: url,
          timeframe: "",
        };
      });
      if (newCharts.length > 0) {
        onChartsChange([...charts, ...newCharts]);
      }
    },
    [charts, onChartsChange]
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
      previewUrlsRef.current.delete(chartToRemove.preview);
    }
    onChartsChange(charts.filter(c => c.id !== id));
  };

  const updateTimeframe = (id, tf) => {
    onChartsChange(charts.map(c => c.id === id ? { ...c, timeframe: tf } : c));
  };

  return (
    <div className="flex flex-col gap-4">
      {charts.length > 0 && (
        <div className="flex flex-col gap-2">
          {charts.map((chart, idx) => (
            <div 
              key={chart.id} 
              className="card-flat !p-3 flex items-center gap-4 animate-fade-in-up"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="relative group shrink-0">
                <img 
                  src={chart.preview} 
                  alt={`Chart ${idx+1}`} 
                  className="w-16 h-16 object-cover rounded-lg cursor-zoom-in transition-opacity group-hover:opacity-80"
                  style={{ background: 'var(--surface)' }}
                  onClick={() => onChartClick && onChartClick(chart)}
                />
                <div 
                  className="absolute inset-0 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-zoom-in"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                  onClick={() => onChartClick && onChartClick(chart)}
                >
                  <span className="text-white text-[10px] font-medium px-2 py-1 rounded-md mono" style={{ background: 'var(--accent-dim)' }}>Zoom</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-main)" }}>Chart {idx+1}</p>
                <div className="relative inline-block w-28">
                  <select
                    value={chart.timeframe}
                    onChange={(e) => updateTimeframe(chart.id, e.target.value)}
                    className={`field !py-2 !pl-3 cursor-pointer ${
                      !chart.timeframe
                        ? ''
                        : ''
                    }`}
                    style={
                      !chart.timeframe
                        ? { borderColor: "rgba(209, 163, 63, 0.45)", color: "var(--neutral)" }
                        : undefined
                    }
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
                className="icon-btn shrink-0"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bearish-glow)'; e.currentTarget.style.color = 'var(--bearish)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }}
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
          className={`relative rounded-2xl border border-dashed transition-colors duration-200 overflow-hidden flex flex-col items-center justify-center text-center
            ${charts.length > 0 ? "py-8 px-6" : "py-16 px-8"}
          `}
          style={{ 
            minHeight: charts.length > 0 ? 140 : 340,
            borderColor: isDragging ? 'var(--accent)' : 'var(--border-hover)',
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
              <div className="icon-tile mb-6" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid rgba(41, 98, 255, 0.25)' }}>
                <Image size={22} />
              </div>
              
              <p className="text-[15px] font-semibold mb-1.5" style={{ color: 'var(--text-main)' }}>Drop your chart here</p>
              <p className="text-[13px] mb-6" style={{ color: 'var(--muted)' }}>or click to browse — PNG, JPG, WebP</p>

              <div className="flex flex-wrap justify-center gap-2">
                <div className="group relative">
                  <span className={`badge chip-accent cursor-help`}>
                    <BarChart2 size={13} /> HTF + LTF
                  </span>
                  <div className="menu-panel absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2.5 text-xs w-56 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10" style={{ color: 'var(--text-secondary)' }}>
                    Upload at least 2 charts: Higher timeframe (4H/D1) and lower timeframe (15m/1H)
                  </div>
                </div>
                <div className="group relative">
                  <span className={`badge chip-bullish cursor-help`}>
                    <TrendingUp size={13} /> Clear charts
                  </span>
                  <div className="menu-panel absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2.5 text-xs w-56 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10" style={{ color: 'var(--text-secondary)' }}>
                    Use clean charts with visible price action, structure, and liquidity levels
                  </div>
                </div>
                <div className="group relative">
                  <span className={`badge chip-neutral cursor-help`}>
                    <Target size={13} /> Mark timeframes
                  </span>
                  <div className="menu-panel absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2.5 text-xs w-56 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10" style={{ color: 'var(--text-secondary)' }}>
                    Select the correct timeframe for each chart after uploading
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div 
                className="icon-tile mb-4" 
                style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-glow)', color: 'var(--accent)' }}
              >
                <Upload size={20} />
              </div>
              <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-main)' }}>Add another chart</p>
              <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
                ({charts.length}/3 uploaded)
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
