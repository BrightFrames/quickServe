import React, { useEffect, useState } from "react";
import axios from "axios";
import { Users, Receipt, Utensils, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import BillingPanel from "./BillingPanel";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Table {
    id: number;
    tableNumber: number;
    tableName?: string;
    status: "available" | "occupied" | "reserved";
}

interface TableViewProps {
    onTableClick?: (tableId: number) => void;
}

const TableView: React.FC<TableViewProps> = ({ onTableClick }) => {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingTable, setBillingTable] = useState<number | null>(null);
    const { user } = useAuth();
    const restaurantSlug = (user as any)?.restaurantSlug;

    useEffect(() => {
        fetchTables();
        const interval = setInterval(fetchTables, 15000); // Polling every 15s
        return () => clearInterval(interval);
    }, [user]);

    const fetchTables = async () => {
        try {
            if (!restaurantSlug) return;
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${apiUrl}/api/captain/tables/${restaurantSlug}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTables(response.data || []);
        } catch (err) {
            console.error("Failed to load tables", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFreeTable = async (tableNumber: number) => {
        if (!confirm(`Free Table ${tableNumber}?`)) return;
        try {
            const token = localStorage.getItem("token");
            await axios.post(
                `${apiUrl}/api/captain/tables/${restaurantSlug}/free/${tableNumber}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTables();
        } catch (err) {
            alert("Failed to free table");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading Map...</div>;

    return (
        <div className="p-4 h-full overflow-y-auto pb-24">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {tables.map((table) => {
                    const isOccupied = table.status === 'occupied';
                    return (
                        <div key={table.id} className="relative">
                            <button
                                onClick={() => onTableClick?.(table.tableNumber)}
                                className={`
                  w-full aspect-square rounded-xl flex flex-col items-center justify-center p-2 border transition-all active:scale-95 shadow-sm
                  ${isOccupied
                                        ? "bg-red-500 text-white border-red-600 shadow-red-200"
                                        : "bg-green-50 text-green-800 border-green-200 hover:bg-green-100 hover:border-green-300"}
                `}
                            >
                                <span className="text-2xl font-black">{table.tableNumber}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 opacity-80">
                                    {isOccupied ? 'Occupied' : 'Available'}
                                </span>
                            </button>

                            {isOccupied && (
                                <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setBillingTable(table.tableNumber); }}
                                        className="bg-white text-blue-600 border border-blue-100 p-2 rounded-full shadow-md hover:bg-blue-50"
                                    >
                                        <Receipt className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleFreeTable(table.tableNumber); }}
                                        className="bg-white text-red-600 border border-red-100 p-2 rounded-full shadow-md hover:bg-red-50"
                                    >
                                        <Utensils className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {
                billingTable && (
                    <BillingPanel
                        tableNumber={billingTable}
                        onClose={() => setBillingTable(null)}
                        onPaymentComplete={() => {
                            setBillingTable(null);
                            fetchTables();
                        }}
                    />
                )
            }
        </div >
    );
};

export default TableView;
