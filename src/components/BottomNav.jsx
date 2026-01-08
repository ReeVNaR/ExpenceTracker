import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Plus, BarChart2 } from 'lucide-react';

export default function BottomNav() {
    const navItems = [
        { name: 'Home', icon: Home, path: '/' },
        { name: 'Add', icon: Plus, path: '/add', isSpecial: true },
        { name: 'Stats', icon: BarChart2, path: '/stats' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background/60 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
              flex flex-col items-center justify-center w-full h-full transition-colors
              ${item.isSpecial ? '' : (isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300')}
            `}
                    >
                        {({ isActive }) => (
                            item.isSpecial ? (
                                <div className="bg-primary text-white p-3 rounded-full shadow-lg shadow-primary/30 -mt-8 border-4 border-background">
                                    <item.icon size={28} />
                                </div>
                            ) : (
                                <>
                                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="text-[10px] font-medium mt-1">{item.name}</span>
                                </>
                            )
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
