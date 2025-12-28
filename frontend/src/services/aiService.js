import { getNutritionForFood, foodDatabase } from '../data/foodDatabase'; // Ensure path matches your folder structure
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Get the API URL from the .env file
const AI_API_URL = import.meta.env.VITE_AI_API_URL;

/**
 * Helper to convert File object to Base64 string
 */
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * 1. REAL AI: Analyze Image via Python Backend
 */
export const analyzeImage = async (imageFile) => {
    if (!AI_API_URL) {
        console.error("AI API URL is missing. Check your .env file.");
        throw new Error("Configuration Error: AI API URL missing");
    }

    try {
        // 1. Convert image to Base64
        const base64Image = await fileToBase64(imageFile);

        // 2. Call Python Backend
        console.log("Sending image to:", AI_API_URL);
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Server Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success || !data.predictions || data.predictions.length === 0) {
            throw new Error('No food detected');
        }

        // 3. Map Backend Results to Frontend Nutrition Database
        // Backend returns: [{ name: "Pho Ga", confidence: 0.95 }]
        // Database lookup: Adds calories, carbs, fat, etc.
        const mappedPredictions = data.predictions.map(pred => {
            const nutrition = getNutritionForFood(pred.name);
            return {
                ...nutrition,
                confidence: (pred.confidence * 100).toFixed(1) // Format to 95.5
            };
        });

        return {
            bestMatch: mappedPredictions[0], // Top 1 prediction
            predictions: mappedPredictions   // All candidates
        };

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};

/**
 * 2. DAILY RECOMMENDATIONS (Cached Logic)
 * Kept the same as before so the 'Daily Recommendations' page still works.
 */
export const getDailyRecommendations = async (userProfile, userId) => {
    if (!userId) return [];

    const todayStr = new Date().toDateString();
    const cacheRef = doc(db, 'daily_caches', userId);

    try {
        // Check Firestore cache first
        const docSnap = await getDoc(cacheRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.date === todayStr && data.recommendations?.length > 0) {
                console.log("🎯 Serving cached recommendations");
                return data.recommendations;
            }
        }
    } catch (e) { console.warn("Cache read error", e); }

    // Generate new recommendations if cache missed
    await new Promise(r => setTimeout(r, 500)); 
    
    const goal = userProfile?.goal || 'Maintain Weight';
    let recs = [];
    // Helper to pick random items
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
        reason: goal === 'Lose Weight' ? 'Low calorie option' : 
                goal === 'Gain Muscle' ? 'High protein option' : 'Balanced meal'
    }));

    // Save to cache
    try {
        await setDoc(cacheRef, {
            date: todayStr,
            recommendations: finalRecs,
            updatedAt: new Date()
        });
    } catch (e) { console.error("Cache save error", e); }

    return finalRecs;
};