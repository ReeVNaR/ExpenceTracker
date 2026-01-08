import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { supabase } from '../services/supabase';

export default function Dashboard() {
    const { user } = useAuth();
    const { getCurrencySymbol, currency } = usePreferences();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false });

            if (error) throw error;
            setTransactions(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        let income = 0;
        let expense = 0;
        let wallet = 0;
        let bank = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                income += t.amount;
                if (t.payment_method === 'cash') wallet += t.amount;
                else bank += t.amount;
            } else {
                expense += t.amount;
                if (t.payment_method === 'cash') wallet -= t.amount;
                else bank -= t.amount;
            }
        });

        return { income, expense, bank, wallet };
    };

    const { bank, wallet } = calculateTotals();

    // Helper to format date
    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const symbol = getCurrencySymbol();

    return (
        <div className="p-4 pb-24 space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground transition-colors">Dashboard</h1>
                    <p className="text-muted-foreground text-sm">Welcome back, {user?.name || 'User'}</p>
                </div>
                <Link to="/settings" className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30 hover:bg-primary/30 transition-colors">
                    {user?.name?.[0] || 'U'}
                </Link>
            </header>

            {/* Balances Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Bank Balance Card */}
                <div className="bg-gradient-to-br from-primary to-indigo-700 rounded-2xl p-5 shadow-lg text-white relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="relative z-10">
                        <p className="text-indigo-200 text-xs font-medium mb-1 uppercase tracking-wider">Bank</p>
                        <h2 className="text-2xl font-bold">{symbol} {bank.toLocaleString()}</h2>
                    </div>
                    {/* Decorative circle */}
                    <div className="absolute -right-4 -top-4 h-24 w-24 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <span className="text-lg">🏦</span>
                        </div>
                    </div>
                </div>

                {/* Wallet Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-5 shadow-lg text-white relative overflow-hidden flex flex-col justify-between h-32">
                    <div className="relative z-10">
                        <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Wallet</p>
                        <h2 className="text-2xl font-bold">{symbol} {wallet.toLocaleString()}</h2>
                    </div>
                    {/* Decorative circle */}
                    <div className="absolute -right-4 -top-4 h-24 w-24 bg-primary/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center backdrop-blur-sm text-orange-500">
                            <span className="text-lg">👛</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div>
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
                    <Link to="/history" className="text-primary text-sm font-medium hover:text-primary/80 transition-colors">See All</Link>
                </div>
                {loading ? (
                    <p className="text-slate-500 text-center py-4">Loading transactions...</p>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8 bg-card rounded-xl border border-slate-700/50">
                        <p className="text-slate-400">No transactions yet.</p>
                        <p className="text-xs text-slate-500 mt-1">Add one to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transactions.slice(0, 4).map((t) => (
                            <div key={t.id} className="bg-card rounded-xl p-4 flex items-center justify-between border border-border hover:bg-secondary transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl ${t.type === 'income' ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-foreground'}`}>
                                        {t.icon || (t.type === 'income' ? '💰' : '💸')}
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium">{t.title}</p>
                                        <p className="text-muted-foreground text-xs">{t.category} • {formatDate(t.date)}</p>
                                    </div>
                                </div>
                                <p className={`font-semibold flex flex-col items-end ${t.type === 'income' ? 'text-green-500' : 'text-foreground'}`}>
                                    {t.type === 'expense' ? '-' : '+'}{symbol} {t.amount.toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
