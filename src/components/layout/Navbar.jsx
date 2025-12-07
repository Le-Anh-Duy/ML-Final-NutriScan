import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const isActive = (path) => {
        return location.pathname === path ? "text-white font-semibold" : "text-gray-300 hover:text-white";
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <nav className="bg-gray-900 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <span className="text-2xl">🥗</span>
                        <span className="text-white text-xl font-bold tracking-wide">NutriScan</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-8 items-center">
                        {currentUser ? (
                            <>
                                <Link to="/" className={`${isActive('/')} transition-colors duration-200`}>Home</Link>
                                <Link to="/history" className={`${isActive('/history')} transition-colors duration-200`}>History</Link>
                                <Link to="/recommendations" className={`${isActive('/recommendations')} transition-colors duration-200`}>Add Food</Link>
                                <Link to="/profile" className={`${isActive('/profile')} transition-colors duration-200`}>Profile</Link>
                                <button 
                                    onClick={handleLogout}
                                    className="text-gray-300 hover:text-white transition-colors duration-200"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className={`${isActive('/login')} transition-colors duration-200`}>Login</Link>
                                <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200">Register</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button 
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-gray-300 hover:text-white focus:outline-none"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden pb-4">
                        <div className="flex flex-col space-y-2">
                            {currentUser ? (
                                <>
                                    <Link 
                                        to="/" 
                                        className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Home
                                    </Link>
                                    <Link 
                                        to="/history" 
                                        className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/history' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        History
                                    </Link>
                                    <Link 
                                        to="/recommendations" 
                                        className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/recommendations' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Add Food
                                    </Link>
                                    <Link 
                                        to="/profile" 
                                        className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/profile' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white w-full"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link 
                                        to="/login" 
                                        className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/login' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link 
                                        to="/register" 
                                        className={`px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/register' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;