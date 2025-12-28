import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Biến cache để lưu tạm, đỡ phải gọi API nhiều lần mỗi khi chuyển trang
let cachedFoods = null;

export const getAllFoods = async () => {
    // Nếu đã có cache thì trả về luôn cho nhanh
    if (cachedFoods) return cachedFoods;

    try {
        const querySnapshot = await getDocs(collection(db, "foods"));
        const foods = [];
        
        querySnapshot.forEach((doc) => {
            foods.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`Đã tải ${foods.length} món từ Firestore`);
        cachedFoods = foods; // Lưu vào cache
        return foods;
    } catch (error) {
        console.error("Lỗi lấy danh sách món:", error);
        return [];
    }
};

// Hàm tìm món theo tên (Dùng cho AI Service sau khi nhận diện xong)
export const findFoodByName = async (searchName) => {
    const foods = await getAllFoods();
    
    // Chuẩn hóa chuỗi tìm kiếm (bỏ dấu, chữ thường)
    const normalize = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const search = normalize(searchName);
    
    // Tìm tương đối
    return foods.find(f => normalize(f.name).includes(search) || search.includes(normalize(f.name)));
};