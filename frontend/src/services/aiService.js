import { foodDatabase } from '../data/foodDatabase';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * 1. MOCK AI: Giả lập phân tích ảnh (KHÔNG gọi Python Backend)
 * Trả về kết quả random từ foodDatabase sau 1.5s
 */
export const analyzeImage = async (imageFile) => {
    // Giả lập độ trễ mạng
    const delay = 1000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Lấy random từ database có sẵn
    // Logic: Xáo trộn mảng và lấy 5 phần tử đầu
    const shuffled = [...foodDatabase].sort(() => 0.5 - Math.random());
    
    // Tạo độ tin cậy giả (confidence)
    const predictions = shuffled.slice(0, 5).map((food, index) => ({
        ...food,
        // Món đầu tiên tin cậy cao (85-95%), các món sau thấp hơn
        confidence: index === 0 ? 85 + Math.floor(Math.random() * 10) : 60 - (index * 10) + Math.floor(Math.random() * 10)
    }));

    return {
        bestMatch: predictions[0],
        predictions: predictions
    };
};

/**
 * 2. REAL LOGIC: Gợi ý món ăn hằng ngày (Cache 24h trên Firestore)
 * Giữ nguyên logic này để user không bị đổi thực đơn mỗi lần F5
 */
export const getDailyRecommendations = async (userProfile, userId) => {
    if (!userId) return [];

    const todayStr = new Date().toDateString(); // Ví dụ: "Mon Dec 28 2025"
    const cacheRef = doc(db, 'daily_caches', userId);

    try {
        // Kiểm tra xem hôm nay đã tạo thực đơn chưa
        const docSnap = await getDoc(cacheRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Nếu đúng ngày hôm nay -> Trả về thực đơn đã lưu (KHÔNG Random lại)
            if (data.date === todayStr && data.recommendations?.length > 0) {
                console.log("🎯 Serving cached recommendations (Firebase)");
                return data.recommendations;
            }
        }
    } catch (e) { console.warn("Cache read error", e); }

    // Nếu chưa có thực đơn hôm nay -> Tạo mới (Random thông minh theo Goal)
    await new Promise(r => setTimeout(r, 500)); 
    
    const goal = userProfile?.goal || 'Maintain Weight';
    let recs = [];
    const pickRandom = (arr, n) => arr.sort(() => 0.5 - Math.random()).slice(0, n);

    if (goal === 'Lose Weight') {
        recs = pickRandom(foodDatabase.filter(f => f.calories < 400), 3);
    } else if (goal === 'Gain Muscle') {
        recs = pickRandom(foodDatabase.filter(f => f.protein > 20), 3);
    } else {
        recs = pickRandom(foodDatabase, 3);
    }
    
    const finalRecs = recs.map(f => ({
        ...f, 
        reason: goal === 'Lose Weight' ? 'Ít calo, hỗ trợ giảm cân' : 
                goal === 'Gain Muscle' ? 'Giàu protein, hỗ trợ tăng cơ' : 'Dinh dưỡng cân bằng'
    }));

    // Lưu thực đơn mới vào Firebase để dùng lại trong ngày
    try {
        await setDoc(cacheRef, {
            date: todayStr,
            recommendations: finalRecs,
            updatedAt: new Date()
        });
    } catch (e) { console.error("Cache save error", e); }

    return finalRecs;
};