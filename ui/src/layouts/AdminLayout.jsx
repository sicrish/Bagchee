    import React from 'react';
    import { Outlet } from 'react-router-dom';
    // 🟢 Path update kiya hai folder structure ke hisab se
    import AdminSidebar from '../components/admin/AdminSidebar';

    const AdminLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50 font-body overflow-hidden">
        
        {/* Sidebar Fixed Left */}
        <AdminSidebar />

        {/* Dynamic Content Right Side */}
        <div className="flex-1 overflow-y-auto">
            <Outlet />
        </div>

        </div>
    );
    };

    export default AdminLayout;