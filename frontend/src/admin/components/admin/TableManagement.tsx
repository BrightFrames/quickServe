import { useState, useEffect } from "react";
import {
  Plus,
  QrCode,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  MapPin,
  Users,
  X,
  Search,
  CheckCircle,
  XCircle
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRestaurant } from "../../context/RestaurantContext";

interface Table {
  id: string;
  tableId: string;
  tableName: string;
  seats: number;
  qrCode: string;
  isActive: boolean;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

const TableManagement = () => {
  const { restaurantSlug } = useRestaurant();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const getAxiosConfig = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('restaurantToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-restaurant-slug': restaurantSlug || '',
      }
    };
  };

  const [formData, setFormData] = useState({
    tableId: "",
    tableName: "",
    seats: 4,
    location: "",
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/tables`, getAxiosConfig());
      setTables(response.data);
    } catch (error: any) {
      toast.error("Failed to fetch tables");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    try {
      if (!formData.tableId || !formData.tableName) {
        toast.error("Please fill all required fields");
        return;
      }
      const slug = restaurantSlug || localStorage.getItem('restaurantSlug');
      if (!slug) {
        toast.error("Restaurant information not found. Please login again.");
        return;
      }
      await axios.post(`${apiUrl}/api/tables`, { ...formData, restaurantSlug: slug }, getAxiosConfig());
      toast.success("Table added successfully");
      setIsAddDialogOpen(false);
      resetForm();
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add table");
    }
  };

  const handleUpdateTable = async () => {
    if (!selectedTable) return;
    try {
      await axios.put(`${apiUrl}/api/tables/${selectedTable.id}`, formData, getAxiosConfig());
      toast.success("Table updated successfully");
      setIsEditDialogOpen(false);
      setSelectedTable(null);
      resetForm();
      fetchTables();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update table");
    }
  };

  const handleDeleteTable = async () => {
    if (!selectedTable) return;
    try {
      await axios.delete(`${apiUrl}/api/tables/${selectedTable.id}`, getAxiosConfig());
      toast.success("Table deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedTable(null);
      fetchTables();
    } catch (error: any) {
      toast.error("Failed to delete table");
    }
  };

  const handleToggleActive = async (table: Table) => {
    try {
      await axios.put(`${apiUrl}/api/tables/${table.id}`, { isActive: !table.isActive }, getAxiosConfig());
      toast.success(`Table ${table.isActive ? "deactivated" : "activated"}`);
      fetchTables();
    } catch (error: any) {
      toast.error("Failed to update table status");
    }
  };

  const handleRegenerateQR = async (table: Table) => {
    try {
      const slug = restaurantSlug || localStorage.getItem('restaurantSlug');
      await axios.post(`${apiUrl}/api/tables/${table.id}/regenerate-qr`, { restaurantSlug: slug }, getAxiosConfig());
      toast.success("QR code regenerated successfully");
      fetchTables();
    } catch (error: any) {
      toast.error("Failed to regenerate QR code");
    }
  };

  const handleDownloadQR = (table: Table) => {
    const link = document.createElement("a");
    link.href = table.qrCode;
    link.download = `table-${table.tableId}-qr.png`;
    link.click();
    toast.success(`QR code downloaded for ${table.tableName}`);
  };

  const openAddDialog = () => {
    resetForm();
    const nextTableNumber = tables.length + 1;
    setFormData({
      tableId: `T${nextTableNumber}`,
      tableName: `Table ${nextTableNumber}`,
      seats: 4,
      location: "",
    });
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (table: Table) => {
    setSelectedTable(table);
    setFormData({
      tableId: table.tableId,
      tableName: table.tableName,
      seats: table.seats,
      location: table.location || "",
    });
    setIsEditDialogOpen(true);
  };

  const openQRDialog = (table: Table) => {
    setSelectedTable(table);
    setIsQRDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ tableId: "", tableName: "", seats: 4, location: "" });
  };

  const filteredTables = tables.filter(table =>
    table.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.tableId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Table Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage restaurant tables and QR codes.
          </p>
        </div>
        <button
          onClick={openAddDialog}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Table
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <div
            key={table.id}
            className={`group bg-white rounded-xl shadow-sm border border-gray-200 p-5 transition-all duration-200 hover:shadow-md ${!table.isActive ? "opacity-75 bg-gray-50" : ""}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-bold text-lg text-slate-900">{table.tableId}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openQRDialog(table)}
                  className="p-2 text-gray-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100"
                  title="View QR Code"
                >
                  <QrCode className="h-5 w-5" />
                </button>
                <button
                  onClick={() => { setSelectedTable(table); setIsDeleteDialogOpen(true); }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                  title="Delete"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-1 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate" title={table.tableName}>{table.tableName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {table.seats} seats
                </span>
                {table.location && (
                  <span className="flex items-center gap-1.5 truncate max-w-[120px]" title={table.location}>
                    <MapPin className="h-3.5 w-3.5" />
                    {table.location}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => handleToggleActive(table)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${table.isActive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {table.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {table.isActive ? 'Active' : 'Inactive'}
              </button>

              <button
                onClick={() => openEditDialog(table)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
          </div>
        ))}

        {/* Empty State Add Button */}
        {tables.length > 0 && (
          <button
            onClick={openAddDialog}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-slate-300 hover:bg-slate-50/50 transition-all group min-h-[180px]"
          >
            <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-slate-400 group-hover:text-slate-900" />
            </div>
            <span className="font-medium text-gray-500 group-hover:text-slate-900">Create New Table</span>
          </button>
        )}
      </div>

      {tables.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="p-4 bg-slate-50 rounded-full mb-4">
            <QrCode className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No tables created yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs text-center">Start by adding your first table to generate QR codes for ordering.</p>
          <button
            onClick={openAddDialog}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Table
          </button>
        </div>
      )}

      {/* Dialogs */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add New Table</h2>
              <button onClick={() => setIsAddDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table ID</label>
                <input
                  type="text"
                  placeholder="T1"
                  value={formData.tableId}
                  onChange={(e) => setFormData({ ...formData, tableId: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none uppercase font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier (printed on QR).</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
                <input
                  type="text"
                  placeholder="Table 1"
                  value={formData.tableName}
                  onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.seats}
                    onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 4 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Main Hall"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button onClick={() => setIsAddDialogOpen(false)} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
              <button onClick={handleAddTable} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors">Create Table</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog - Similar Structure */}
      {isEditDialogOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Edit Table</h2>
              <button onClick={() => setIsEditDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table ID</label>
                <input type="text" value={formData.tableId} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
                <input type="text" value={formData.tableName} onChange={(e) => setFormData({ ...formData, tableName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seats</label>
                  <input type="number" min="1" value={formData.seats} onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) || 4 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button onClick={() => setIsEditDialogOpen(false)} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
              <button onClick={handleUpdateTable} className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition-colors">Update Table</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Dialog */}
      {isQRDialogOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden text-center">
            <div className="p-6 pb-0 flex justify-end">
              <button onClick={() => setIsQRDialogOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-8 pb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedTable.tableName}</h3>
              <p className="text-sm text-gray-500 mb-6">Scan to view menu</p>

              <div className="bg-white p-4 rounded-xl border-2 border-slate-900 inline-block mb-6 shadow-sm">
                <img src={selectedTable.qrCode} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => handleDownloadQR(selectedTable)} className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 font-medium flex items-center justify-center gap-2 transition-colors">
                  <Download className="w-4 h-4" /> Download
                </button>
                <button onClick={() => handleRegenerateQR(selectedTable)} className="px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" title="Regenerate">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {isDeleteDialogOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Table?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete <strong>{selectedTable.tableName}</strong>? This will remove the QR code and any associated active session data.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
              <button onClick={handleDeleteTable} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TableManagement;
