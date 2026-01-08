import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        const session = supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                // Normalize user data for the app
                setUser({
                    ...session.user,
                    name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                    email: session.user.email,
                    id: session.user.id
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({
                    ...session.user,
                    name: session.user.user_metadata?.name || session.user.email.split('@')[0],
                    email: session.user.email,
                    id: session.user.id
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password
        });
        if (error) throw error;
        return true;
    };

    const register = async (name, email, password) => {
        const trimmedEmail = email.trim();
        console.log("Attempting register with:", trimmedEmail);
        const { error } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
                data: {
                    name: name
                }
            }
        });
        if (error) throw error;
        return true;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
