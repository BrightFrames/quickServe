import { useEffect, useState } from 'react';
import { Users, Circle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Table {
  id: number;
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  restaurantId: number;
}

interface CaptainTableSelectionProps {
  onTableSelect: (tableId: number) => void;
}

const CaptainTableSelection = ({ onTableSelect }: CaptainTableSelectionProps) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('captainToken');
      const user = JSON.parse(localStorage.getItem('captainUser') || '{}');
      
      const response = await axios.get(
        `${apiUrl}/api/tables/restaurant/${user.restaurantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTables(response.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Select a Table</h2>
        <span className="px-3 py-1 text-sm border border-gray-300 rounded-full bg-white">
          {tables.length} Tables
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className="bg-white rounded-xl shadow-md p-5 cursor-pointer hover:shadow-xl transition-all hover:scale-105 border border-gray-200"
            onClick={() => onTableSelect(table.id)}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Table {table.tableNumber}
                </h3>
                <Circle
                  className={`h-3 w-3 ${
                    table.status === 'available'
                      ? 'fill-green-500 text-green-500'
                      : table.status === 'occupied'
                      ? 'fill-red-500 text-red-500'
                      : 'fill-yellow-500 text-yellow-500'
                  }`}
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Capacity: {table.capacity}</span>
                </div>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(table.status)}`}>
                  {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No tables available</p>
        </div>
      )}
    </div>
  );
};

export default CaptainTableSelection;
