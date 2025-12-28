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
        <div className="p-3 h-full overflow-y-auto pb-24 bg-gray-100">
            <div className="grid grid-cols-3 gap-3">
                {tables.map((table) => {
                    const isOccupied = table.status === 'occupied';
                    return (
                        <div key={table.id} className="relative aspect-square">
                            <button
                                onClick={() => onTableClick?.(table.tableNumber)}
                                className={`
                                    w-full h-full rounded-xl flex flex-col items-center justify-center p-2 shadow-sm transition-all active:scale-95 border-b-4
                                    ${isOccupied
                                        ? "bg-blue-600 text-white border-blue-800"
                                        : "bg-white text-gray-900 border-gray-200 hover:border-green-400"}
                                `}
                            >
                                <span className="text-4xl font-black">{table.tableNumber}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isOccupied ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {isOccupied ? 'OCCUPIED' : 'FREE'}
                                </span>
                            </button>

                            {isOccupied && (
                                <div className="absolute -bottom-2 -right-2 flex gap-1 z-10">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setBillingTable(table.tableNumber); }}
                                        className="bg-yellow-400 text-black border-2 border-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center active:scale-90"
                                    >
                                        <Receipt className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleFreeTable(table.tableNumber); }}
                                        className="bg-gray-800 text-white border-2 border-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center active:scale-90"
                                    >
                                        <Utensils className="w-5 h-5" />
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
