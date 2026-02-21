import React, { useState, useEffect } from 'react';
import { 
  Plus, Download, Printer, Search, RotateCw, 
  Edit, Trash2, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight, Settings, Loader2, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const BooksOfMonthList = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Pagination State (Optional for history)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25
  });

  // --- 1. FETCH HISTORY DATA ---
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Controller endpoint: getAllBooksOfMonthHistory
      const res = await axios.get(`${API_URL}/books-of-the-month/history`);
      
      if (res.data.status) {
        setHistory(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // --- 2. DELETE HANDLER ---
  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this selection?")) return;

    const toastId = toast.loading("Deleting...");
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await axios.delete(`${API_URL}/books-of-the-month/delete/${id}`);
      if (res.data.status) {
        toast.success("Deleted successfully!", { id: toastId });
        fetchHistory(); 
      }
    } catch (error) {
      toast.error("Delete failed", { id: toastId });
    }
  };

  // --- 3. EXPORT TO EXCEL ---
  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading("Exporting history...");

    try {
      if (history.length > 0) {
        const exportData = history.map(item => ({
          "Month Name": item.monthName,
          "Headline": item.headline || 'N/A',
          "Books Count": item.products?.length || 0,
          "Expiry Date": new Date(item.expiryDate).toLocaleDateString(),
          "Status": new Date(item.expiryDate) > new Date() ? "Active" : "Expired",
          "Created At": new Date(item.createdAt).toLocaleDateString()
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = { Sheets: { 'History': worksheet }, SheetNames: ['History'] };
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        
        saveAs(data, 'Books_of_the_Month_History.xlsx');
        toast.success("Export complete!", { id: toastId });
      } else {
        toast.error("No data to export", { id: toastId });
      }
    } catch (error) {
      toast.error("Export failed", { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // --- 4. PRINT ---
  const handlePrint = () => {
    const printContent = document.getElementById("printable-table-area");
    if (!printContent) return;
    window.print();
  };

  return (
    <div className="bg-cream-50 min-h-screen p-4 md:p-6 font-body text-text-main">
      
      {/* --- TOP TOOLBAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <button 
          onClick={() => navigate('/admin/add-books-of-the-month')} 
          className="bg-white border border-cream-200 text-text-main hover:bg-cream-100 px-4 py-2 rounded shadow-sm flex items-center gap-2 font-montserrat font-bold text-xs uppercase transition-all active:scale-95"
        >
          <Plus size={14} className="text-red-600" /> Create New Month Selection
        </button>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={handleExport} 
            disabled={exporting}
            className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="text-accent" />}
            {exporting ? "Exporting..." : "Export Excel"}
          </button>

          <button onClick={handlePrint} className="bg-white border border-cream-200 text-text-main px-4 py-1.5 rounded shadow-sm hover:bg-cream-100 flex items-center gap-2 text-xs font-montserrat font-bold transition-colors">
            <Printer size={14} className="text-green-600" /> Print List
          </button>

          <button onClick={fetchHistory} className="bg-primary text-white p-2 rounded hover:bg-primary-hover transition-colors shadow-sm">
            <RotateCw size={16} />
          </button>
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white rounded border border-cream-200 overflow-hidden shadow-sm" id="printable-table-area">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white border-b border-white/10 font-montserrat font-bold uppercase tracking-wider text-left">
                <th className="p-4 border-r border-white/20 w-16 text-center hide-on-print">
                    <input type="checkbox" className="h-4 w-4 rounded accent-white cursor-pointer" />
                </th>
                <th className="p-4 border-r border-white/20">Month Name</th>
                <th className="p-4 border-r border-white/20">Headline</th>
                <th className="p-4 border-r border-white/20 text-center">Books Count</th>
                <th className="p-4 border-r border-white/20">Expiry Date</th>
                <th className="p-4 border-r border-white/20">Status</th>
                <th className="p-4 text-center w-32 hide-on-print">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-cream-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center">
                    <div className="flex justify-center items-center gap-2 font-bold text-text-muted">
                       <Loader2 className="animate-spin text-primary" /> Loading History...
                    </div>
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((item) => {
                  const isExpired = new Date(item.expiryDate) < new Date();
                  return (
                    <tr key={item._id} className="hover:bg-primary-50 transition-colors">
                      <td className="p-4 border-r border-cream-50 text-center hide-on-print">
                          <input type="checkbox" className="h-4 w-4 rounded accent-primary cursor-pointer" />
                      </td>
                      <td className="p-4 border-r border-cream-50 font-bold text-primary">
                          {item.monthName}
                      </td>
                      <td className="p-4 border-r border-cream-50 italic text-text-muted">
                          "{item.headline}"
                      </td>
                      <td className="p-4 border-r border-cream-50 text-center font-bold">
                          {item.products?.length || 0} Books
                      </td>
                      <td className="p-4 border-r border-cream-50 font-montserrat">
                          {new Date(item.expiryDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td className="p-4 border-r border-cream-50">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${!isExpired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {!isExpired ? "LIVE" : "EXPIRED"}
                          </span>
                      </td>
                      <td className="p-4 text-center hide-on-print">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => navigate(`/admin/edit-books-of-the-month/${item._id}`)} 
                            className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-primary hover:border-primary transition-all shadow-sm"
                            title="Edit / Reactivate"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 bg-cream-50 border border-cream-200 rounded text-text-muted hover:text-red-600 hover:border-red-600 transition-all shadow-sm"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-text-muted italic">No selection history found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER --- */}
        <div className="p-4 bg-white border-t border-cream-50 flex justify-between items-center">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-slick font-montserrat">
            Showing {history.length} Month Selections
          </div>
          <div className="flex items-center gap-1">
             <button className="p-1.5 border border-cream-200 rounded text-text-muted hover:bg-cream-50 transition-all"><Settings size={16} /></button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
            .hide-on-print { display: none !important; }
            body { background: white !important; }
            #printable-table-area { border: none !important; }
            th { background-color: #008DDA !important; color: white !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default BooksOfMonthList;