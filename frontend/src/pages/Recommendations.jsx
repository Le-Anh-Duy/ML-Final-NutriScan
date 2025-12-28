import React, { useRef, useState } from 'react';
import { analyzeImage } from '../services/aiService';
import { getNutritionForFood } from '../data/foodDatabase';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, setDoc, arrayUnion, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Recommendations = () => {
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Analysis State
    const [predictions, setPredictions] = useState([]);
    const [currentFood, setCurrentFood] = useState(null);
    
    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');

    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Trigger the hidden file input when user clicks the camera area
    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    // Handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            
            // Reset states
            setPredictions([]);
            setCurrentFood(null);
            setIsEditing(false);
            setError(null);
        }
    };

    // Retake photo
    const handleRetake = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setSelectedImage(null);
        setImagePreview(null);
        setPredictions([]);
        setCurrentFood(null);
        setIsEditing(false);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Analyze the image using the AI service
    const handleAnalyze = async () => {
        if (!selectedImage) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const result = await analyzeImage(selectedImage);
            setPredictions(result.predictions);
            setCurrentFood(result.bestMatch);
        } catch (err) {
            console.error("Analysis failed:", err);
            setError("Failed to analyze image. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Handle selecting a different prediction
    const handlePredictionSelect = (food) => {
        setCurrentFood(food);
        setIsEditing(false);
    };

    // Handle manual name edit
    const handleNameSubmit = (e) => {
        e.preventDefault();
        if (editName.trim()) {
            const nutrition = getNutritionForFood(editName.trim());
            setCurrentFood(nutrition);
            setIsEditing(false);
        }
    };

    // Save the result to Firestore
    const handleSave = async () => {
        if (!currentUser || !currentFood) return;

        setIsSaving(true);
        try {
            const userRef = doc(db, "users", currentUser.uid);
            
            // Create a food entry object (excluding the image)
            const foodEntry = {
                name: currentFood.name,
                calories: currentFood.calories,
                protein: currentFood.protein,
                carbs: currentFood.carbs,
                fat: currentFood.fat,
                tags: currentFood.tags,
                date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                timestamp: new Date().toISOString()
            };

            await setDoc(userRef, {
                recentScans: arrayUnion(foodEntry),
                "stats.scans": increment(1)
            }, { merge: true });

            // Navigate to profile or show success message
            navigate('/profile');
        } catch (err) {
            console.error("Error saving food:", err);
            setError("Failed to save food. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-gray-800 text-center">Add Food</h1>
                <p className="text-sm text-gray-500 text-center mt-1">
                    Take a photo to analyze your food
                </p>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 pb-20">
                
                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Camera/Image Area */}
                {!imagePreview ? (
                    // Camera Trigger UI (No image selected)
                    <div
                        onClick={handleCameraClick}
                        className="w-full max-w-md h-[50vh] border-4 border-dashed border-blue-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition-all duration-200 bg-white"
                    >
                        {/* Camera Icon */}
                        <svg
                            className="w-24 h-24 text-blue-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                        </svg>
                        <p className="text-xl font-semibold text-gray-700">Tap to Take Photo</p>
                        <p className="text-sm text-gray-500 mt-2">or select from gallery</p>
                    </div>
                ) : (
                    // Image Preview (Image selected)
                    <div className="w-full max-w-md">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                            <img
                                src={imagePreview}
                                alt="Selected food"
                                className="w-full h-auto max-h-[40vh] object-cover"
                            />
                            {currentFood && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                                    {currentFood.confidence ? `${currentFood.confidence}% Match` : 'Manual Entry'}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 space-y-3">
                            {!currentFood ? (
                                <>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                Analyzing...
                                            </>
                                        ) : (
                                            'Analyze Food'
                                        )}
                                    </button>
                                    <button
                                        onClick={handleRetake}
                                        className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                                    >
                                        Retake Photo
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleRetake}
                                    className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Take New Photo
                                </button>
                            )}
                        </div>

                        {/* Analysis Results */}
                        {currentFood && (
                            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                                <div className="flex justify-between items-start mb-2">
                                    {isEditing ? (
                                        <form onSubmit={handleNameSubmit} className="flex-1 mr-2">
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full border border-blue-300 rounded px-2 py-1 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter food name..."
                                                autoFocus
                                                onBlur={() => {
                                                    if (!editName.trim()) setIsEditing(false);
                                                }}
                                            />
                                        </form>
                                    ) : (
                                        <h2 className="text-2xl font-bold text-gray-800 flex-1">
                                            {currentFood.name}
                                        </h2>
                                    )}
                                    
                                    <button 
                                        onClick={() => {
                                            if (isEditing) {
                                                handleNameSubmit({ preventDefault: () => {} });
                                            } else {
                                                setEditName(currentFood.name);
                                                setIsEditing(true);
                                            }
                                        }}
                                        className="text-blue-600 p-1 hover:bg-blue-50 rounded"
                                    >
                                        {isEditing ? (
                                            <span className="font-semibold text-sm">Done</span>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>

                                <p className="text-gray-600 text-sm mb-4">
                                    {currentFood.description}
                                </p>

                                {/* Other Predictions */}
                                {predictions.length > 1 && (
                                    <div className="mb-6">
                                        <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Not what you see? Try these:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {predictions
                                                .filter(p => p.name !== currentFood.name)
                                                .map((pred, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handlePredictionSelect(pred)}
                                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                                                    >
                                                        {pred.name} ({pred.confidence}%)
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* Nutrition Info */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-600">
                                            {currentFood.calories}
                                        </p>
                                        <p className="text-xs text-gray-600">Calories</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-green-600">
                                            {currentFood.protein}g
                                        </p>
                                        <p className="text-xs text-gray-600">Protein</p>
                                    </div>
                                    <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {currentFood.carbs}g
                                        </p>
                                        <p className="text-xs text-gray-600">Carbs</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-red-600">
                                            {currentFood.fat}g
                                        </p>
                                        <p className="text-xs text-gray-600">Fat</p>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {currentFood.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Save Button */}
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full mt-6 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:bg-green-400 shadow-md"
                                >
                                    {isSaving ? 'Saving...' : 'Save to My Foods'}
                                </button>
                                {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recommendations;