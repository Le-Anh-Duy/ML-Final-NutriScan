import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0 text-center md:text-left">
                        <h3 className="text-white text-lg font-bold mb-1">NutriScan</h3>
                        <p className="text-sm">Smart food tracking for a healthier you.</p>
                    </div>
                    
                    <div className="flex space-x-6 text-sm">
                        <a href="#" className="hover:text-white transition-colors">About</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
                
                <div className="border-t border-gray-800 mt-6 pt-6 text-center text-xs">
                    <p>&copy; {new Date().getFullYear()} NutriScan. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;