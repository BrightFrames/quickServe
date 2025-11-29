import { CartItem } from "../context/CartContext";
import axios from "axios";

export type OrderStatus =
  | "pending"
  | "preparing"
  | "prepared"
  | "delivered"
  | "cancelled";

export interface Order {
  _id?: string;
  id?: string;
  orderNumber?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  totalAmount?: number;
  tableNumber?: string | number;
  whatsappNumber?: string;
  customerPhone?: string;
  customerEmail?: string;
  splitBill?: boolean;
  splitCount?: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  promoCode?: string;
  paymentMethod?: "cash" | "card" | "upi";
  paymentStatus?: "pending" | "paid" | "failed";
}

class OrderService {
  private apiUrl = "/api";

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    try {
      // Get restaurantSlug from localStorage (set by RestaurantContext)
      const savedData = localStorage.getItem("customer_restaurant_data");
      let restaurantSlug;
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          restaurantSlug = data.restaurantSlug;
        } catch (e) {
          console.error('Failed to parse restaurant data:', e);
        }
      }
      
      // Get tableId from localStorage (set by QR code scan or manual entry)
      const storedTableId = localStorage.getItem("tableId");
      // Only use tableId if it looks like a valid table ID (starts with T or contains letters)
      const tableId =
        storedTableId && /^T\d+$/i.test(storedTableId)
          ? storedTableId
          : undefined;

      // Map cart items to backend format
      const backendItems = (orderData.items || []).map((item) => {
        // Extract the actual MongoDB ObjectId from the timestamped ID
        // IDs are in format: "60abc123def456789-1234567890"
        // We need just the first part (the actual MongoDB _id)
        const actualId = item.id.split("-")[0];

        return {
          menuItemId: actualId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.instructions || "",
        };
      });

      // Create order payload with tableId (only if valid) and restaurantSlug
      const orderPayload: any = {
        tableNumber: orderData.tableNumber
          ? typeof orderData.tableNumber === "string"
            ? parseInt(orderData.tableNumber.replace(/\D/g, "")) || 1
            : orderData.tableNumber
          : 1,
        customerPhone:
          orderData.whatsappNumber || orderData.customerPhone || "",
        customerEmail: orderData.customerEmail || "",
        items: backendItems,
        slug: restaurantSlug,
        paymentMethod: orderData.paymentMethod || "cash",
      };

      // Only add tableId if it's a valid QR code table
      if (tableId) {
        orderPayload.tableId = tableId;
      }

      console.log("Creating order:", orderPayload);
      const response = await axios.post(`${this.apiUrl}/orders`, orderPayload);

      // Map backend response to frontend format
      const backendOrder = response.data;
      const order: Order = {
        _id: backendOrder._id || backendOrder.id,
        id: backendOrder.id || backendOrder._id,
        orderNumber: backendOrder.orderNumber,
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        tax: orderData.tax || 0,
        discount: orderData.discount || 0,
        total: backendOrder.totalAmount || orderData.total || 0,
        totalAmount: backendOrder.totalAmount,
        tableNumber: backendOrder.tableNumber,
        whatsappNumber: orderData.whatsappNumber,
        customerPhone: backendOrder.customerPhone,
        customerEmail: backendOrder.customerEmail || orderData.customerEmail,
        status: backendOrder.status,
        createdAt: new Date(backendOrder.createdAt),
        updatedAt: new Date(backendOrder.updatedAt),
        promoCode: orderData.promoCode,
      };

      console.log("Order created successfully:", order);
      return order;
    } catch (error: any) {
      console.error(
        "Error creating order:",
        error.response?.data || error.message
      );
      throw new Error(
        error.response?.data?.message || "Failed to create order"
      );
    }
  }

  async getOrderById(orderId: string): Promise<Order> {
    try {
      const response = await axios.get(`${this.apiUrl}/orders/${orderId}`);
      const backendOrder = response.data;

      return {
        _id: backendOrder._id,
        id: backendOrder._id,
        orderNumber: backendOrder.orderNumber,
        items: backendOrder.items.map((item: any) => ({
          id: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: "",
        })),
        subtotal: backendOrder.totalAmount || 0,
        tax: 0,
        discount: 0,
        total: backendOrder.totalAmount,
        totalAmount: backendOrder.totalAmount,
        tableNumber: backendOrder.tableNumber,
        customerPhone: backendOrder.customerPhone,
        status: backendOrder.status,
        createdAt: new Date(backendOrder.createdAt),
        updatedAt: new Date(backendOrder.updatedAt),
      };
    } catch (error) {
      console.error("Error fetching order:", error);
      throw new Error("Failed to fetch order");
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order> {
    try {
      const response = await axios.put(
        `${this.apiUrl}/orders/${orderId}/status`,
        { status }
      );
      const backendOrder = response.data;

      return {
        _id: backendOrder._id,
        id: backendOrder._id,
        orderNumber: backendOrder.orderNumber,
        items: backendOrder.items.map((item: any) => ({
          id: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: "",
        })),
        subtotal: backendOrder.totalAmount || 0,
        tax: 0,
        discount: 0,
        total: backendOrder.totalAmount,
        totalAmount: backendOrder.totalAmount,
        tableNumber: backendOrder.tableNumber,
        customerPhone: backendOrder.customerPhone,
        status: backendOrder.status,
        createdAt: new Date(backendOrder.createdAt),
        updatedAt: new Date(backendOrder.updatedAt),
      };
    } catch (error) {
      console.error("Error updating order status:", error);
      throw new Error("Failed to update order status");
    }
  }

  async getOrderHistory(): Promise<Order[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/orders`);
      return response.data.map((backendOrder: any) => ({
        _id: backendOrder._id || backendOrder.id,
        id: backendOrder.id || backendOrder._id,
        orderNumber: backendOrder.orderNumber,
        items: backendOrder.items.map((item: any) => ({
          id: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: "",
        })),
        subtotal: backendOrder.totalAmount || 0,
        tax: 0,
        discount: 0,
        total: backendOrder.totalAmount,
        totalAmount: backendOrder.totalAmount,
        tableNumber: backendOrder.tableNumber,
        customerPhone: backendOrder.customerPhone,
        status: backendOrder.status,
        createdAt: new Date(backendOrder.createdAt),
        updatedAt: new Date(backendOrder.updatedAt),
      }));
    } catch (error) {
      console.error("Error fetching order history:", error);
      throw new Error("Failed to fetch order history");
    }
  }

  async validatePromoCode(
    code: string
  ): Promise<{ valid: boolean; discount: number }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock promo codes
        const promoCodes: Record<string, number> = {
          WELCOME10: 10,
          SAVE20: 20,
          FREESHIP: 5,
        };

        const discount = promoCodes[code.toUpperCase()] || 0;
        resolve({ valid: discount > 0, discount });
      }, 500);
    });
  }
}

export const orderService = new OrderService();
