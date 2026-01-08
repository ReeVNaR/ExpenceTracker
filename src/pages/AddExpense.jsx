import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

export default function AddExpense() {
    const navigate = useNavigate();
    const { getCurrencySymbol } = usePreferences();
    const { user } = useAuth();
    const symbol = getCurrencySymbol();
    const [type, setType] = useState('expense'); // 'expense' or 'income'
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const expenseCategories = ['Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Health', 'Other'];
    const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investments', 'Gift', 'Other'];

    const categories = type === 'expense' ? expenseCategories : incomeCategories;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !category || !title) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('transactions').insert({
                user_id: user.id,
                type,
                title,
                amount: parseFloat(amount),
                category,
                note,
                date
            });

            if (error) throw error;
            navigate('/');
        } catch (err) {
            console.error(err);
            alert(err.message || 'Failed to add transaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 pb-24">
            <header className="flex items-center gap-4 mb-6 pt-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-semibold text-white">Add Transaction</h1>
            </header>

            {/* Type Toggle */}
            <div className="bg-slate-800/50 p-1 rounded-xl flex mb-6 mx-auto max-w-sm">
                <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'expense'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    onClick={() => setType('expense')}
                >
                    Expense
                </button>
                <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${type === 'income'
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    onClick={() => setType('income')}
                >
                    Income
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Input */}
                <div className="bg-card rounded-2xl p-6 border border-slate-700/50">
                    <label className="block text-slate-400 text-sm mb-2">Amount</label>
                    <div className="relative flex items-center">
                        <span className={`absolute left-0 text-3xl font-bold ${type === 'expense' ? 'text-red-400' : 'text-green-400'}`}>
                            {type === 'expense' ? `- ${symbol}` : `+ ${symbol}`}
                        </span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-transparent text-4xl font-bold text-white pl-12 focus:outline-none placeholder-slate-600"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Details Form */}
                <div className="bg-card rounded-2xl p-6 border border-slate-700/50 space-y-5">
                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-800 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary border border-transparent placeholder-slate-500"
                            placeholder={type === 'expense' ? "e.g. Grocery Run" : "e.g. Salary"}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${category === cat
                                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-slate-800 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary border border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-sm font-medium mb-2">Note</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows="3"
                            className="w-full bg-slate-800 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary border border-transparent placeholder-slate-500"
                            placeholder="Any additional details..."
                        ></textarea>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all ${type === 'expense'
                        ? 'bg-red-500 shadow-red-500/25 hover:bg-red-600'
                        : 'bg-green-500 shadow-green-500/25 hover:bg-green-600'
                        } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {isSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
            </form>
        </div>
    );
}
