import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const History = () => {
    const [history, setHistory] = useState([]);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const scans = userData.recentScans || [];
                        
                        // Đảo ngược để món mới nhất lên đầu
                        setHistory(scans.slice().reverse());
                    }
                } catch (error) {
                    console.error("Lỗi lấy lịch sử:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchHistory();
    }, [currentUser]);

    // Hàm xử lý khi ảnh bị lỗi (QUAN TRỌNG)
    const handleImageError = (e) => {
        e.target.onerror = null; 
        e.target.src = "https://placehold.co/400x300?text=Food+Image"; // Ảnh thế mạng
    };

    // Hàm format thời gian đẹp
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        // Xử lý cả 2 trường hợp: Timestamp của Firestore hoặc Date string
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 min-h-screen bg-gray-50">
            {/* Header */}
            <header className="flex items-center mb-6 sticky top-0 bg-gray-50 z-10 py-2">
                <Link to="/" className="mr-4 p-2 bg-white rounded-full shadow-sm text-gray-600 hover:bg-gray-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Eating History</h1>
            </header>

            {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((item, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col sm:flex-row h-full">
                            
                            {/* --- PHẦN ẢNH (Đã cập nhật) --- */}
                            <div className="h-48 sm:h-auto sm:w-40 bg-gray-100 relative">
                                <img 
                                    src={item.image || "https://placehold.co/400x300?text=No+Image"} 
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                    onError={handleImageError} 
                                />
                            </div>

                            {/* --- PHẦN THÔNG TIN --- */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-gray-800 text-lg line-clamp-1" title={item.name}>
                                            {item.name}
                                        </h3>
                                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md shrink-0 ml-2">
                                            {Math.round(item.calories)} Cal
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-xs mb-3 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {formatTime(item.timestamp)}
                                    </p>
                                </div>

                                {/* Chỉ số dinh dưỡng chi tiết */}
                                <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 mt-auto">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-400 uppercase">Protein</p>
                                        <p className="font-bold text-gray-700">{item.protein || 0}g</p>
                                    </div>
                                    <div className="text-center border-l border-gray-100">
                                        <p className="text-xs text-gray-400 uppercase">Carbs</p>
                                        <p className="font-bold text-gray-700">{item.carbs || 0}g</p>
                                    </div>
                                    <div className="text-center border-l border-gray-100">
                                        <p className="text-xs text-gray-400 uppercase">Fat</p>
                                        <p className="font-bold text-gray-700">{item.fat || 0}g</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                        🍽️
                    </div>
                    <h3 className="text-gray-800 font-bold text-lg mb-2">No meals yet</h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                        Start scanning your food to track calories and nutrition.
                    </p>
                    <Link to="/recommendations" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
                        Scan Meal Now
                    </Link>
                </div>
            )}
        </div>
    );
};

export default History;