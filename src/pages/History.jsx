import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Trash2, Calendar, Filter, Wallet, CreditCard } from 'lucide-react';
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
    const [filterMethod, setFilterMethod] = useState('all'); // 'all', 'online', 'cash'

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

    const deleteTransaction = async (id) => {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setTransactions(transactions.filter(t => t.id !== id));
        } catch (err) {
            console.error('Error deleting transaction:', err);
            alert('Failed to delete transaction');
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMethod = filterMethod === 'all' || (t.payment_method || 'online') === filterMethod;
        return matchesSearch && matchesMethod;
    });

    return (
        <div className="h-screen bg-background flex flex-col relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <header className="px-6 pt-6 pb-4 shrink-0 z-10">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 rounded-full bg-secondary/50 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            History
                        </h1>
                        <p className="text-slate-500 text-xs font-medium tracking-wide uppercase">
                            {transactions.length} Transactions
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center p-1 focus-within:border-primary/50 transition-colors">
                        <Search className="ml-3 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0 px-3 py-2.5"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mr-2 text-xs text-slate-500 hover:text-white bg-white/5 px-2 py-1 rounded-md transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Payment Method Filter */}
                <div className="flex bg-slate-900/50 p-1 rounded-xl mb-2 border border-white/5">
                    <button
                        onClick={() => setFilterMethod('all')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${filterMethod === 'all'
                            ? 'bg-slate-700 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Filter size={14} />
                        All
                    </button>
                    <button
                        onClick={() => setFilterMethod('online')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${filterMethod === 'online'
                            ? 'bg-indigo-500/80 text-white shadow-lg shadow-indigo-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <CreditCard size={14} />
                        Bank
                    </button>
                    <button
                        onClick={() => setFilterMethod('cash')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${filterMethod === 'cash'
                            ? 'bg-orange-500/80 text-white shadow-lg shadow-orange-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Wallet size={14} />
                        Cash
                    </button>
                </div>
            </header>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 z-10 custom-scrollbar space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 text-sm animate-pulse">Loading activity...</p>
                    </div>
                ) : filteredTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
                        <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
                            <Search size={24} className="opacity-50" />
                        </div>
                        <p className="text-sm">No transactions found.</p>
                    </div>
                ) : (
                    filteredTransactions.map((t) => (
                        <div
                            key={t.id}
                            className="group bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-800/60 transition-all duration-300 shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${t.type === 'income'
                                    ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/10'
                                    : 'bg-rose-500/10 text-rose-500 shadow-rose-500/10'
                                    }`}>
                                    {t.type === 'income' ? '💰' : '💸'}
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-[15px] group-hover:text-primary transition-colors">{t.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">{t.category}</span>
                                        <span>•</span>
                                        <span>{t.payment_method === 'cash' ? 'Cash' : 'Bank'}</span>
                                        <span>•</span>
                                        <span>{formatDate(t.date)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <p className={`font-bold text-base tracking-wide ${t.type === 'income' ? 'text-emerald-400' : 'text-white'
                                    }`}>
                                    {t.type === 'expense' ? '-' : '+'}{symbol}{t.amount.toLocaleString()}
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTransaction(t.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all transform scale-90 hover:scale-100"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Gradient Fade at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-20"></div>
        </div>
    );
}
