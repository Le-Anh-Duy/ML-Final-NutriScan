import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDailyRecommendations } from '../services/aiService';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const DailyRecommendations = () => {
    const { currentUser } = useAuth();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loggingId, setLoggingId] = useState(null); 
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                try {
                    // 1. Lấy thông tin User Profile
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    let profile = {};
                    if (userDoc.exists()) {
                        profile = userDoc.data().healthProfile || {};
                    }

                    // 2. Gọi hàm lấy gợi ý 
                    const recs = await getDailyRecommendations(profile, currentUser.uid);
                    setRecommendations(recs);
                } catch (error) {
                    console.error("Error fetching recommendations:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser]);

    // Hàm xử lý khi bấm "Log this Meal"
    const handleLogMeal = async (food, index) => {
        if (!currentUser) return;
        setLoggingId(index);

        try {
            const userRef = doc(db, "users", currentUser.uid);

            // Chuẩn bị dữ liệu để lưu
            const foodToSave = {
                name: food.name,
                calories: Number(food.calories) || 0,
                protein: Number(food.protein) || 0,
                fat: Number(food.fat) || 0,
                carbs: Number(food.carbs) || 0,
                image: food.image || null,
                
                date: new Date().toISOString(), // Dùng lọc theo ngày
                timestamp: new Date()           // Dùng sắp xếp thời gian
            };

            await updateDoc(userRef, {
                recentScans: arrayUnion(foodToSave),
                "stats.scans": increment(1) // Tăng số lần log món ăn
            });

            alert("Đã thêm món ăn vào nhật ký!");
        } catch (error) {
            console.error("Error logging meal:", error);
            alert("Lỗi khi lưu món ăn: " + error.message);
        } finally {
            setLoggingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pb-24">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Thực đơn gợi ý hôm nay</h1>
                <p className="text-gray-500 mb-8">Dựa trên mục tiêu sức khỏe của bạn</p>

                <div className="grid gap-6">
                    {recommendations.map((food, index) => (
                        <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 animate-fade-in">
                            {/* Ảnh món ăn */}
                            <div className="w-full md:w-48 h-48 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden relative">
                                {food.image ? (
                                    <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">🥗</div>
                                )}
                                {/* Tag lý do gợi ý */}
                                {food.highlight && (
                                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                        {food.highlight}
                                    </div>
                                )}
                            </div>

                            {/* Thông tin chi tiết */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">{food.name}</h3>
                                    <p className="text-gray-600 text-sm mb-4 bg-blue-50 p-2 rounded-lg inline-block">
                                        💡 {food.reason}
                                    </p>
                                    
                                    {/* Grid dinh dưỡng */}
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase">Calo</p>
                                            <p className="font-bold text-blue-600">{food.calories}</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase">Pro</p>
                                            <p className="font-bold text-gray-700">{food.protein}g</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase">Carb</p>
                                            <p className="font-bold text-gray-700">{food.carbs}g</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 uppercase">Fat</p>
                                            <p className="font-bold text-gray-700">{food.fat}g</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Nút bấm */}
                                <div className="flex gap-3 mt-4 md:mt-0">
                                    <button 
                                        onClick={() => handleLogMeal(food, index)}
                                        disabled={loggingId === index}
                                        className={`flex-1 py-2 rounded-xl font-bold transition-all shadow-sm active:scale-95 ${
                                            loggingId === index 
                                                ? 'bg-gray-400 cursor-not-allowed text-white' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                    >
                                        {loggingId === index ? 'Đang lưu...' : '➕ Ăn món này'}
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