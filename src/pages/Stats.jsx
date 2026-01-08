import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api';
import { usePreferences } from '../context/PreferencesContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Stats() {
    const { getCurrencySymbol } = usePreferences();
    const [transactions, setTransactions] = useState([]);
    const [view, setView] = useState('monthly'); // 'monthly' | 'weekly'
    const symbol = getCurrencySymbol();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/transactions');
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Calculate Category Data for Doughnut Chart
    const categoryData = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {});

    const doughnutData = {
        labels: Object.keys(categoryData),
        datasets: [
            {
                data: Object.values(categoryData),
                backgroundColor: [
                    '#4F46E5', '#22C55E', '#EC4899', '#F59E0B', '#6366F1', '#14B8A6',
                ],
                borderWidth: 0,
            },
        ],
    };

    const doughnutOptions = {
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 6 },
            }
        },
        cutout: '75%',
    };

    // Calculate Monthly Data for Bar Chart
    const monthlyDataMap = transactions.reduce((acc, curr) => {
        const date = new Date(curr.date);
        const month = date.toLocaleString('default', { month: 'short' });
        if (!acc[month]) acc[month] = { income: 0, expense: 0 };

        if (curr.type === 'income') acc[month].income += curr.amount;
        else acc[month].expense += curr.amount;
        return acc;
    }, {});

    const barData = {
        labels: Object.keys(monthlyDataMap),
        datasets: [
            {
                label: 'Income',
                data: Object.keys(monthlyDataMap).map(m => monthlyDataMap[m].income),
                backgroundColor: '#22C55E',
                borderRadius: 4,
            },
            {
                label: 'Expense',
                data: Object.keys(monthlyDataMap).map(m => monthlyDataMap[m].expense),
                backgroundColor: '#EF4444',
                borderRadius: 4,
            }
        ]
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 8 }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }
        }
    };

    // Sorting categories for list view
    const sortedCategories = Object.entries(categoryData)
        .sort(([, a], [, b]) => b - a);

    const totalExpense = Object.values(categoryData).reduce((a, b) => a + b, 0);

    return (
        <div className="p-4 pb-24 space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-foreground">Statistics</h1>
                <p className="text-muted-foreground text-sm">Overview</p>
            </header>

            {/* Monthly Overview Bar Chart */}
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Activity</h3>
                <div className="h-48">
                    <Bar data={barData} options={barOptions} />
                </div>
            </div>

            {/* Expense Breakdown Pie Chart */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-4">Expense Breakdown</h3>
                <div className="h-48 relative flex items-center justify-center">
                    <div className="w-full h-full flex justify-center">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-28">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-bold text-foreground">{symbol}{totalExpense.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Category List */}
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Details</h3>
                <div className="space-y-4">
                    {sortedCategories.map(([cat, amount], index) => (
                        <div key={cat}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">{cat}</span>
                                <span className="text-foreground font-medium">{symbol} {amount.toLocaleString()}</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${(amount / totalExpense) * 100}%`,
                                        backgroundColor: doughnutData.datasets[0].backgroundColor[index % 6]
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                    {sortedCategories.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No expense data to display.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
