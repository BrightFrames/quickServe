import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users, AlertCircle } from "lucide-react";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Table {
  id: number;
  tableNumber: number;
  tableName?: string;
  capacity: number;
  status: "available" | "occupied" | "reserved";
  restaurantId: number;
}

interface CaptainTableSelectionProps {
  onSelectTable: (tableId: number) => void;
}

const CaptainTableSelection: React.FC<CaptainTableSelectionProps> = ({
  onSelectTable,
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const restaurantId = user.restaurantId;

      if (!restaurantId) {
        setError("Restaurant information not found. Please login again.");
        setLoading(false);
        return;
      }

      console.log('[CAPTAIN] Fetching tables for restaurant:', restaurantId);

      // Use captain-specific endpoint that doesn't require restaurant token
      const response = await axios.get(
        `${apiUrl}/api/captain/tables/${restaurantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      console.log('[CAPTAIN] Tables fetched:', response.data);
      setTables(response.data || []);
    } catch (err: any) {
      console.error('[CAPTAIN] Error fetching tables:', err);
      setError(err.response?.data?.message || "Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700 border-green-300";
      case "occupied":
        return "bg-red-100 text-red-700 border-red-300";
      case "reserved":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Free";
      case "occupied":
        return "Occupied";
      case "reserved":
        return "Reserved";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Table</h2>
        <p className="text-gray-600">Choose a table to start taking orders</p>
      </div>

      {tables.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <p className="text-yellow-700 font-medium mb-2">No Tables Found</p>
          <p className="text-yellow-600 text-sm">
            Please contact admin to add tables
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tables.map((table) => (
            <button
              key={table.id}
              onClick={() => onSelectTable(table.tableNumber)}
              className={`
                relative p-6 rounded-xl border-2 transition-all hover:scale-105 active:scale-95
                ${getStatusColor(table.status)}
              `}
            >
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">
                  {table.tableName || `#${table.tableNumber}`}
                </div>
                <div className="flex items-center justify-center gap-1 text-xs mb-1">
                  <Users className="w-3 h-3" />
                  <span>{table.capacity}</span>
                </div>
                <div className="text-xs font-medium uppercase">
                  {getStatusText(table.status)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaptainTableSelection;
