"use client";

/** Memvisualisasikan pengeluaran harian untuk rentang waktu yang dipilih. */
import { useEffect, useId, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Check, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { FinanceDialog } from "@/components/finance/FinanceDialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const PLOT_HEIGHT = 200;
const TOP_SPACE = 48;
const BOTTOM_SPACE = 12;
const MIN_BAR_HEIGHT = 6;
// Jarak antarbatang: kecilkan agar lebih rapat, besarkan agar lebih renggang.
const BAR_CATEGORY_GAP = "6%";
const MAX_AMOUNT = 90000;
const SCALE_TICKS = [90000, 60000, 30000, 0];
const PERIODS = [7, 14, 30] as const;

export default function ExpenseChart({ data }: { data: { date: string; day: string; amount: number }[] }) {
  const titleId = useId();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(7);
  const [showPeriods, setShowPeriods] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(6);
  const [isPressing, setIsPressing] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const pointerBoundsRef = useRef<{ left: number; width: number } | null>(null);
  const pendingIndexRef = useRef<number | null>(null);
  const pointerFrameRef = useRef<number | null>(null);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const visibleData = data.slice(-period).map((item) => ({ ...item, barAmount: Math.min(MAX_AMOUNT, item.amount) }));
  const activeIndex = Math.min(selectedIndex, visibleData.length - 1);
  const selected = visibleData[activeIndex];
  const valueLabel = formatCurrency(selected?.amount ?? 0);
  const barHeight = Math.max(MIN_BAR_HEIGHT, (selected?.barAmount ?? 0) / MAX_AMOUNT * (PLOT_HEIGHT - TOP_SPACE - BOTTOM_SPACE));
  // Clamp the bubble at the first/last day while its pointer stays over the bar.
  const tooltipWidth = Math.min(chartWidth, Math.max(90, valueLabel.length * 7 + 24));
  const barCenter = chartWidth * (activeIndex + 0.5) / visibleData.length;
  const tooltipLeft = Math.max(0, Math.min(chartWidth - tooltipWidth, barCenter - tooltipWidth / 2));
  const labelIndices = period === 7
    ? visibleData.map((_, index) => index)
    : Array.from({ length: 5 }, (_, index) => Math.round(index * (visibleData.length - 1) / 4));
  // Replace the nearest tick with the selected day so its label remains visible.
  if (activeIndex >= 0 && !labelIndices.includes(activeIndex)) {
    const nearest = labelIndices.reduce((best, value, index) => Math.abs(value - activeIndex) < Math.abs(labelIndices[best] - activeIndex) ? index : best, 0);
    labelIndices[nearest] = activeIndex;
  }
  const formatRangeDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

  useEffect(() => () => {
    if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current);
  }, []);

  const cancelPointerFrame = () => {
    if (pointerFrameRef.current !== null) cancelAnimationFrame(pointerFrameRef.current);
    pointerFrameRef.current = null;
    pendingIndexRef.current = null;
  };

  const finishPointerSelection = (commitPending: boolean) => {
    const pendingIndex = pendingIndexRef.current;
    cancelPointerFrame();
    if (commitPending && pendingIndex !== null) setSelectedIndex(pendingIndex);
    pointerBoundsRef.current = null;
    setIsPressing(false);
  };

  return (
    <section className="chart-card expense-week-card" aria-labelledby={titleId}>
      <div className="chart-head">
        <h2 className="chart-title" id={titleId}>Pengeluaran</h2>
        <button type="button" className="expense-period-trigger" aria-label={`Pilih periode, ${period} hari`} aria-haspopup="dialog" aria-expanded={showPeriods} onClick={() => { setIsPressing(false); setShowPeriods(true); }}>
          {period} hari <ChevronDown size={14} />
        </button>
      </div>
      <p className="expense-period-range" aria-live="polite">{visibleData.length > 0 && `${formatRangeDate(visibleData[0].date)} – ${formatRangeDate(visibleData[visibleData.length - 1].date)}`}</p>
      <div className="expense-chart-layout">
      <div className="expense-chart-scale" aria-hidden="true">
        {SCALE_TICKS.map((amount) => <span key={amount} style={{ top: TOP_SPACE + (1 - amount / MAX_AMOUNT) * (PLOT_HEIGHT - TOP_SPACE - BOTTOM_SPACE) }}>{amount === MAX_AMOUNT ? "Rp90k+" : amount === 0 ? "Rp0" : `Rp${amount / 1000}k`}</span>)}
      </div>
      <div className="expense-week-chart">
        <div className="expense-chart-guides" aria-hidden="true">
          {SCALE_TICKS.map((amount) => <span key={amount} style={{ top: TOP_SPACE + (1 - amount / MAX_AMOUNT) * (PLOT_HEIGHT - TOP_SPACE - BOTTOM_SPACE) }} />)}
        </div>
        <div aria-hidden="true">
          <ResponsiveContainer width="100%" height={PLOT_HEIGHT} minWidth={0} onResize={(width) => setChartWidth(width)}>
            <BarChart data={visibleData} margin={{ top: TOP_SPACE, right: 0, bottom: BOTTOM_SPACE, left: 0 }} barCategoryGap={BAR_CATEGORY_GAP} accessibilityLayer={false}>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={[0, MAX_AMOUNT]} allowDataOverflow />
              <Bar
                dataKey="barAmount"
                minPointSize={MIN_BAR_HEIGHT}
                isAnimationActive={!prefersReducedMotion && !hasAnimated}
                animationDuration={600}
                animationEasing="ease-out"
                onAnimationEnd={() => setHasAnimated(true)}
                shape={({ x, y, width, height, index }) => (
                  <rect className="expense-week-bar" x={x} y={y} width={width} height={height} rx={Math.min(8, height / 2, width / 4)}
                    fill={index === activeIndex ? "var(--green)" : "var(--border-light)"} />
                )}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="expense-week-days" role="group" aria-label="Pilih hari pengeluaran" style={{ gridTemplateColumns: `repeat(${visibleData.length}, minmax(0, 1fr))` }}>
          {visibleData.map((item, index) => (
            <button key={item.date} type="button" className="expense-week-day" aria-pressed={index === activeIndex}
              aria-label={`${item.day}, ${formatRangeDate(item.date)}${index === visibleData.length - 1 ? ", hari ini" : ""}: ${formatCurrency(item.amount)}`}
              onClick={(event) => { if (event.detail === 0) setSelectedIndex(index); }}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                cancelPointerFrame();
                const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
                pointerBoundsRef.current = bounds ? { left: bounds.left, width: bounds.width } : null;
                event.currentTarget.setPointerCapture(event.pointerId);
                setSelectedIndex(index);
                setIsPressing(true);
              }}
              onPointerUp={() => finishPointerSelection(true)}
              onPointerMove={(event) => {
                if (!isPressing || !event.buttons) return;
                const bounds = pointerBoundsRef.current;
                if (!bounds || bounds.width === 0) return;
                pendingIndexRef.current = Math.max(0, Math.min(visibleData.length - 1, Math.floor((event.clientX - bounds.left) / bounds.width * visibleData.length)));
                if (pointerFrameRef.current !== null) return;
                pointerFrameRef.current = requestAnimationFrame(() => {
                  pointerFrameRef.current = null;
                  const pendingIndex = pendingIndexRef.current;
                  pendingIndexRef.current = null;
                  if (pendingIndex !== null) setSelectedIndex(pendingIndex);
                });
              }}
              onPointerCancel={() => finishPointerSelection(false)}
              onLostPointerCapture={() => finishPointerSelection(false)}
              onBlur={(event) => {
                if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) finishPointerSelection(false);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setSelectedIndex(index);
                setIsPressing(true);
              }}
              onKeyUp={(event) => {
                if (event.key === "Enter" || event.key === " ") setIsPressing(false);
              }} />
          ))}
        </div>
        <div className="expense-chart-labels" aria-hidden="true">
          {labelIndices.map((index) => visibleData[index] && <span key={visibleData[index].date} className={index === activeIndex ? "expense-chart-label--active" : ""}
            style={{ left: `${(index + 0.5) / visibleData.length * 100}%`, transform: index === 0 && period !== 7 ? "none" : index === visibleData.length - 1 && period !== 7 ? "translateX(-100%)" : "translateX(-50%)" }}>
            {period === 7 ? visibleData[index].day : Number(visibleData[index].date.slice(8, 10))}
          </span>)}
        </div>
        {isPressing && selected && chartWidth > 0 && (
          <div className="expense-week-tooltip" aria-hidden="true"
            style={{ top: PLOT_HEIGHT - BOTTOM_SPACE - barHeight - 44, left: tooltipLeft, width: tooltipWidth }}>
            {valueLabel}
            <i style={{ left: barCenter - tooltipLeft }} />
          </div>
        )}
      </div>
      </div>
      {showPeriods && <FinanceDialog title="Periode pengeluaran" onClose={() => setShowPeriods(false)}>
        <div className="expense-period-options" role="group" aria-label="Periode pengeluaran">
          {PERIODS.map((value) => <button type="button" key={value} aria-pressed={value === period} onClick={() => { setPeriod(value); setSelectedIndex(value - 1); setIsPressing(false); setShowPeriods(false); }}>
            <span>{value} hari terakhir</span>{value === period && <Check size={18} />}
          </button>)}
        </div>
      </FinanceDialog>}
    </section>
  );
}
