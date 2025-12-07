import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Home = () => {
    const [recentFoods, setRecentFoods] = useState([]);
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        // Get recent scans and reverse to show newest first
                        const scans = userData.recentScans || [];
                        setRecentFoods(scans.reverse());
                    }
                } catch (error) {
                    console.error("Error fetching history:", error);
                }
            }
            setLoading(false);
        };

        fetchHistory();
    }, [currentUser]);

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    // Only show the first 3 items
    const displayedFoods = recentFoods.slice(0, 3);

    return (
        <div className="container mx-auto p-4 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Recent Activity</h1>
                <div className="flex gap-4">
                    {recentFoods.length > 3 && (
                        <Link to="/history" className="text-blue-600 font-medium hover:underline flex items-center">
                            View All
                        </Link>
                    )}
                    <Link to="/recommendations" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        + Add Food
                    </Link>
                </div>
            </div>

            {displayedFoods.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                    <p className="text-gray-500 text-lg mb-4">No food history yet.</p>
                    <p className="text-gray-400 mb-6">Start by scanning your first meal!</p>
                    <Link to="/recommendations" className="text-blue-600 font-medium hover:underline">
                        Go to Camera
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {displayedFoods.map((food, index) => (
                        <div key={index} className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Since we don't save images, we use a placeholder or a generic food icon */}
                            <div className="h-48 bg-gray-100 flex items-center justify-center">
                                <span className="text-4xl">🍽️</span>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-xl font-semibold text-gray-800">{food.name}</h2>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                        {food.calories} cal
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mb-3">{food.date}</p>
                                <div className="flex flex-wrap gap-2">
                                    {food.tags && food.tags.map((tag, idx) => (
                                        <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;