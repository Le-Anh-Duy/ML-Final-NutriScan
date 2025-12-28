import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

    // State loading khi đang lưu dữ liệu
    const [isSaving, setIsSaving] = useState(false);

    // State kiểm soát chế độ sửa
    const [isEditing, setIsEditing] = useState(false);
    
    // State dữ liệu user
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const healthFields = ['height', 'weight', 'goal'];

        if (healthFields.includes(name)) {
            // Cập nhật thông tin sức khỏe (nested object)
            setUser(prev => ({
                ...prev,
                healthProfile: {
                    ...prev.healthProfile,
                    [name]: value
                }
            }));
        } else {
            // Cập nhật thông tin cơ bản (name, email)
            setUser(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // 4. Hàm lưu dữ liệu lên Firestore
    const handleSave = async () => {
        if (!currentUser) return;
        
        setIsSaving(true); // Bắt đầu loading
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, {
                name: user.name,
                healthProfile: user.healthProfile
            });
            setIsEditing(false);
            alert("Đã cập nhật hồ sơ!");
        } catch (error) {
            console.error("Lỗi khi lưu:", error);
            alert("Lỗi khi lưu, vui lòng thử lại.");
        } finally {
            setIsSaving(false); // Kết thúc loading
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

                            email: userData.email || currentUser.email,
                            // Fallbacks nếu trường không tồn tại
                            healthProfile: userData.healthProfile || { height: '', weight: '', goal: 'Maintain Weight' },
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
            {/* 1. THÔNG TIN TÀI KHOẢN */}
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
                                placeholder="Tên hiển thị"
                            />
                            {/* Vô hiệu hóa input email để user không sửa nhầm */}
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
                            <h1 className="text-xl font-bold text-gray-800 truncate">{user.name || "Người dùng mới"}</h1>
                            <p className="text-gray-500 text-sm truncate">{user.email || currentUser.email}</p>
                        </>
                    )}
                </div>

                <div className="flex flex-col space-y-2">
                    <button onClick={handleLogout} className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">
                        Đăng xuất
                    </button>
                    {/* Nút bật/tắt sửa */}
                    {!isEditing && (
                         <button onClick={() => setIsEditing(true)} className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold hover:bg-blue-100">
                            Sửa
                        </button>
                    )}
                </div>
            </div>

            {/* 2. TỔNG QUAN DINH DƯỠNG */}
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
                        <p className="text-gray-500">Hôm nay bạn chưa ghi nhận món ăn nào.</p>
                        <button onClick={() => navigate('/recommendations')} className="mt-2 text-blue-600 font-medium hover:underline">
                            Quét món ăn ngay →
                        </button>
                    </div>
                )}
            </div>

            {/* 4. THÔNG TIN SỨC KHỎE */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Hồ sơ sức khỏe</h3>
                    {isEditing ? (
                        <div className="space-x-2">
                            <button onClick={() => setIsEditing(false)} disabled={isSaving} className="text-gray-500 text-sm hover:underline">Hủy</button>
                            {/* (Đã sửa) Disabled nút Lưu khi đang saving */}
                            <button onClick={handleSave} disabled={isSaving} className="text-blue-600 text-sm font-bold hover:underline">
                                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="text-blue-600 text-sm font-medium hover:underline">Chỉnh sửa</button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* CHIỀU CAO */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">Chiều cao (cm)</p>
                        {isEditing ? (
                            <input
                                type="number"
                                name="height"
                                min="0" // (Đã sửa) Thêm min=0
                                value={user.healthProfile.height}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="0"
                            />
                        ) : (
                            <p className="font-semibold">{user.healthProfile.height || '--'} cm</p>
                        )}
                    </div>

                    {/* CÂN NẶNG */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs mb-1">Cân nặng (kg)</p>
                        {isEditing ? (
                            <input
                                type="number"
                                name="weight"
                                min="0" // (Đã sửa) Thêm min=0
                                value={user.healthProfile.weight}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                                placeholder="0"
                            />
                        ) : (
                            <p className="font-semibold">{user.healthProfile.weight || '--'} kg</p>
                        )}
                    </div>

                    {/* MỤC TIÊU */}
                    <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                        <p className="text-gray-500 text-xs mb-1">Mục tiêu</p>
                        {isEditing ? (
                            <select
                                name="goal"
                                value={user.healthProfile.goal}
                                onChange={handleInputChange}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm"
                            >
                                <option value="Lose Weight">Giảm cân</option>
                                <option value="Maintain Weight">Duy trì cân nặng</option>
                                <option value="Gain Muscle">Tăng cơ</option>
                            </select>
                        ) : (
                            <p className="font-semibold text-blue-600">
                                {user.healthProfile.goal === 'Lose Weight' ? 'Giảm cân' : 
                                 user.healthProfile.goal === 'Gain Muscle' ? 'Tăng cơ' : 'Duy trì cân nặng'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;