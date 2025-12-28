import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Helper: Check if date is today
const isToday = (dateStringOrTimestamp) => {
    if (!dateStringOrTimestamp) return false;
    
    let date;
    // Handle Firestore Timestamp
    if (typeof dateStringOrTimestamp.toDate === 'function') {
        date = dateStringOrTimestamp.toDate();
    } else {
        // Handle string or Date object
        date = new Date(dateStringOrTimestamp);
    }

    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

const Profile = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // State for saving loading status
    const [isSaving, setIsSaving] = useState(false);

    // State for edit mode
    const [isEditing, setIsEditing] = useState(false);
    
    // User data state
    const [user, setUser] = useState({
        name: '',
        email: '',
        avatar: '',
        healthProfile: {
            height: '',
            weight: '',
            goal: 'Maintain Weight'
        },
        recentScans: []
    });

    // Today's stats state
    const [todayStats, setTodayStats] = useState({
        calories: 0,
        protein: 0,
        foods: [] // List of today's foods
    });

    // Logout function
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const healthFields = ['height', 'weight', 'goal'];

        if (healthFields.includes(name)) {
            // Update health profile (nested object)
            setUser(prev => ({
                ...prev,
                healthProfile: {
                    ...prev.healthProfile,
                    [name]: value
                }
            }));
        } else {
            // Update basic info
            setUser(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // 4. Save data to Firestore
    const handleSave = async () => {
        if (!currentUser) return;
        
        setIsSaving(true);
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                name: user.name,
                healthProfile: user.healthProfile
            });
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (error) {
            console.error("Error saving:", error);
            alert("Error saving profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };
    
    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // 1. Update basic User info
                        setUser(prev => ({
                            ...prev,
                            ...userData,

                            email: userData.email || currentUser.email,
                            // Fallbacks if fields don't exist
                            healthProfile: userData.healthProfile || { height: '', weight: '', goal: 'Maintain Weight' },
                            recentScans: userData.recentScans || []
                        }));

                        // 2. CALCULATE TODAY'S NUTRITION
                        const scans = userData.recentScans || [];
                        const todaysFoods = scans.filter(food => isToday(food.date || food.timestamp));
                        
                        const totalCalories = todaysFoods.reduce((sum, food) => sum + (Number(food.calories) || 0), 0);
                        const totalProtein = todaysFoods.reduce((sum, food) => sum + (Number(food.protein) || 0), 0);

                        setTodayStats({
                            calories: totalCalories,
                            protein: totalProtein,
                            foods: todaysFoods.reverse() // Newest foods first
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserData();
    }, [currentUser]);

    if (loading) return <div className="text-center py-10">Loading profile...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* 1. ACCOUNT INFO */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl shrink-0">
                    {user.name ? user.name.charAt(0).toUpperCase() : (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U')}
                </div>
                
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="space-y-2">
                            <input 
                                type="text" 
                                name="name"
                                value={user.name} 
                                onChange={handleInputChange}
                                className="w-full border border-blue-300 rounded px-2 py-1 font-bold text-gray-800"
                                placeholder="Display Name"
                            />
                            {/* Disable email input */}
                            <input 
                                type="text" 
                                name="email"
                                value={user.email} 
                                disabled 
                                className="w-full border border-gray-300 bg-gray-100 rounded px-2 py-1 text-sm text-gray-500 cursor-not-allowed"
                                placeholder="Email"
                            />
                        </div>
                    ) : (
                        <>
                            <h1 className="text-xl font-bold text-gray-800 truncate">{user.name || "New User"}</h1>
                            <p className="text-gray-500 text-sm truncate">{user.email || currentUser.email}</p>
                        </>
                    )}
                </div>

                <div className="flex flex-col space-y-2">
                    <button onClick={handleLogout} className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">
                        Logout
                    </button>
                    {/* Edit toggle button */}
                    {!isEditing && (
                         <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100">
                            Edit
                        </button>
                    )}
                </div>
            </div>

            {/* 2. NUTRITION OVERVIEW */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 shadow-lg text-white mb-6">
                <h2 className="text-lg font-semibold mb-4 border-b border-blue-400 pb-2">
                    Nutrition Today
                </h2>
                <div className="flex justify-between text-center">
                    <div className="flex-1 border-r border-blue-400">
                        <p className="text-3xl font-bold">{todayStats.calories}</p>
                        <p className="text-blue-100 text-sm uppercase tracking-wider">Calories</p>
                    </div>
                    <div className="flex-1 border-r border-blue-400">
                        <p className="text-3xl font-bold">{todayStats.protein}g</p>
                        <p className="text-blue-100 text-sm uppercase tracking-wider">Protein</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-3xl font-bold">{todayStats.foods.length}</p>
                        <p className="text-blue-100 text-sm uppercase tracking-wider">Meals</p>
                    </div>
                </div>
            </div>

            {/* 3. TODAY'S MEALS DETAIL */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Today's Log</h3>
                {todayStats.foods.length > 0 ? (
                    <div className="space-y-3">
                        {todayStats.foods.map((food, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4 text-orange-500 font-bold">
                                    {food.calories > 300 ? '🍖' : '🥗'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800">{food.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        {food.date && new Date(food.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-blue-600">{food.calories} cal</span>
                                    <span className="text-xs text-gray-500">{food.protein}g pro</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No meals logged today.</p>
                        <button onClick={() => navigate('/recommendations')} className="mt-2 text-blue-600 font-medium hover:underline">
                            Scan a meal now →
                        </button>
                    </div>
                )}
            </div>

            {/* 4. HEALTH PROFILE */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Health Profile</h3>
                    {isEditing ? (
                        <div className="space-x-2">
                            <button onClick={() => setIsEditing(false)} disabled={isSaving} className="text-gray-500 text-sm hover:underline">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="text-blue-600 text-sm font-bold hover:underline">
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* HEIGHT */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">Height (cm)</p>
                        {isEditing ? (
                            <input
                                type="number"
                                name="height"
                                min="0"
                                value={user.healthProfile.height}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="0"
                            />
                        ) : (
                            <p className="font-semibold">{user.healthProfile.height || '--'} cm</p>
                        )}
                    </div>

                    {/* WEIGHT */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">Weight (kg)</p>
                        {isEditing ? (
                            <input
                                type="number"
                                name="weight"
                                min="0"
                                value={user.healthProfile.weight}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="0"
                            />
                        ) : (
                            <p className="font-semibold">{user.healthProfile.weight || '--'} kg</p>
                        )}
                    </div>

                    {/* GOAL */}
                    <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                        <p className="text-gray-500 text-xs mb-1">Goal</p>
                        {isEditing ? (
                            <select
                                name="goal"
                                value={user.healthProfile.goal}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                                <option value="Lose Weight">Lose Weight</option>
                                <option value="Maintain Weight">Maintain Weight</option>
                                <option value="Gain Muscle">Gain Muscle</option>
                            </select>
                        ) : (
                            <p className="font-semibold text-blue-600">
                                {user.healthProfile.goal === 'Lose Weight' ? 'Lose Weight' : 
                                 user.healthProfile.goal === 'Gain Muscle' ? 'Gain Muscle' : 'Maintain Weight'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;