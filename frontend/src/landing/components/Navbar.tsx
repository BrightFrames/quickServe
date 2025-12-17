import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleNavigate = (path: string, state?: any) => {
        navigate(path, { state });
        setIsOpen(false);
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 md:grid md:grid-cols-[1fr_auto_1fr]">
                    {/* Logo Section */}
                    <div className="flex items-center space-x-3">
                        <button onClick={() => handleNavigate('/')} className="flex items-center space-x-3 cursor-pointer">
                            <div className="w-10 h-10 rounded-xl shadow-lg overflow-hidden">
                                <img
                                    src="/icon of the quick serve.png"
                                    alt="QuickServe"
                                    className="w-full h-full object-cover"
                                    style={{ filter: 'hue-rotate(220deg) brightness(0.7) saturate(1.2)' }}
                                />
                            </div>
                            <span className="text-xl font-bold text-blue-900">
                                QuickServe
                            </span>
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center justify-center space-x-8">
                        <button onClick={() => handleNavigate('/about')} className="text-gray-900 hover:text-blue-900 font-medium transition-colors">
                            About
                        </button>
                        <button onClick={() => handleNavigate('/pricing')} className="text-gray-900 hover:text-blue-900 font-medium transition-colors">
                            Pricing
                        </button>
                        <button onClick={() => handleNavigate('/blog')} className="text-gray-900 hover:text-blue-900 font-medium transition-colors">
                            Blog
                        </button>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center justify-end space-x-4">
                        <Button
                            onClick={() => handleNavigate('/', { mode: 'login' })}
                            variant="outline"
                            className="text-gray-900 hover:text-blue-900 hover:border-blue-900 hover:bg-blue-50 border-gray-200 hidden lg:inline-flex transition-colors"
                        >
                            Sign In
                        </Button>
                        <Button
                            onClick={() => handleNavigate('/', { mode: 'signup' })}
                            className="bg-blue-900 hover:bg-blue-800 text-white shadow-lg hover:shadow-blue-900/50 transition-all duration-300"
                        >
                            Get Started
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={toggleMenu} className="text-gray-900 hover:text-blue-900 p-2">
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
                    >
                        <div className="px-4 pt-4 pb-6 space-y-4 shadow-xl">
                            <button
                                onClick={() => handleNavigate('/about')}
                                className="block w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                            >
                                About
                            </button>
                            <button
                                onClick={() => handleNavigate('/pricing')}
                                className="block w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                            >
                                Pricing
                            </button>
                            <button
                                onClick={() => handleNavigate('/blog')}
                                className="block w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                            >
                                Blog
                            </button>
                            <div className="pt-4 flex flex-col space-y-3">
                                <Button
                                    onClick={() => handleNavigate('/', { mode: 'login' })}
                                    variant="outline"
                                    className="w-full justify-center text-gray-900 border-gray-200 hover:text-blue-900 hover:border-blue-900 hover:bg-blue-50"
                                >
                                    Sign In
                                </Button>
                                <Button
                                    onClick={() => handleNavigate('/', { mode: 'signup' })}
                                    className="w-full justify-center bg-blue-900 hover:bg-blue-800 text-white"
                                >
                                    Get Started
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
