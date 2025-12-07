import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getDailyRecommendations } from '../services/aiService';

const Home = () => {
    const [recentFoods, setRecentFoods] = useState([]);
    const [dailyRec, setDailyRec] = useState(null);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Get recent scans and reverse to show newest first
                        const scans = userData.recentScans || [];
                        setRecentFoods(scans.reverse());

                        // Get Daily Recommendation
                        const recs = await getDailyRecommendations(userData.healthProfile);
                        if (recs.length > 0) {
                            setDailyRec(recs[0]); // Just show the first one
                        }
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [currentUser]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    // Only show the first 3 items
    const displayedFoods = recentFoods.slice(0, 3);

    return (
        <div className="container mx-auto p-4 min-h-screen pb-20">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
                    <p className="text-gray-500">Here's your nutrition overview</p>
                </div>
                <Link to="/recommendations" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
                    <span>📷</span> Scan Food
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Activity (Takes up 2/3 on large screens) */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
                        {recentFoods.length > 3 && (
                            <Link to="/history" className="text-blue-600 font-medium hover:underline text-sm">
                                View All
                            </Link>
                        )}
                    </div>

                    {displayedFoods.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-lg mb-4">No food history yet.</p>
                            <p className="text-gray-400 mb-6">Start by scanning your first meal!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayedFoods.map((food, index) => (
                                <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                                        🍽️
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{food.name}</h3>
                                        <p className="text-sm text-gray-500">{food.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-gray-800">{food.calories} cal</span>
                                        <div className="flex gap-1 mt-1 justify-end">
                                            {food.tags && food.tags.slice(0, 2).map((tag, idx) => (
                                                <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Daily Recommendation (Takes up 1/3 on large screens) */}
                <div className="lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Recommended for You</h2>
                        <Link to="/daily-recommendations" className="text-blue-600 font-medium hover:underline text-sm">
                            See All
                        </Link>
                    </div>

                    {dailyRec ? (
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            {/* Decorative Circle */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                            
                            <div className="relative z-10">
                                <span className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full mb-3 inline-block">
                                    {dailyRec.highlight}
                                </span>
                                <h3 className="text-2xl font-bold mb-1">{dailyRec.name}</h3>
                                <p className="text-blue-100 text-sm mb-4 line-clamp-2">{dailyRec.reason}</p>
                                
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-3xl font-bold">{dailyRec.calories}</p>
                                        <p className="text-xs text-blue-100 uppercase">Calories</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-semibold">{dailyRec.protein}g</p>
                                        <p className="text-xs text-blue-100 uppercase">Protein</p>
                                    </div>
                                </div>

                                <Link to="/daily-recommendations" className="mt-6 block w-full bg-white text-blue-600 text-center py-2 rounded-lg font-bold hover:bg-blue-50 transition-colors">
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-6 text-center border border-gray-100">
                            <p className="text-gray-500">Loading recommendations...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;