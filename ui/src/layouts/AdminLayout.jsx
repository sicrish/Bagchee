import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { getAdminRole, isStaffAllowedPath } from '../utils/adminAccess';

const AdminLayout = () => {
  const location = useLocation();

  // A restricted 'staff' login may only open catalog data-entry screens; any other
  // /admin path (orders, users, payments, settings, the dashboard, …) bounces them to
  // their home. The backend still enforces this with 403s — this just keeps the UI
  // coherent so staff never see (or land on) an admin-only screen.
  if (getAdminRole() === 'staff' && !isStaffAllowedPath(location.pathname)) {
    return <Navigate to="/admin/products" replace />;
  }

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
