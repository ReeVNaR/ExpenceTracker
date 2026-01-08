import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { DollarSign, Moon, Sun, LogOut, ChevronRight, Check } from 'lucide-react';

export default function Settings() {
    const { user, logout } = useAuth();
    const { currency, setCurrency, theme, toggleTheme } = usePreferences();

    return (
        <div className="p-4 pb-24 space-y-6">
            <h1 className="text-2xl font-bold text-foreground transition-colors">Settings</h1>

            {/* User Details Card */}
            <div className="bg-card rounded-2xl p-6 border border-border flex items-center space-x-4 shadow-sm">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold border border-primary/30">
                    {user?.name?.[0] || 'U'}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">{user?.name || 'User Name'}</h2>
                    <p className="text-muted-foreground text-sm">{user?.email || 'user@example.com'}</p>
                </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Preferences</h3>

                {/* Currency Section */}
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                            <DollarSign size={20} />
                        </div>
                        <span className="font-medium text-foreground">Currency</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setCurrency('USD')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${currency === 'USD'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                                }`}
                        >
                            <span className="text-lg font-bold">$</span>
                            <span className="text-sm font-medium">Dollar</span>
                            {currency === 'USD' && <Check size={16} />}
                        </button>
                        <button
                            onClick={() => setCurrency('INR')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${currency === 'INR'
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-background border-border text-muted-foreground hover:bg-secondary'
                                }`}
                        >
                            <span className="text-lg font-bold">₹</span>
                            <span className="text-sm font-medium">Rupee</span>
                            {currency === 'INR' && <Check size={16} />}
                        </button>
                    </div>
                </div>

                {/* Theme Section */}
                <button
                    onClick={toggleTheme}
                    className="w-full bg-card p-4 rounded-xl border border-border text-foreground font-medium hover:bg-secondary transition-colors flex justify-between items-center group shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        Dark Mode
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                </button>
            </div>

            {/* Log Out Button */}
            <button
                onClick={logout}
                className="w-full bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-500 font-medium hover:bg-red-500/20 transition-colors flex justify-between items-center group mt-6"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20 text-red-500">
                        <LogOut size={20} />
                    </div>
                    Log Out
                </div>
            </button>
        </div>
    );
}
