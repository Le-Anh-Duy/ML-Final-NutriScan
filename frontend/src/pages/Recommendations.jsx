import React, { useRef, useState, useEffect } from 'react';
import { analyzeImage, getDailyRecommendations } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, arrayUnion, getDoc, setDoc } from 'firebase/firestore'; // updateDoc/setDoc
import { useNavigate } from 'react-router-dom';

const Recommendations = () => {
    // --- STATE ---
    const [dailyMeals, setDailyMeals] = useState([]);
    const [loadingDaily, setLoadingDaily] = useState(true);

    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [currentFood, setCurrentFood] = useState(null); 
    
    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ name: '', calories: '', protein: '' });

    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const { currentUser } = useAuth();

    // 1. LOAD DAILY RECS (Logic Cache 24h)
    useEffect(() => {
        const fetchDaily = async () => {
            if (currentUser) {
                setLoadingDaily(true);
                try {
                    const userRef = doc(db, 'users', currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    const userProfile = userSnap.exists() ? userSnap.data().healthProfile : {};

                    const meals = await getDailyRecommendations(userProfile, currentUser.uid);
                    setDailyMeals(meals);
                } catch (err) {
                    console.error("Failed to load daily recommendations", err);
                } finally {
                    setLoadingDaily(false);
                }
            }
        };
        fetchDaily();
    }, [currentUser]);

    // 2. CAMERA HANDLING
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
            setCurrentFood(null);
            handleAnalyze(file);
        }
    };

    // 3. MOCK ANALYZE
    const handleAnalyze = async (file) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const result = await analyzeImage(file);
            setCurrentFood(result.bestMatch);
            setEditData({
                name: result.bestMatch.name,
                calories: result.bestMatch.calories || 0,
                protein: result.bestMatch.protein || 0
            });
        } catch (err) {
            setError("Lỗi nhận diện: " + err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 4. SAVE (Lưu để trang Profile tính toán)
    const handleSave = async () => {
        if (!currentUser || !currentFood) return;
        setIsSaving(true);
        try {
            const userRef = doc(db, "users", currentUser.uid);
            
            const foodToSave = {
                name: isEditing ? editData.name : currentFood.name,
                calories: Number(isEditing ? editData.calories : currentFood.calories) || 0,
                protein: Number(isEditing ? editData.protein : currentFood.protein) || 0,
                // Lưu ảnh để hiển thị lại
                image: currentFood.image || imagePreview, 
                date: new Date().toISOString(), 
                timestamp: new Date()
            };

            await setDoc(userRef, {
                recentScans: arrayUnion(foodToSave)
            }, { merge: true });

            alert("Đã lưu món ăn thành công!");
            setImagePreview(null);
            setCurrentFood(null);
        } catch (err) {
            console.error(err);
            setError("Lỗi lưu: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-6 pb-24">
            {/* GỢI Ý HÔM NAY (CACHE 24H) */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📅 Thực đơn hôm nay</h2>
                {loadingDaily ? <p>Đang tải...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {dailyMeals.map((meal, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-3">
                                <img src={meal.image} alt={meal.name} className="w-16 h-16 rounded-lg object-cover bg-gray-200"/>
                                <div>
                                    <h3 className="font-bold text-sm">{meal.name}</h3>
                                    <p className="text-xs text-gray-500">{meal.calories} cal • {meal.protein}g pro</p>
                                    <p className="text-[10px] text-green-600 font-medium">{meal.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SCAN (MOCK AI) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-300 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 relative overflow-hidden"
                >
                    {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-contain" />
                    ) : (
                        <>
                            <span className="text-4xl mb-2">📷</span>
                            <p className="text-gray-500">Chạm để chụp ảnh</p>
                        </>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    
                    {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                            Đang phân tích...
                        </div>
                    )}
                </div>

                {/* KẾT QUẢ & NÚT SAVE */}
                {currentFood && !isAnalyzing && (
                    <div className="mt-6 text-left animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg">Kết quả (Demo)</h3>
                            <button onClick={() => setIsEditing(!isEditing)} className="text-blue-600 text-sm">Sửa</button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl mb-4">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <input value={editData.name} onChange={e=>setEditData({...editData, name: e.target.value})} className="w-full p-2 border rounded" />
                                    <div className="flex gap-2">
                                        <input type="number" value={editData.calories} onChange={e=>setEditData({...editData, calories: e.target.value})} className="w-1/2 p-2 border rounded" placeholder="Calo"/>
                                        <input type="number" value={editData.protein} onChange={e=>setEditData({...editData, protein: e.target.value})} className="w-1/2 p-2 border rounded" placeholder="Protein"/>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-xl font-bold text-blue-900">{currentFood.name}</p>
                                    <p className="text-gray-600">{currentFood.calories} Cal • {currentFood.protein}g Pro</p>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {isSaving ? 'Đang lưu...' : 'Lưu vào nhật ký'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recommendations;