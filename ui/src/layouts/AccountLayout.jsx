import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Menu, X, Home, User, Package, MapPin, Heart, LogOut, ChevronLeft, ChevronRight, ShoppingBag, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import LogoBlue from '../components/common/LogoBlue';

const AccountLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const authData = localStorage.getItem('auth');
        if (!authData) {
            navigate('/login');
            return;
        }
        const parsedData = JSON.parse(authData);
        setUser(parsedData.userDetails);
    }, [navigate]);

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('auth');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const menuItems = [
        { icon: Home, label: 'Dashboard', hint: 'Overview', path: '/account' },
        { icon: Package, label: 'Orders', hint: 'Track purchases', path: '/account/orders' },
        { icon: Heart, label: 'Wishlist', hint: 'Saved books', path: '/account/wishlist' },
        { icon: MapPin, label: 'Addresses', hint: 'Shipping details', path: '/account/address' },
        { icon: User, label: 'Profile', hint: 'Personal info', path: '/account/profile' },
        { icon: Gift, label: 'Gift Cards', hint: 'Redeem & balance', path: '/account/gift-cards' }
    ];

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            </div>
        );
    }

    const SidebarContent = ({ isMobile = false }) => {
        return <div className="flex flex-col h-full bg-cream-100/95 backdrop-blur-sm">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-cream-100/60 to-cream-100/30">
                {isMobile && (
                    <div className="flex items-center justify-between mb-6">
                        <Link to="/" className="flex items-center">
                            <LogoBlue className="h-8 w-auto" />
                        </Link>
                        <button
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="lg:hidden p-2 hover:bg-cream-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                )}
                
                {!isSidebarCollapsed && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center text-primary font-bold shadow-sm">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-text-main truncate">{user.name}</p>
                                <p className="text-xs text-text-muted truncate">{user.email}</p>
                            </div>
                        </div>

                   
                    </div>
                )}

                {isSidebarCollapsed && (
                    <div className="w-10 h-10 bg-primary/15 rounded-full flex items-center justify-center text-primary font-bold mx-auto shadow-sm">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                            isActive
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-main hover:bg-cream-50 hover:text-primary'
                        }`}
                    >
                        <Icon size={20} className={isActive ? 'text-white' : 'text-text-muted'} />
                        {!isSidebarCollapsed && (
                            <div className="min-w-0">
                                <p className="font-medium leading-tight">{item.label}</p>
                                <p className={`text-[11px] leading-tight truncate ${isActive ? 'text-white/85' : 'text-text-muted'}`}>
                                    {item.hint}
                                </p>
                            </div>
                        )}
                    </Link>;
                })}
            </nav>

            <div className="p-4 border-t border-gray-200 space-y-2 bg-cream-50/30">
                <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-text-main hover:bg-cream-100 hover:text-primary transition-all duration-200"
                >
                    <Home size={20} />
                    {!isSidebarCollapsed && <span className="font-medium">Back to Website</span>}
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                    <LogOut size={20} />
                    {!isSidebarCollapsed && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </div>;
    };

    return (
        <div className="min-h-screen bg-cream">
            <header className="fixed top-0 left-0 right-0 bg-cream-100 border-b border-gray-200 z-40">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="lg:hidden">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="p-2 hover:bg-cream-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                    <div className="hidden lg:block w-10"></div>

                    <Link to="/" className="flex items-center">
                        <LogoBlue className="h-8 w-auto" />
                    </Link>

                    <div className="w-10"></div>
                </div>
            </header>

            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed top-0 left-0 bottom-0 w-72 bg-cream-100 z-50 transform transition-transform duration-300 lg:hidden ${
                    isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <SidebarContent isMobile={true} />
            </aside>

            <aside
                className={`hidden lg:block fixed top-[61px] left-0 bottom-0 bg-cream-100 border-r border-gray-200 transition-all duration-300 z-30 ${
                    isSidebarCollapsed ? 'w-20' : 'w-64'
                }`}
            >
                <SidebarContent />
                
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="absolute -right-3 top-4 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm"
                >
                    {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </aside>

            <main
                className={`transition-all duration-300 pt-[61px] min-h-screen ${
                    isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
                }`}
            >
                <div className="max-w-7xl mx-auto p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AccountLayout;
