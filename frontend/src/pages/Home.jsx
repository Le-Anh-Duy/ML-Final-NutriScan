import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getDailyRecommendations } from '../services/aiService';

const Home = () => {
    const [recentFoods, setRecentFoods] = useState([]);
    const [dailyRec, setDailyRec] = useState(null);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false); // Trạng thái khi đang thêm món

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // 1. Lấy lịch sử (5 món mới nhất)
                        const scans = userData.recentScans || [];
                        setRecentFoods(scans.slice().reverse().slice(0, 5));

                        // 2. Lấy Gợi ý hôm nay
                        const recs = await getDailyRecommendations(userData.healthProfile, currentUser.uid);
                        if (recs && recs.length > 0) {
                            setDailyRec(recs[0]); 
                        }
                    }
                } catch (error) {
                    console.error("Error fetching home data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [currentUser]);

    // Hàm xử lý ảnh lỗi
    const handleImageError = (e) => {
        e.target.onerror = null; 
        e.target.src = "https://placehold.co/400x300?text=Food+Image"; 
    };

    // --- TÍNH NĂNG MỚI: THÊM NHANH MÓN GỢI Ý ---
    const handleQuickAdd = async () => {
        if (!dailyRec || !currentUser) return;
        setAdding(true);

        try {
            // Tạo object món ăn mới với thời gian hiện tại
            const newFoodEntry = {
                name: dailyRec.name,
                calories: dailyRec.calories || dailyRec.Energy || 0,
                protein: dailyRec.protein || dailyRec.Protein || 0,
                fat: dailyRec.fat || dailyRec.Fat || 0,
                carbs: dailyRec.carbs || dailyRec.Carbohydrate || 0,
                image: dailyRec.image || "",
                timestamp: new Date() // Lưu thời gian hiện tại
            };

            // 1. Lưu vào Firestore
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                recentScans: arrayUnion(newFoodEntry)
            });

            // 2. Cập nhật giao diện ngay lập tức (đỡ phải F5)
            setRecentFoods([newFoodEntry, ...recentFoods].slice(0, 5));
            
            alert(`Đã thêm "${dailyRec.name}" vào nhật ký ăn uống!`);

        } catch (error) {
            console.error("Lỗi khi thêm món:", error);
            alert("Có lỗi xảy ra, vui lòng thử lại.");
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="p-4 pb-24 min-h-screen bg-gray-50">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Hello, {currentUser?.displayName || 'User'} 👋</h1>
                    <p className="text-gray-500 text-sm">Let's eat healthy today!</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shadow-sm">
                    {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
            </header>

            {/* MAIN LAYOUT: GRID 2 CỘT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* --- CỘT TRÁI: RECENT MEALS (Danh sách dọc) --- */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Recent Meals</h2>
                        <Link to="/history" className="text-blue-600 text-sm font-medium hover:underline">View all</Link>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {recentFoods.length > 0 ? (
                            recentFoods.map((item, index) => (
                                <div key={index} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.01]">
                                    <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                        <img 
                                            src={item.image || 'https://placehold.co/150'} 
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={handleImageError}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">{new Date(item.timestamp?.toDate ? item.timestamp.toDate() : item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap">
                                        {Math.round(item.calories)} Kcal
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-400 text-sm">No meals scanned yet.</p>
                                <Link to="/add-food" className="text-blue-500 text-sm mt-2 inline-block font-medium">Scan now</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CỘT PHẢI: RECOMMENDED FOR YOU (Thẻ lớn + Nút Add) --- */}
                <div className="lg:sticky lg:top-4">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Recommended for You</h2>
                    
                    {!loading && dailyRec ? (
                        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100 relative overflow-hidden group">
                            {/* Badge Best Match */}
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                                BEST MATCH
                            </div>
                            
                            {/* Ảnh lớn */}
                            <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100 mb-4 relative">
                                <img 
                                    src={dailyRec.image} 
                                    alt={dailyRec.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={handleImageError}
                                />
                                {/* Lý do gợi ý (Overlay) */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-10">
                                    <p className="text-white text-xs font-medium truncate">
                                        ✨ {dailyRec.reason || "Phù hợp với mục tiêu của bạn"}
                                    </p>
                                </div>
                            </div>

                            {/* Thông tin chính */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1">{dailyRec.name}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-bold">
                                            {Math.round(dailyRec.calories || dailyRec.Energy)} Kcal
                                        </span>
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold">
                                            {dailyRec.protein || dailyRec.Protein}g Protein
                                        </span>
                                    </div>
                                </div>
                                
                                {/* NÚT ADD NHANH (MỚI) */}
                                <button 
                                    onClick={handleQuickAdd}
                                    disabled={adding}
                                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center"
                                    title="Add this meal to diary"
                                >
                                    {adding ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            {/* Chỉ số chi tiết */}
                            <div className="grid grid-cols-3 gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="text-center border-r border-gray-200">
                                    <p className="text-lg font-bold text-gray-800">{dailyRec.carbs || dailyRec.Carbohydrate}g</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Carbs</p>
                                </div>
                                <div className="text-center border-r border-gray-200">
                                    <p className="text-lg font-bold text-gray-800">{dailyRec.fat || dailyRec.Fat}g</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Fat</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-gray-800">{dailyRec.fiber || dailyRec.Fiber || 0}g</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Fiber</p>
                                </div>
                            </div>

                            <Link to="/daily-recommendations" className="block w-full text-center bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                                View Full Menu
                            </Link>
                        </div>
                    ) : (
                        // Loading Skeleton
                        <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100 h-80 flex flex-col items-center justify-center">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                             <p className="text-gray-400 text-sm">AI is finding the best meal for you...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;