import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { usePreferences } from '../context/PreferencesContext';

export default function History() {
    const navigate = useNavigate();
    const { getCurrencySymbol } = usePreferences();
    const symbol = getCurrencySymbol();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const formatDate = (dateString) => {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const filteredTransactions = transactions.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background p-4 pb-24">
            <header className="flex items-center gap-4 mb-6 pt-2 sticky top-0 bg-background/80 backdrop-blur-xl z-20 py-4 -mx-4 px-4 border-b border-white/5">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-full hover:bg-secondary text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-foreground">Transaction History</h1>
                    <p className="text-xs text-muted-foreground">{transactions.length} total transactions</p>
                </div>
            </header>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-secondary/50 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 text-sm">Loading history...</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            No transactions found.
                        </div>
                    ) : (
                        filteredTransactions.map((t) => (
                            <div key={t.id} className="bg-card/50 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between border border-white/5 hover:bg-card transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                        {t.type === 'income' ? '💰' : '💸'}
                                    </div>
                                    <div>
                                        <p className="text-foreground font-semibold">{t.title}</p>
                                        <p className="text-muted-foreground text-xs">{t.category} • {formatDate(t.date)}</p>
                                    </div>
                                </div>
                                <p className={`font-bold flex flex-col items-end ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {t.type === 'expense' ? '-' : '+'}{symbol} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
