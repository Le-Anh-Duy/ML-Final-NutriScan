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

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // 1. Lấy danh sách món ăn gần đây
                        const scans = userData.recentScans || [];
                        setRecentFoods(scans.slice().reverse().slice(0, 5)); // 5 món mới nhất

                        // 2. Lấy Daily Recommendation
                        const recs = await getDailyRecommendations(userData.healthProfile, currentUser.uid);
                        
                        if (recs && recs.length > 0) {
                            setDailyRec(recs[0]); // Lấy món đầu tiên
                        }
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                }
            }
        };

        fetchData();
    }, [currentUser]);

    return (
        <div className="container mx-auto px-4 py-6 pb-24">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Hello, Foodie! 👋</h1>
                    <p className="text-gray-500">Track your meals & stay healthy</p>
                </div>
                <Link to="/profile" className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden shadow-sm hover:ring-2 hover:ring-blue-200 transition-all">
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                        {currentUser?.email?.charAt(0).toUpperCase()}
                    </div>
                </Link>
            </div>

            {/* --- MAIN GRID LAYOUT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* === RECENT ACTIVITY === */}
                <div className="order-2 lg:order-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
                        <Link to="/recommendations" className="text-blue-600 text-sm font-medium hover:underline">
                            + New Scan
                        </Link>
                    </div>

                    {recentFoods.length > 0 ? (
                        <div className="space-y-3">
                            {recentFoods.map((food, index) => (
                                <div key={index} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl overflow-hidden">
                                            {food.image ? (
                                                <img src={food.image} alt={food.name} className="w-full h-full object-cover"/>
                                            ) : (
                                                '🍱'
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm">{food.name}</h4>
                                            <p className="text-xs text-gray-500">
                                                {/* Hiển thị giờ nếu là timestamp, hoặc ngày */}
                                                {food.timestamp 
                                                    ? new Date(food.timestamp.seconds ? food.timestamp.seconds * 1000 : food.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                                                    : 'Today'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-blue-600 text-sm">{food.calories}</span>
                                        <span className="text-xs text-gray-400">kcal</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 mb-2">Chưa có nhật ký ăn uống</p>
                            <Link to="/recommendations" className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-200 transition-colors">
                                Ghi lại món đầu tiên
                            </Link>
                        </div>
                    )}
                </div>

                {/* === RECOMMENDED FOR YOU === */}
                <div className="order-1 lg:order-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Recommended for You</h2>
                        <Link to="/daily-recommendations" className="text-blue-600 text-sm font-medium hover:underline">See All</Link>
                    </div>

                    {dailyRec ? (
                        <div className="bg-white rounded-2xl p-5 shadow-lg border border-blue-100 relative overflow-hidden group">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110"></div>

                            <div className="flex flex-col items-center text-center z-10 relative">
                                <div className="w-32 h-32 bg-gray-100 rounded-full mb-4 overflow-hidden shadow-md border-4 border-white">
                                    {dailyRec.image ? (
                                        <img src={dailyRec.image} alt={dailyRec.name} className="w-full h-full object-cover"/>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl">🥗</div>
                                    )}
                                </div>
                                
                                <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-2">
                                    Top Pick Today
                                </span>
                                
                                <h3 className="text-xl font-bold text-gray-800 mb-1">{dailyRec.name}</h3>
                                <p className="text-gray-500 text-sm mb-4 px-4 line-clamp-2">{dailyRec.reason}</p>
                                
                                <div className="flex gap-8 mb-6 border-t border-gray-100 pt-4 w-full justify-center">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-800">{dailyRec.calories}</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Calories</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-800">{dailyRec.protein}g</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Protein</p>
                                    </div>
                                </div>

                                <Link to="/daily-recommendations" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-blue-200 shadow-lg">
                                    View Full Menu
                                </Link>
                            </div>
                        </div>
                    ) : (
                        // Loading Skeleton
                        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 h-80 flex flex-col items-center justify-center">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                             <p className="text-gray-400 text-sm">Finding best meals for you...</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Home;