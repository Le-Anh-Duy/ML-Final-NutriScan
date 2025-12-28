import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

// Helper: Kiểm tra xem date có phải là hôm nay không
const isToday = (dateStringOrTimestamp) => {
    if (!dateStringOrTimestamp) return false;
    
    let date;
    // Xử lý nếu là Firestore Timestamp (có hàm toDate)
    if (typeof dateStringOrTimestamp.toDate === 'function') {
        date = dateStringOrTimestamp.toDate();
    } else {
        // Xử lý nếu là chuỗi hoặc Date object
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
    
    // State dữ liệu user
    const [user, setUser] = useState({
        name: '',
        email: '',
        avatar: '',
        healthProfile: {},
        recentScans: []
    });

    // State thống kê hôm nay
    const [todayStats, setTodayStats] = useState({
        calories: 0,
        protein: 0,
        foods: [] // Danh sách món ăn hôm nay
    });

    // Hàm đăng xuất
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        
                        // 1. Cập nhật thông tin User cơ bản
                        setUser(prev => ({
                            ...prev,
                            ...userData,
                            // Đảm bảo recentScans luôn là mảng
                            recentScans: userData.recentScans || []
                        }));

                        // 2. TÍNH TOÁN DINH DƯỠNG HÔM NAY
                        const scans = userData.recentScans || [];
                        const todaysFoods = scans.filter(food => isToday(food.date || food.timestamp));
                        
                        const totalCalories = todaysFoods.reduce((sum, food) => sum + (Number(food.calories) || 0), 0);
                        const totalProtein = todaysFoods.reduce((sum, food) => sum + (Number(food.protein) || 0), 0);

                        setTodayStats({
                            calories: totalCalories,
                            protein: totalProtein,
                            foods: todaysFoods.reverse() // Món mới ăn hiện lên đầu
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

    if (loading) return <div className="text-center py-10">Đang tải thông tin...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* 1. THÔNG TIN TÀI KHOẢN (HEADER) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {/* Lấy ký tự đầu của tên hoặc email */}
                    {user.name ? user.name.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-800">{user.name || "Người dùng mới"}</h1>
                    <p className="text-gray-500 text-sm">{currentUser.email}</p>
                </div>
                <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                    Đăng xuất
                </button>
            </div>

            {/* 2. TỔNG QUAN DINH DƯỠNG HÔM NAY*/}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 shadow-lg text-white mb-6">
                <h2 className="text-lg font-semibold mb-4 border-b border-blue-400 pb-2">
                    Hôm nay bạn đã nạp
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
                        <p className="text-blue-100 text-sm uppercase tracking-wider">Món ăn</p>
                    </div>
                </div>
            </div>

            {/* 3. CHI TIẾT CÁC MÓN HÔM NAY */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Thực đơn hôm nay</h3>
                {todayStats.foods.length > 0 ? (
                    <div className="space-y-3">
                        {todayStats.foods.map((food, index) => (
                            <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
                                {/* Nếu có ảnh món ăn thì hiển thị, không thì dùng icon mặc định */}
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4 text-orange-500 font-bold">
                                    {food.calories > 300 ? '🍖' : '🥗'}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800">{food.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        {/* Hiển thị giờ nếu có */}
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
                        <p className="text-gray-500">Hôm nay bạn chưa ghi nhận món ăn nào.</p>
                        <button 
                            onClick={() => navigate('/recommendations')} 
                            className="mt-2 text-blue-600 font-medium hover:underline"
                        >
                            Quét món ăn ngay →
                        </button>
                    </div>
                )}
            </div>

            {/* 4. THÔNG TIN SỨC KHỎE (PROFILE INFO) - Giữ nguyên hoặc rút gọn */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Hồ sơ sức khỏe</h3>
                    <button className="text-blue-600 text-sm font-medium hover:underline">Chỉnh sửa</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs">Chiều cao</p>
                        <p className="font-semibold">{user.healthProfile.height || '--'} cm</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs">Cân nặng</p>
                        <p className="font-semibold">{user.healthProfile.weight || '--'} kg</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                        <p className="text-gray-500 text-xs">Mục tiêu</p>
                        <p className="font-semibold text-blue-600">{user.healthProfile.goal || 'Duy trì cân nặng'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;