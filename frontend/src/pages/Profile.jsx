import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // User data state
    const [user, setUser] = useState({
        name: '',
        email: '',
        avatar: '',
        stats: {
            scans: 0,
            favorites: 0,
            streak: 0
        },
        healthProfile: {
            birthDate: '',
            gender: '',
            height: '',
            weight: '',
            activityLevel: '',
            goal: '',
            dietaryRestrictions: ''
        },
        recentScans: []
    });

    // Form state for editing
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser(prev => ({
                            ...prev,
                            ...userData,
                            healthProfile: {
                                ...prev.healthProfile,
                                ...(userData.healthProfile || {})
                            },
                            stats: {
                                ...prev.stats,
                                ...(userData.stats || {})
                            },
                            avatar: `https://ui-avatars.com/api/?name=${userData.name || 'User'}&background=0D8ABC&color=fff`,
                            recentScans: userData.recentScans || []
                        }));
                        setFormData({ 
                            birthDate: '',
                            gender: '',
                            height: '',
                            weight: '',
                            activityLevel: '',
                            goal: '',
                            dietaryRestrictions: '',
                            ...(userData.healthProfile || {}), 
                            name: userData.name 
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            }
            setLoading(false);
        };

        fetchUserData();
    }, [currentUser]);

    const handleEditClick = () => {
        setFormData({ ...user.healthProfile, name: user.name });
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        setIsEditing(false);
    };

    const handleSaveClick = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const userRef = doc(db, "users", currentUser.uid);
            const updatedData = {
                name: formData.name,
                healthProfile: {
                    birthDate: formData.birthDate,
                    gender: formData.gender,
                    height: formData.height,
                    weight: formData.weight,
                    activityLevel: formData.activityLevel,
                    goal: formData.goal,
                    dietaryRestrictions: formData.dietaryRestrictions
                }
            };

            await setDoc(userRef, updatedData, { merge: true });

            setUser(prev => ({
                ...prev,
                ...updatedData
            }));
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile");
        }
    };

    const handleSignOut = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* User Info Card */}
                    <div className="md:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center">
                            <img 
                                src={user.avatar} 
                                alt={user.name} 
                                className="w-24 h-24 rounded-full mb-4 border-4 border-blue-50"
                            />
                            <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                            <p className="text-gray-500 text-sm mb-6">{user.email}</p>
                            
                            <button 
                                onClick={handleEditClick}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-3"
                            >
                                Edit Profile
                            </button>
                            <button 
                                onClick={handleSignOut}
                                className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>

                        {/* Health Summary (Visible on Desktop) */}
                        <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 hidden md:block">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Health Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Height</span>
                                    <span className="font-medium">{user.healthProfile.height} cm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Weight</span>
                                    <span className="font-medium">{user.healthProfile.weight} kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">BMI</span>
                                    <span className="font-medium text-blue-600">
                                        {user.healthProfile.height && user.healthProfile.weight 
                                            ? (user.healthProfile.weight / ((user.healthProfile.height / 100) ** 2)).toFixed(1)
                                            : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Activity */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-blue-600">{user.stats.scans}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Total Scans</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-pink-500">{user.stats.favorites}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Favorites</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-orange-500">{user.stats.streak} 🔥</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Day Streak</p>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        {/* Recent Activity */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {user.recentScans.length === 0 && (
                                    <p className="text-gray-500 text-sm text-center py-4">No recent scans</p>
                                )}
                                {user.recentScans.slice(0, 3).map((scan, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                📷
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{scan.name}</p>
                                                <p className="text-xs text-gray-500">{scan.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-700">{scan.calories} cal</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {user.recentScans.length > 3 && (
                                <button 
                                    onClick={() => navigate('/history')}
                                    className="w-full mt-4 text-blue-600 text-sm font-medium hover:text-blue-800"
                                >
                                    View All History →
                                </button>
                            )}
                        </div>

                        {/* Detailed Health Profile */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Health Profile</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase">Gender</p>
                                    <p className="font-medium text-gray-800">{user.healthProfile.gender}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase">Birth Date</p>
                                    <p className="font-medium text-gray-800">{user.healthProfile.birthDate}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase">Activity Level</p>
                                    <p className="font-medium text-gray-800">{user.healthProfile.activityLevel}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase">Goal</p>
                                    <p className="font-medium text-blue-600">{user.healthProfile.goal}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg sm:col-span-2">
                                    <p className="text-xs text-gray-500 uppercase">Dietary Restrictions</p>
                                    <p className="font-medium text-gray-800">{user.healthProfile.dietaryRestrictions}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-800">Edit Profile</h2>
                            <button onClick={handleCancelClick} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveClick} className="p-6 space-y-6">
                            {/* Personal Info Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                                        <input
                                            type="date"
                                            name="birthDate"
                                            value={formData.birthDate}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                            <option value="Prefer not to say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Body Metrics Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Body Metrics</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                                        <input
                                            type="number"
                                            name="height"
                                            value={formData.height}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Lifestyle & Goals Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lifestyle & Goals</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                                        <select
                                            name="activityLevel"
                                            value={formData.activityLevel}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="Sedentary">Sedentary (Little or no exercise)</option>
                                            <option value="Light">Lightly Active (Exercise 1-3 days/week)</option>
                                            <option value="Moderate">Moderately Active (Exercise 3-5 days/week)</option>
                                            <option value="Heavy">Very Active (Exercise 6-7 days/week)</option>
                                            <option value="Athlete">Extra Active (Very hard exercise/physical job)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Health Goal</label>
                                        <select
                                            name="goal"
                                            value={formData.goal}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        >
                                            <option value="Lose Weight">Lose Weight</option>
                                            <option value="Maintain Weight">Maintain Weight</option>
                                            <option value="Gain Muscle">Gain Muscle</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions</label>
                                        <input
                                            type="text"
                                            name="dietaryRestrictions"
                                            value={formData.dietaryRestrictions}
                                            onChange={handleChange}
                                            placeholder="e.g., Vegan, Gluten-free, Nut allergy"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-4 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCancelClick}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;