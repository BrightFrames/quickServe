import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Clock, ChevronRight, AlertCircle } from "lucide-react";
import { Order } from "../../pages/KitchenHome";
import { formatCurrency } from "../../lib/utils";
import { format } from "date-fns";

interface OrderColumnProps {
  title: string;
  status: Order["status"];
  orders: Order[];
  icon: any;
  color: "yellow" | "green" | "blue";
  onStatusChange: (orderId: string, newStatus: Order["status"]) => void;
}

const OrderColumn = ({
  title,
  status,
  orders,
  icon: Icon,
  color,
  onStatusChange,
}: OrderColumnProps) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const colorClasses = {
    yellow: {
      bg: "bg-yellow-50",
      header: "bg-yellow-500",
      border: "border-yellow-200",
      text: "text-yellow-700",
    },
    green: {
      bg: "bg-green-50",
      header: "bg-green-500",
      border: "border-green-200",
      text: "text-green-700",
    },
    blue: {
      bg: "bg-blue-50",
      header: "bg-blue-500",
      border: "border-blue-200",
      text: "text-blue-700",
    },
  };

  const colors = colorClasses[color];

  const getNextStatus = (): Order["status"] | null => {
    if (status === "preparing") return "prepared";
    if (status === "prepared") return "delivered";
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg shadow-lg overflow-hidden ${colors.bg} border-2 ${colors.border}`}
    >
      {/* Header */}
      <div className={`${colors.header} text-white p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-6 h-6" />
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          <div className="bg-white bg-opacity-30 px-3 py-1 rounded-full">
            <span className="text-sm font-semibold">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id || order._id}
              order={order}
              nextStatus={nextStatus}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  nextStatus: Order["status"] | null;
  onStatusChange: (orderId: string, newStatus: Order["status"]) => void;
}

const OrderCard = ({ order, nextStatus, onStatusChange }: OrderCardProps) => {
  const orderId = order.id || order._id;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: orderId,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const isLate = () => {
    const orderTime = new Date(order.createdAt).getTime();
    const now = new Date().getTime();
    const minutesElapsed = (now - orderTime) / 1000 / 60;
    return minutesElapsed > 15 && order.status !== "delivered";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow p-4 cursor-move hover:shadow-lg transition-shadow ${
        isLate() ? "border-2 border-red-500" : ""
      }`}
    >
      {/* Order Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-bold text-gray-800">
              Order #{order.orderNumber}
            </h3>
            {isLate() && (
              <AlertCircle
                className="w-5 h-5 text-red-500"
                title="Order is late!"
              />
            )}
          </div>
          <p className="text-sm text-gray-600">
            Table {order.tableId || `#${order.tableNumber}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            {format(new Date(order.createdAt), "HH:mm")}
          </p>
          <p className="text-sm font-semibold text-gray-700">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
      </div>

      {/* Order Items */}
      <div className="space-y-2 mb-3">
        {order.items.map((item, index) => (
          <div key={`${orderId}-item-${index}`} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {item.quantity}x {item.name}
            </span>
            {item.specialInstructions && (
              <span className="text-orange-600 text-xs italic">
                *{item.specialInstructions}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Action Button */}
      {nextStatus && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange(orderId, nextStatus);
          }}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
        >
          <span className="font-medium">
            {nextStatus === "prepared" && "Mark Prepared"}
            {nextStatus === "delivered" && "Mark Delivered"}
          </span>
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default OrderColumn;
