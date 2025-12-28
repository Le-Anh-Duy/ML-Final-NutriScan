import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../config/firebase';

const useAuth = () => {
    const [user, setUser] = useState(null);
    const { setAuthUser } = useContext(AuthContext);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setAuthUser(user);
        });

        return () => unsubscribe();
    }, [setAuthUser]);

    const login = async (email, password) => {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            setUser(userCredential.user);
            setAuthUser(userCredential.user);
        } catch (error) {
            console.error("Login error:", error);
        }
    };

    const logout = async () => {
        try {
            await auth.signOut();
            setUser(null);
            setAuthUser(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return { user, login, logout };
};

export default useAuth;