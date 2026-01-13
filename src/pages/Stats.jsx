import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { supabase } from '../services/supabase';
import { usePreferences } from '../context/PreferencesContext';
import { PieChart, BarChart2, TrendingDown, ArrowDownRight, ArrowUpRight, DollarSign } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Stats() {
    const { getCurrencySymbol } = usePreferences();
    const [transactions, setTransactions] = useState([]);
    const [view, setView] = useState('breakdown');
    const [trendView, setTrendView] = useState('daily');
    const symbol = getCurrencySymbol();

    const chartRef = React.useRef(null);

    useEffect(() => {
        fetchData();

        // Chart rotation animation
        let animationFrameId;
        const animate = () => {
            const chart = chartRef.current;
            if (chart) {
                chart.options.rotation = (chart.options.rotation || 0) + 0.05;
                chart.update('none');
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        // Short delay to ensure chart is mounted
        const timeoutId = setTimeout(() => {
            animate();
        }, 100);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            clearTimeout(timeoutId);
        };
    }, []);

    const fetchData = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setTransactions(data);
        } catch (err) {
            console.error(err);
        }
    };

    // Data Processing
    const categoryData = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {});

    const totalExpense = Object.values(categoryData).reduce((a, b) => a + b, 0);

    const colors = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#10b981', '#3b82f6', '#0ea5e9', '#84cc16', '#14b8a6'];

    // Assign consistent colors to categories
    const colorMap = Object.keys(categoryData).reduce((acc, cat, index) => {
        acc[cat] = colors[index % colors.length];
        return acc;
    }, {});

    const sortedCategories = Object.entries(categoryData)
        .sort(([, a], [, b]) => b - a);

    const doughnutData = {
        labels: Object.keys(categoryData),
        datasets: [
            {
                data: Object.values(categoryData),
                backgroundColor: Object.keys(categoryData).map(cat => colorMap[cat]),
                borderWidth: 0,
                hoverOffset: 10,
            },
        ],
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                cornerRadius: 12,
                displayColors: true,
                boxPadding: 4
            }
        },
        cutout: '70%',
        borderWidth: 0,
        borderRadius: 20,
        layout: {
            padding: 24
        }
    };

    const floatingLabelsPlugin = {
        id: 'floatingLabels',
        afterDraw: (chart) => {
            const { ctx } = chart;
            chart.data.datasets.forEach((dataset, i) => {
                chart.getDatasetMeta(i).data.forEach((datapoint, index) => {
                    const { x, y, outerRadius, startAngle, endAngle } = datapoint;
                    const angle = (startAngle + endAngle) / 2;
                    const radius = outerRadius + 14;
                    const xLabel = x + Math.cos(angle) * radius;
                    const yLabel = y + Math.sin(angle) * radius;

                    ctx.save();
                    ctx.translate(xLabel, yLabel);
                    ctx.fillStyle = colorMap[chart.data.labels[index]];
                    ctx.font = 'bold 9px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowColor = 'rgba(0,0,0,0.8)';
                    ctx.shadowBlur = 3;

                    let label = chart.data.labels[index];
                    if (label.length > 8) label = label.substring(0, 7) + '..'; // Truncate

                    ctx.fillText(label, 0, 0);
                    ctx.restore();
                });
            });
        }
    };

    // Bar Chart Data
    const monthlyDataMap = transactions.reduce((acc, curr) => {
        if (curr.type === 'expense') {
            const date = new Date(curr.date);
            const month = date.toLocaleString('default', { month: 'short' });

            if (!acc[month]) acc[month] = { total: 0, byCategory: {} };
            acc[month].total += curr.amount;

            // Track dominant category
            if (!acc[month].byCategory[curr.category]) acc[month].byCategory[curr.category] = 0;
            acc[month].byCategory[curr.category] += curr.amount;
        }
        return acc;
    }, {});

    const barLabels = Object.keys(monthlyDataMap);

    // Determine color based on highest expense category for that month
    // Helper to generate stacked datasets
    const generateStackedDatasets = (labels, dataMap) => {
        const allCategories = [...new Set(transactions.filter(t => t.type === 'expense').map(t => t.category))];

        return allCategories.map(cat => ({
            label: cat,
            data: labels.map(label => {
                const item = dataMap[label];
                return item && item.byCategory && item.byCategory[cat] ? item.byCategory[cat] : 0;
            }),
            backgroundColor: colorMap[cat],
            borderRadius: 2,
            barPercentage: 0.6,
            stack: 'Stack 0',
        }));
    };

    const barData = {
        labels: barLabels,
        datasets: generateStackedDatasets(barLabels, monthlyDataMap)
    };

    // Daily Data Processing - Full Range
    const getFullDateRange = () => {
        if (transactions.length === 0) {
            // Default to last 7 days if no transactions
            const dates = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                dates.push(`${year}-${month}-${day}`);
            }
            return dates;
        }

        // Find min date
        const validDates = transactions.map(t => new Date(t.date).getTime()).filter(d => !isNaN(d));
        if (validDates.length === 0) return [];

        const minDate = new Date(Math.min(...validDates));
        const maxDate = new Date(); // Today

        const dates = [];
        const currentDate = new Date(minDate);

        // Normalize to start of day
        currentDate.setHours(0, 0, 0, 0);
        const end = new Date(maxDate);
        end.setHours(23, 59, 59, 999);

        while (currentDate <= end) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const dateRange = getFullDateRange();

    const dailyDataMap = dateRange.reduce((acc, date) => {
        acc[date] = { total: 0, byCategory: {} };
        return acc;
    }, {});

    transactions.forEach(t => {
        const tDate = t.date ? t.date.split('T')[0] : '';
        if (dailyDataMap[tDate] && t.type === 'expense') {
            dailyDataMap[tDate].total += t.amount;

            if (!dailyDataMap[tDate].byCategory[t.category]) dailyDataMap[tDate].byCategory[t.category] = 0;
            dailyDataMap[tDate].byCategory[t.category] += t.amount;
        }
    });

    const dailyLabels = dateRange.map(d => {
        const [year, month, day] = d.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    });

    const dailyBarData = {
        labels: dailyLabels,
        datasets: generateStackedDatasets(dateRange, dailyDataMap)
    };

    // Weekly Data Processing
    const getWeekStartDate = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    };

    const weeklyDataMap = transactions.reduce((acc, curr) => {
        if (curr.type === 'expense') {
            const weekStart = getWeekStartDate(curr.date).toISOString().split('T')[0];
            if (!acc[weekStart]) acc[weekStart] = { total: 0, byCategory: {} };
            acc[weekStart].total += curr.amount;

            if (!acc[weekStart].byCategory[curr.category]) acc[weekStart].byCategory[curr.category] = 0;
            acc[weekStart].byCategory[curr.category] += curr.amount;
        }
        return acc;
    }, {});

    const weeklyLabels = Object.keys(weeklyDataMap).sort();
    const formattedWeeklyLabels = weeklyLabels.map(d => {
        const start = new Date(d);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);

        const startStr = `${start.getDate()} ${start.toLocaleString('default', { month: 'short' })}`;
        const endStr = `${end.getDate()} ${end.toLocaleString('default', { month: 'short' })}`;
        return `${startStr} - ${endStr}`;
    });

    const weeklyBarData = {
        labels: formattedWeeklyLabels,
        datasets: generateStackedDatasets(weeklyLabels, weeklyDataMap)
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#f8fafc',
                bodyColor: '#cbd5e1',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += symbol + context.parsed.y.toLocaleString();
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: { color: '#64748b', font: { size: 10 } }
            },
            y: {
                stacked: true,
                grid: { color: 'rgba(51, 65, 85, 0.2)', borderDash: [4, 4] },
                ticks: {
                    display: true,
                    color: '#64748b',
                    font: { size: 10 },
                    callback: (value) => value >= 1000 ? `${symbol}${value / 1000}k` : `${symbol}${value}`
                }
            }
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-background pb-0 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none opacity-60"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none opacity-60"></div>

            {/* Header */}
            <div className="px-6 pt-6 pb-2 shrink-0 z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Analytics
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Financial Insights</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Total Spent</p>
                    <p className="text-xl font-bold text-white">{symbol}{totalExpense.toLocaleString()}</p>
                </div>
            </div>

            {/* Custom Tab Switcher */}
            <div className="px-6 py-4 shrink-0 z-10">
                <div className="bg-slate-900/50 backdrop-blur-md p-1.5 rounded-2xl flex border border-white/5 relative shadow-inner">
                    {/* Sliding indicator background - simplified implementation via conditional classes */}
                    <button
                        onClick={() => setView('breakdown')}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${view === 'breakdown'
                            ? 'bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <PieChart size={16} />
                        Spending
                    </button>
                    <button
                        onClick={() => setView('trends')}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${view === 'trends'
                            ? 'bg-gradient-to-br from-primary to-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <BarChart2 size={16} />
                        Activity
                    </button>
                </div>
            </div>

            {/* Main Content Viewport */}
            <div className="flex-1 min-h-0 relative px-6 z-10">
                {view === 'breakdown' ? (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Chart Container - Fixed Height */}
                        <div className="h-[240px] relative shrink-0 -mt-2 mb-2 flex items-center justify-center">
                            <div className="w-full h-full p-2">
                                <Doughnut ref={chartRef} data={doughnutData} options={doughnutOptions} plugins={[floatingLabelsPlugin]} />
                            </div>
                            {/* Inner Ring Glow */}
                            <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl pointer-events-none transform scale-50"></div>

                            {/* Center Statistic */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="p-4 bg-background/50 backdrop-blur-sm rounded-full border border-white/5 shadow-2xl">
                                    <TrendingDown size={24} className="text-rose-400" />
                                </div>
                            </div>
                        </div>

                        {/* List Header */}
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Top Categories</h3>
                            <button className="text-xs text-primary hover:text-indigo-300 transition-colors">Sort by value</button>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-4 space-y-3">
                            {sortedCategories.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                                    <PieChart size={32} className="opacity-20" />
                                    <p className="text-sm">No expenses yet</p>
                                </div>
                            ) : (
                                sortedCategories.map(([cat, amount], index) => (
                                    <div
                                        key={cat}
                                        className="group bg-slate-900/40 hover:bg-slate-800/60 transition-all duration-300 p-4 rounded-2xl border border-white/5 flex items-center justify-between shadow-sm active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-3 h-10 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                                style={{ backgroundColor: colorMap[cat] }}
                                            ></div>
                                            <div>
                                                <p className="text-white font-medium text-base">{cat}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{((amount / totalExpense) * 100).toFixed(1)}% of total</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-bold text-base tracking-wide flex items-center justify-end gap-1">
                                                {symbol}{amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pt-1 pb-20 overflow-y-auto no-scrollbar">
                        <div className="h-[320px] shrink-0 bg-slate-900/40 p-5 rounded-3xl border border-white/5 relative overflow-hidden backdrop-blur-sm shadow-xl flex flex-col">
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div className="bg-slate-800/50 p-1 rounded-lg flex text-xs font-medium">
                                    <button
                                        onClick={() => setTrendView('daily')}
                                        className={`px-3 py-1.5 rounded-md transition-all ${trendView === 'daily'
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Daily
                                    </button>
                                    <button
                                        onClick={() => setTrendView('weekly')}
                                        className={`px-3 py-1.5 rounded-md transition-all ${trendView === 'weekly'
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => setTrendView('monthly')}
                                        className={`px-3 py-1.5 rounded-md transition-all ${trendView === 'monthly'
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        Monthly
                                    </button>
                                </div>
                                <div className="flex gap-3 text-xs font-semibold">
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <span className="text-slate-300">Expense</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 relative w-full overflow-x-auto overflow-y-hidden custom-scrollbar" ref={(el) => {
                                // Auto scroll to end on load
                                if (el && trendView === 'daily') el.scrollLeft = el.scrollWidth;
                            }}>
                                <div style={{
                                    width: trendView === 'daily' ? Math.max(100, dateRange.length * 60) + 'px'
                                        : trendView === 'weekly' ? Math.max(100, weeklyLabels.length * 120) + 'px'
                                            : '100%',
                                    height: '100%',
                                    minWidth: '100%'
                                }}>
                                    <Bar
                                        key={trendView}
                                        data={trendView === 'daily' ? dailyBarData : trendView === 'weekly' ? weeklyBarData : barData}
                                        options={{
                                            ...barOptions,
                                            maintainAspectRatio: false,
                                            responsive: true,
                                            layout: {
                                                padding: { bottom: 10 }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            {/* Background Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                        </div>

                        {/* Recent History Header */}
                        <div className="mt-6 mb-3 px-2 flex justify-between items-center shrink-0">
                            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Recent History</h3>
                            <span className="text-xs text-slate-500">Last 5 transactions</span>
                        </div>

                        {/* Transactions List */}
                        <div className="space-y-3 px-1">
                            {transactions.slice(0, 5).map((t) => (
                                <div key={t.id} className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between border border-white/5 hover:bg-slate-800/60 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                            {t.type === 'income' ? '💰' : '💸'}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{t.title}</p>
                                            <p className="text-slate-500 text-xs">{t.payment_method === 'cash' ? 'Cash' : 'Bank'} • {new Date(t.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className={`font-semibold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                        {t.type === 'expense' ? '-' : '+'}{symbol} {t.amount.toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {/* Gradient Fade at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20"></div>
        </div >
    );
}

