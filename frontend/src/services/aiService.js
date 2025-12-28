import { foodDatabase } from '../data/foodDatabase';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Lấy URL API từ biến môi trường (file .env)
const API_URL = import.meta.env.VITE_AI_API_URL; // Ví dụ: http://localhost:5000

/**
 * Helper: Chuyển file ảnh sang chuỗi Base64 để gửi qua JSON
 */
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

/**
 * 1. CHỨC NĂNG QUÉT ẢNH (AI SCAN)
 * Gọi xuống Backend Python để nhận diện món ăn
 */
export const analyzeImage = async (imageFile) => {
    try {
        if (!API_URL) throw new Error("Chưa cấu hình VITE_AI_API_URL trong file .env");

        // B1: Chuyển ảnh sang Base64
        const base64Image = await toBase64(imageFile);

        // B2: Gọi API Python (/predict)
        console.log("Sending image to AI Backend...");
        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                image: base64Image,
                // model_id: "lsnet_tiny_103" // Tùy chọn, backend đang mặc định lấy model đầu tiên
            }),
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Lỗi nhận diện từ AI');

        // B3: Làm giàu dữ liệu (Enrichment)
        // AI chỉ trả về tên (ví dụ: "banh-mi"), ta cần lấy Calo/Protein từ foodDatabase
        
        const enrichPrediction = (aiPred) => {
            // Chuẩn hóa tên để tìm kiếm (bỏ dấu gạch ngang, chữ thường)
            const aiNameClean = aiPred.name.replace(/-/g, ' ').toLowerCase();
            
            // Tìm trong database nội bộ món nào có tên giống nhất
            const localFood = foodDatabase.find(f => 
                f.name.toLowerCase().includes(aiNameClean) || 
                (f.id && f.id.toLowerCase() === aiNameClean)
            );

            // Ưu tiên lấy thông tin từ localFood (vì có calo chuẩn), nếu không thì dùng tạm AI
            return {
                name: localFood ? localFood.name : aiPred.name,
                calories: localFood ? localFood.calories : 0, // AI thường không trả về calo chính xác
                protein: localFood ? localFood.protein : 0,
                fat: localFood ? localFood.fat : 0,
                carbs: localFood ? localFood.carbs : 0,
                confidence: aiPred.confidence,
                image: localFood ? localFood.image : null // Lấy ảnh đẹp từ DB nếu có
            };
        };

        const enrichedBestMatch = enrichPrediction(data.bestMatch);
        const enrichedPredictions = data.predictions ? data.predictions.map(enrichPrediction) : [];

        return {
            bestMatch: enrichedBestMatch,
            predictions: enrichedPredictions
        };

    } catch (error) {
        console.error("AI Scan Error:", error);
        throw new Error("Không thể nhận diện món ăn. Hãy kiểm tra kết nối Server.");
    }
};

/**
 * 2. CHỨC NĂNG GỢI Ý MÓN ĂN (DAILY RECOMMENDATIONS)
 * Cache 24h + Thuật toán tính toán dinh dưỡng (Python)
 */
export const getDailyRecommendations = async (userProfile, userId) => {
    if (!userId) return [];

    const todayStr = new Date().toDateString(); // Ví dụ: "Mon Dec 28 2025"
    const cacheRef = doc(db, 'daily_caches', userId);

    // --- BƯỚC 1: KIỂM TRA CACHE FIREBASE ---
    try {
        const docSnap = await getDoc(cacheRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Nếu cache tồn tại VÀ đúng ngày hôm nay -> Dùng lại ngay
            if (data.date === todayStr && data.recommendations?.length > 0) {
                console.log("Serving cached recommendations (From Firebase)");
                return data.recommendations;
            }
        }
    } catch (e) { 
        console.warn("⚠️ Cache read warning:", e); 
    }

    // --- BƯỚC 2: NẾU KHÔNG CÓ CACHE -> GỌI PYTHON API ---
    let finalRecs = [];
    try {
        console.log("Calling Python Calculation Engine (/recommend)...");
        
        // Chuẩn bị dữ liệu gửi xuống Python (Xử lý các trường thiếu)
        const payload = {
            userProfile: {
                ...userProfile,
                // Tính tuổi: Nếu có ngày sinh thì tính, không thì mặc định 25
                age: userProfile.birthDate 
                    ? (new Date().getFullYear() - new Date(userProfile.birthDate).getFullYear()) 
                    : 25,
                weight: Number(userProfile.weight) || 60,
                height: Number(userProfile.height) || 170,
                gender: userProfile.gender || 'Male',
                activityLevel: userProfile.activityLevel || 'Medium',
                goal: userProfile.goal || 'Maintain Weight'
            }
        };

        const response = await fetch(`${API_URL}/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success && data.recommendations.length > 0) {
            finalRecs = data.recommendations;
        } else {
            throw new Error(data.message || "Python trả về danh sách rỗng");
        }

    } catch (error) {
        console.error("Backend Recommendation Failed, using fallback logic:", error);
        
        // Nếu Server Python chết hoặc lỗi, dùng logic Random để app không bị chết
        const goal = userProfile?.goal || 'Maintain Weight';
        const pickRandom = (arr, n) => arr.sort(() => 0.5 - Math.random()).slice(0, n);

        if (goal === 'Lose Weight') {
            finalRecs = pickRandom(foodDatabase.filter(f => f.calories < 400), 3);
        } else if (goal === 'Gain Muscle') {
            finalRecs = pickRandom(foodDatabase.filter(f => f.protein > 20), 3);
        } else {
            finalRecs = pickRandom(foodDatabase, 3);
        }
        
        // Gán lý do mặc định
        finalRecs = finalRecs.map(f => ({
            ...f,
            reason: "Gợi ý thay thế (Server đang bảo trì)"
        }));
    }

    // --- BƯỚC 4: LƯU KẾT QUẢ VÀO CACHE ---
    try {
        await setDoc(cacheRef, {
            date: todayStr,
            recommendations: finalRecs,
            updatedAt: new Date()
        });
        console.log("New recommendations saved to Cache");
    } catch (e) { 
        console.error("Cache save error:", e); 
    }

    return finalRecs;
};