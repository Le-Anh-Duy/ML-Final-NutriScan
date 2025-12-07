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
