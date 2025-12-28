import { foodDatabase } from '../data/foodDatabase';

// Mock AI Service
// In the future, this will be replaced by actual API calls to a Python backend

/**
 * Simulates analyzing an image to identify food.
 * @param {File} imageFile - The image file to analyze.
 * @returns {Promise<Object>} - The analysis result containing predictions and best match.
 */
export const analyzeImage = async (imageFile) => {
    // Simulate network delay (1.5 - 3 seconds)
    const delay = 1500 + Math.random() * 1500;
    await new Promise(resolve => setTimeout(resolve, delay));

    // In a real app, we would send 'imageFile' to a backend server here.
    // For now, we return 5 random mock results.
    
    const shuffled = [...foodDatabase].sort(() => 0.5 - Math.random());
    const predictions = shuffled.slice(0, 5).map((food, index) => ({
        ...food,
        confidence: index === 0 ? 85 + Math.floor(Math.random() * 10) : 60 - (index * 10) + Math.floor(Math.random() * 10)
    }));

    return {
        predictions: predictions,
        bestMatch: predictions[0]
    };
};

/**
 * Simulates getting daily food recommendations based on user profile.
 * @param {Object} userProfile - The user's health profile and goals.
 * @returns {Promise<Array>} - A list of recommended foods with reasons.
 */
export const getDailyRecommendations = async (userProfile) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock logic to select foods based on goal (simplified)
    const goal = userProfile?.goal || 'Maintain Weight';
    let recommendedFoods = [];

    // Helper to pick random items
    const pickRandom = (arr, count) => arr.sort(() => 0.5 - Math.random()).slice(0, count);

    if (goal === 'Lose Weight') {
        // Recommend low calorie, high protein
        const lowCal = foodDatabase.filter(f => f.calories < 400);
        recommendedFoods = pickRandom(lowCal, 3).map(f => ({
            ...f,
            reason: "Low calorie option to help with weight loss",
            highlight: "Low Calorie"
        }));
    } else if (goal === 'Gain Muscle') {
        // Recommend high protein
        const highProtein = foodDatabase.filter(f => f.protein > 20);
        recommendedFoods = pickRandom(highProtein, 3).map(f => ({
            ...f,
            reason: "High protein content to support muscle growth",
            highlight: "High Protein"
        }));
    } else {
        // Balanced diet
        recommendedFoods = pickRandom(foodDatabase, 3).map(f => ({
            ...f,
            reason: "Balanced meal for maintaining health",
            highlight: "Balanced"
        }));
    }

    return recommendedFoods;
};
