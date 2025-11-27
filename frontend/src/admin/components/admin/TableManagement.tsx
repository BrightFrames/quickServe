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
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Table {
  _id: string;
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
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

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
      const response = await axios.get("/api/tables");
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

      // Get restaurant slug from localStorage
      const restaurantSlug = localStorage.getItem('restaurantSlug');

      await axios.post("/api/tables", {
        ...formData,
        restaurantSlug,
      });
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
      await axios.put(`/api/tables/${selectedTable._id}`, formData);
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
      await axios.delete(`/api/tables/${selectedTable._id}`);
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
      await axios.put(`/api/tables/${table._id}`, {
        isActive: !table.isActive,
      });
      toast.success(`Table ${table.isActive ? "deactivated" : "activated"}`);
      fetchTables();
    } catch (error: any) {
      toast.error("Failed to update table status");
    }
  };

  const handleRegenerateQR = async (table: Table) => {
    try {
      // Get restaurant slug from localStorage
      const restaurantSlug = localStorage.getItem('restaurantSlug');
      
      await axios.post(`/api/tables/${table._id}/regenerate-qr`, {
        restaurantSlug,
      });
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

  const openDeleteDialog = (table: Table) => {
    setSelectedTable(table);
    setIsDeleteDialogOpen(true);
  };

  const openQRDialog = (table: Table) => {
    setSelectedTable(table);
    setIsQRDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      tableId: "",
      tableName: "",
      seats: 4,
      location: "",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading tables...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Table Management</h1>
          <p className="text-gray-500 mt-1">
            Manage restaurant tables and QR codes
          </p>
        </div>
        <button
          onClick={openAddDialog}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div
            key={table._id}
            className={`bg-white rounded-lg shadow-md border p-6 ${
              !table.isActive ? "opacity-60" : ""
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {table.tableName}
                  {!table.isActive && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  Table ID: {table.tableId}
                </p>
              </div>
              <button
                onClick={() => openQRDialog(table)}
                className="text-blue-600 hover:text-blue-800"
              >
                <QrCode className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="h-4 w-4 text-gray-500" />
                <span>{table.seats} seats</span>
              </div>
              {table.location && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{table.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-4 pt-3 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={table.isActive}
                  onChange={() => handleToggleActive(table)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEditDialog(table)}
                className="flex-1 border border-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 flex items-center justify-center gap-1 text-sm"
              >
                <Edit className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={() => handleDownloadQR(table)}
                className="border border-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-50"
                title="Download QR"
              >
                <Download className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleRegenerateQR(table)}
                className="border border-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-50"
                title="Regenerate QR"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
              <button
                onClick={() => openDeleteDialog(table)}
                className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            No tables yet. Add your first table to get started.
          </p>
        </div>
      )}

      {/* Add Table Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Table</h2>
              <button onClick={() => setIsAddDialogOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Create a new table with a unique QR code for customer orders
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Table ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g., T1, T2, A1"
                  value={formData.tableId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      tableId: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Table Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Table 1, Window Seat"
                  value={formData.tableName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, tableName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Seats
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.seats}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      seats: parseInt(e.target.value) || 4,
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Ground Floor, Outdoor"
                  value={formData.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setIsAddDialogOpen(false)}
                className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTable}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Dialog */}
      {isEditDialogOpen && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Table</h2>
              <button onClick={() => setIsEditDialogOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Update table information (Table ID cannot be changed)
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Table ID
                </label>
                <input
                  type="text"
                  value={formData.tableId}
                  disabled
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Table Name *
                </label>
                <input
                  type="text"
                  value={formData.tableName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, tableName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Seats
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.seats}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      seats: parseInt(e.target.value) || 4,
                    })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTable}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Update Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Dialog */}
      {isQRDialogOpen && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedTable.tableName} - QR Code
              </h2>
              <button onClick={() => setIsQRDialogOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Customers can scan this QR code to order from this table
            </p>
            <div className="flex flex-col items-center gap-4 py-4">
              <img
                src={selectedTable.qrCode}
                alt={`QR Code for ${selectedTable.tableName}`}
                className="w-64 h-64 border rounded"
              />
              <div className="text-center text-sm text-gray-500">
                <p>Table ID: {selectedTable.tableId}</p>
                <p className="mt-1">
                  Scan to order from {selectedTable.tableName}
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => handleDownloadQR(selectedTable)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download QR Code
                </button>
                <button
                  onClick={() => handleRegenerateQR(selectedTable)}
                  className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsQRDialogOpen(false)}
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">Delete Table</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedTable.tableName}? This
              action cannot be undone and will affect order history.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedTable(null);
                }}
                className="flex-1 border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTable}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
