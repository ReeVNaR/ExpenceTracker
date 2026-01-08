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
    const symbol = getCurrencySymbol();

    useEffect(() => {
        fetchData();
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

    const colors = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#10b981', '#3b82f6'];

    const sortedCategories = Object.entries(categoryData)
        .sort(([, a], [, b]) => b - a);

    const doughnutData = {
        labels: Object.keys(categoryData),
        datasets: [
            {
                data: Object.values(categoryData),
                backgroundColor: colors,
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
        cutout: '82%',
        borderWidth: 0,
        borderRadius: 20,
    };

    // Bar Chart Data
    const monthlyDataMap = transactions.reduce((acc, curr) => {
        const date = new Date(curr.date);
        const month = date.toLocaleString('default', { month: 'short' });
        if (!acc[month]) acc[month] = { income: 0, expense: 0 };
        if (curr.type === 'income') acc[month].income += curr.amount;
        else acc[month].expense += curr.amount;
        return acc;
    }, {});

    // Ensure months are ordered roughly (simple implementation for recent months)
    const barLabels = Object.keys(monthlyDataMap);

    const barData = {
        labels: barLabels,
        datasets: [
            {
                label: 'Income',
                data: barLabels.map(m => monthlyDataMap[m].income),
                backgroundColor: '#10b981',
                borderRadius: 6,
                barPercentage: 0.5,
            },
            {
                label: 'Expense',
                data: barLabels.map(m => monthlyDataMap[m].expense),
                backgroundColor: '#f43f5e',
                borderRadius: 6,
                barPercentage: 0.5,
            }
        ]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
            y: { grid: { color: 'rgba(51, 65, 85, 0.2)', borderDash: [4, 4] }, ticks: { display: false } }
        }
    };

    return (
        <div className="h-screen flex flex-col bg-background pb-0 relative overflow-hidden">
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
                                <Doughnut data={doughnutData} options={doughnutOptions} />
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
                                                style={{ backgroundColor: colors[index % colors.length] }}
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
                    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pt-4">
                        <div className="bg-slate-900/40 p-6 rounded-3xl border border-white/5 flex-1 relative overflow-hidden backdrop-blur-sm shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-bold text-white">Monthly Comparison</h2>
                                <div className="flex gap-3 text-xs font-semibold">
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-slate-300">Income</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <span className="text-slate-300">Expense</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-x-6 bottom-6 top-20">
                                <Bar data={barData} options={barOptions} />
                            </div>
                        </div>
                        <div className="h-10"></div> {/* Spacer */}
                    </div>
                )}
            </div>
            {/* Gradient Fade at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20"></div>
        </div>
    );
}
