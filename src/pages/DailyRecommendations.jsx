import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDailyRecommendations } from '../services/aiService';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, arrayUnion, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const DailyRecommendations = () => {
    const { currentUser } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [loggingId, setLoggingId] = useState(null); // Track which item is being logged
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                try {
                    // 1. Fetch User Profile
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    let profile = {};
                    if (userDoc.exists()) {
                        profile = userDoc.data().healthProfile || {};
                        setUserProfile(profile);
                    }

                    // 2. Get Recommendations based on profile
                    const recs = await getDailyRecommendations(profile);
                    setRecommendations(recs);
                } catch (error) {
                    console.error("Error fetching recommendations:", error);
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [currentUser]);

    const handleLogMeal = async (food, index) => {
        if (!currentUser) return;
        setLoggingId(index);

        try {
            const userRef = doc(db, "users", currentUser.uid);
            
            const foodEntry = {
                name: food.name,
                calories: food.calories,
                protein: food.protein,
                carbs: food.carbs,
                fat: food.fat,
                tags: food.tags || ['Recommended'],
                date: new Date().toISOString().split('T')[0],
                timestamp: new Date().toISOString()
            };

            await setDoc(userRef, {
                recentScans: arrayUnion(foodEntry),
                "stats.scans": increment(1)
            }, { merge: true });

            // Optional: Show success feedback or navigate
            alert(`Successfully logged ${food.name}!`);
            navigate('/');
        } catch (error) {
            console.error("Error logging meal:", error);
            alert("Failed to log meal. Please try again.");
        } finally {
            setLoggingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-20">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button 
                        onClick={() => navigate('/')}
                        className="text-gray-500 hover:text-gray-700 mb-4 flex items-center"
                    >
                        ← Back to Home
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800">Daily Recommendations</h1>
                    <p className="text-gray-600 mt-2">
                        Curated meals based on your goal: <span className="font-semibold text-blue-600">{userProfile?.goal || 'General Health'}</span>
                    </p>
                </div>

                {/* Recommendations List */}
                <div className="space-y-6">
                    {recommendations.map((food, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                            {/* Image Placeholder */}
                            <div className="md:w-1/3 h-48 md:h-auto bg-gray-100 flex items-center justify-center text-6xl">
                                🍽️
                            </div>
                            
                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-2xl font-bold text-gray-800">{food.name}</h2>
                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                            {food.highlight}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-4">{food.reason}</p>
                                    
                                    {/* Macros */}
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase">Calories</p>
                                            <p className="font-bold text-gray-800">{food.calories}</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase">Protein</p>
                                            <p className="font-bold text-gray-800">{food.protein}g</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase">Carbs</p>
                                            <p className="font-bold text-gray-800">{food.carbs}g</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase">Fat</p>
                                            <p className="font-bold text-gray-800">{food.fat}g</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4 md:mt-0">
                                    <button 
                                        onClick={() => handleLogMeal(food, index)}
                                        disabled={loggingId === index}
                                        className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                            loggingId === index 
                                                ? 'bg-gray-400 cursor-not-allowed text-white' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {loggingId === index ? 'Logging...' : 'Log this Meal'}
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-red-500 transition-colors border border-gray-200 rounded-lg">
                                        ❤️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DailyRecommendations;
