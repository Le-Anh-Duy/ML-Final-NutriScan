import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Lấy URL API từ biến môi trường
const API_URL = import.meta.env.VITE_AI_API_URL || "http://localhost:5000";

/**
 * Helper: Chuyển file ảnh sang Base64
 */
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

/**
 * 1. CHỨC NĂNG QUÉT ẢNH (AI SCAN)
 * Gửi ảnh lên Backend Python để nhận diện món ăn (/predict)
 */
export const analyzeImage = async (imageFile) => {
    try {
        const base64Image = await toBase64(imageFile);

        console.log("📤 Đang gửi ảnh lên AI Server...");
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });

        const data = await response.json();
        
        if (data.success) {
            return data; // Trả về { predictions, bestMatch }
        } else {
            throw new Error(data.message || "Lỗi nhận diện từ Server");
        }
    } catch (error) {
        console.error("❌ Lỗi AI Analyze:", error);
        return null;
    }
};

/**
 * 2. CHỨC NĂNG GỢI Ý THỰC ĐƠN (DYNAMIC RECOMMENDATION)
 * - Bước 1: Lấy lịch sử ăn uống từ Firestore (user.recentScans)
 * - Bước 2: Lọc ra các món ĐÃ ĂN HÔM NAY
 * - Bước 3: Tính tổng dinh dưỡng đã nạp
 * - Bước 4: Gửi cho Backend để tìm món bù đắp phần thiếu
 */
export const getDailyRecommendations = async (userProfile, userId) => {
    // Cache key theo ngày để tránh gọi API quá nhiều nếu không cần thiết
    // Tuy nhiên với dynamic recommendation, ta nên gọi trực tiếp để cập nhật ngay khi vừa ăn xong
    const todayStr = new Date().toDateString(); // VD: "Sun Dec 28 2025"

    try {
        // --- BƯỚC 1 & 2: TÍNH TOÁN DINH DƯỠNG ĐÃ NẠP HÔM NAY ---
        let eatenToday = { calories: 0, protein: 0, fat: 0, carbs: 0 };

        if (userId) {
            const userDoc = await getDoc(doc(db, "users", userId));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const scans = userData.recentScans || [];

                // Lọc các món ăn có timestamp trùng với ngày hôm nay
                const todayMeals = scans.filter(meal => {
                    let mealDate = new Date();
                    
                    // Xử lý timestamp của Firestore (dạng object có hàm toDate())
                    if (meal.timestamp && typeof meal.timestamp.toDate === 'function') {
                        mealDate = meal.timestamp.toDate();
                    } 
                    // Xử lý nếu lưu dạng chuỗi hoặc số
                    else if (meal.timestamp) {
                        mealDate = new Date(meal.timestamp);
                    }
                    
                    return mealDate.toDateString() === todayStr;
                });

                // Cộng dồn
                todayMeals.forEach(meal => {
                    eatenToday.calories += Number(meal.calories || 0);
                    eatenToday.protein += Number(meal.protein || 0);
                    eatenToday.fat += Number(meal.fat || 0);
                    eatenToday.carbs += Number(meal.carbs || 0);
                });

                console.log(`📊 Hôm nay đã ăn: ${todayMeals.length} món - ${eatenToday.calories} Kcal`);
            }
        }

        // --- BƯỚC 3: GỌI BACKEND PYTHON ---
        // Gửi kèm eatenToday để Backend trừ đi
        console.log("📤 Đang lấy gợi ý từ AI...", eatenToday);
        
        const response = await fetch(`${API_URL}/recommend`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userProfile: userProfile, // Chiều cao, cân nặng, mục tiêu
                eatenToday: eatenToday    // Dữ liệu đã ăn (để tính phần thiếu)
            }),
        });

        const data = await response.json();

        if (data.success && data.recommendations) {
            // Lưu cache (tùy chọn, ở đây mình trả về luôn cho tươi mới)
            return data.recommendations;
        } else {
            console.warn("⚠️ AI không trả về gợi ý nào.");
            return [];
        }

    } catch (error) {
        console.error("❌ Lỗi lấy gợi ý:", error);
        // Trả về mảng rỗng để UI không bị crash
        return [];
    }
};