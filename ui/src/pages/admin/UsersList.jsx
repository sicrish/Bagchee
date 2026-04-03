import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Download, Printer, Search, RotateCw,
  Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import { exportToExcel } from '../../utils/exportExcel';


const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 1. Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // 🟢 1. Filtering States
  const [filters, setFilters] = useState({
    username: "",
    email: "",
    firstname: "",
    lastname: "",
    membership: ""
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL;

  const fetchUsers = async (isExport = false) => {
    if (!isExport) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", isExport ? 1 : currentPage);
      params.append("limit", isExport ? 100000 : itemsPerPage);

      const res = await axios.get(`${API_BASE_URL}/user/fetch?${params.toString()}`);
      if (res.data.status) {
        if (isExport) return res.data.data;
        setUsers(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalItems(res.data.total || 0);
      }
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      if (!isExport) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, itemsPerPage]);

  // 🟢 3. Excel Export logic
  const handleExport = async () => {
    const toastId = toast.loading("Preparing Excel file...");
    try {
      const allData = await fetchUsers(true);
      if (!allData || allData.length === 0) return toast.error("No data", { id: toastId });

      const dataToExport = allData.map((user, i) => ({
        "Sr No": i + 1,
        "Name": user.name,
        "Username": user.username || "-",
        "Email": user.email,
        "Company": user.company || "-",
        "Phone": user.phone || "-",
        "Membership": user.membership || "inactive",
        "Joined Date": new Date(user.createdAt).toLocaleDateString('en-GB')
      }));

      await exportToExcel(dataToExport, "Users", "Users_Report");
      toast.success("Excel downloaded! 📊", { id: toastId });
    } catch (error) { toast.error("Export failed", { id: toastId }); }
  };

  const handlePrint = () => window.print();

  // 🟢 2. Filtering Logic (Memoized for Performance)
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Name split logic for filtering based on First/Last name
      const nameParts = user.name ? user.name.split(' ') : ["", ""];
      const fName = (nameParts[0] || user.firstname || "").toLowerCase();
      const lName = (nameParts.slice(1).join(' ') || user.lastname || "").toLowerCase();

      return (
        (user.username || user.email || "").toLowerCase().includes(filters.username.toLowerCase()) &&
        (user.email || "").toLowerCase().includes(filters.email.toLowerCase()) &&
        fName.includes(filters.firstname.toLowerCase()) &&
        lName.includes(filters.lastname.toLowerCase()) &&
        (user.membership || "inactive").toLowerCase().includes(filters.membership.toLowerCase())
      );
    });
  }, [users, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ username: "", email: "", firstname: "", lastname: "", membership: "" });
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const toastId = toast.loading("Deleting user...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/user/delete/${id}`);
      if (res.data.status) {
        toast.success("User deleted successfully!", { id: toastId });
        fetchUsers();
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  const filterInputClass = "w-full rounded p-1.5 text-xs outline-none bg-white/90 focus:bg-white text-text-main font-montserrat border border-transparent focus:border-primary transition-all";

  return (
    <div className="bg-cream-50 min-h-screen p-3 sm:p-4 md:p-6 font-body text-text-main">

      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/admin/add-user')}
          className="w-full md:w-auto bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center justify-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Add Users
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button onClick={handleExport} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Download size={14} className="text-accent" /> Export
          </button>
          <button onClick={handlePrint} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print
          </button>
          <button
            onClick={clearFilters}
            className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:text-primary hover:border-primary flex items-center gap-2 text-xs font-montserrat font-bold transition-all"
          >
            Clear filters
          </button>
          <div className="relative flex items-center">
            <button onClick={fetchUsers} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
              <Search size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3 text-center w-16 border-r border-white/20">#</th>
                <th className="p-3 text-left border-r border-white/20">Username</th>
                <th className="p-3 text-left border-r border-white/20">Email</th>
                <th className="p-3 text-left border-r border-white/20">Firstname</th>
                <th className="p-3 text-left border-r border-white/20">Lastname</th>
                <th className="p-3 text-left border-r border-white/20 w-40">Membership</th>
                <th className="p-3 text-center w-28">Actions</th>
              </tr>

              {/* 🟢 Filter Row with dynamic handlers */}
              <tr className="bg-primary border-b border-cream-200 align-top">
                <td className="p-2 border-r border-white/20 text-center">
                  <input type="checkbox" className="h-4 w-4 rounded accent-primary bg-white cursor-pointer" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input type="text" name="username" value={filters.username} onChange={handleFilterChange} className={filterInputClass} placeholder="Filter Username" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input type="text" name="email" value={filters.email} onChange={handleFilterChange} className={filterInputClass} placeholder="Filter Email" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input type="text" name="firstname" value={filters.firstname} onChange={handleFilterChange} className={filterInputClass} placeholder="Filter Firstname" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input type="text" name="lastname" value={filters.lastname} onChange={handleFilterChange} className={filterInputClass} placeholder="Filter Lastname" />
                </td>
                <td className="p-2 border-r border-white/20">
                  <input type="text" name="membership" value={filters.membership} onChange={handleFilterChange} className={filterInputClass} placeholder="Filter Status" />
                  <div className="text-[10px] text-white mt-1.5 font-medium leading-tight opacity-90 pl-1">
                    <div>member / inactive</div>
                  </div>
                </td>
                <td className="p-2 text-center">
                  <button onClick={fetchUsers} className="text-white hover:rotate-180 transition-transform duration-500">
                    <RotateCw size={16} />
                  </button>
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-text-muted font-bold">
                    <div className="flex justify-center items-center gap-2">
                      <Loader2 className="animate-spin text-primary" /> Loading Users...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((item, index) => {
                  let firstName = "-";
                  let lastName = "-";
                  if (item.firstName || item.lastName) {
                    firstName = item.firstName || "-";
                    lastName = item.lastName || "-";
                  } else if (item.name) {
                    const nameParts = item.name.split(' ');
                    firstName = nameParts[0] || "-";
                    lastName = nameParts.slice(1).join(' ') || "-";
                  }

                  return (
                    <tr key={item.id} className="hover:bg-primary-50 transition-colors text-[13px]">
                      <td className="p-3 border-r border-cream-50 text-center">
                        <div className="flex items-center gap-2 px-1 justify-center">
                          <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer" />
                          <span className="text-text-muted text-xs font-bold">{index + 1}</span>
                        </div>
                      </td>
                      <td className="p-3 border-r border-cream-50 text-text-main">{item.username || item.email}</td>
                      <td className="p-3 border-r border-cream-50 text-text-main">{item.email}</td>
                      <td className="p-3 border-r border-cream-50 text-text-main font-medium">{firstName}</td>
                      <td className="p-3 border-r border-cream-50 text-text-main font-medium">{lastName}</td>
                      <td className="p-3 border-r border-cream-50 text-text-main">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.membership === 'active' || item.isMember
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                          }`}>
                          {item.membership || 'inactive'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => navigate(`/admin/edit-user/${item.id}`)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm active:scale-95">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm active:scale-95">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-text-muted italic font-montserrat">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER / PAGINATION --- */}
        <div className="p-3 bg-white border-t border-cream-200 flex flex-col md:flex-row justify-between items-center gap-4 font-montserrat shadow-sm no-print">
          <div className="flex items-center gap-2 text-[12px] font-bold text-text-main">
            <span className="text-text-muted uppercase text-[10px] tracking-wide">Show</span>
            <select 
              value={itemsPerPage} 
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
              className="border border-cream-200 rounded px-2 py-1 outline-none focus:border-primary bg-cream-50 text-xs text-primary font-bold cursor-pointer transition-all"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>

            </select>
            <span className="text-text-muted uppercase text-[10px] tracking-wide">entries</span>
          </div>

          <div className="text-[11px] font-bold text-text-muted uppercase tracking-tighter">
            Displaying {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronsLeft size={16} /></button>
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronLeft size={16} /></button>
            <div className="min-w-[32px] h-8 flex items-center justify-center bg-primary text-white text-xs font-bold rounded shadow-md ring-2 ring-primary/20 mx-1">{currentPage}</div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronRight size={16} /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-1.5 border border-cream-200 rounded text-text-muted hover:text-primary disabled:opacity-30 active:scale-90 bg-white shadow-sm"><ChevronsRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersList;