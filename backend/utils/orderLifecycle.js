/**
 * Order Lifecycle Management Utility
 * 
 * Purpose:
 * - Define valid order status transitions
 * - Validate status changes to prevent invalid state transitions
 * - Provide helper functions for order state management
 * - Ensure data consistency across order lifecycle
 * 
 * Order Status Flow:
 * pending → preparing → ready → served → completed
 * 
 * - pending: Customer placed order, waiting for kitchen to start
 * - preparing: Kitchen is actively cooking the order
 * - ready: Food is ready, waiting for captain to serve
 * - served: Captain delivered food to table, waiting for payment
 * - completed: Payment received, order fully closed
 * - cancelled: Order cancelled at any stage
 */

import { createLogger } from "./logger.js";

const logger = createLogger("OrderLifecycle");

/**
 * Valid order status values
 */
export const ORDER_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

/**
 * Valid status transitions
 * Maps current status → allowed next statuses
 */
const STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.SERVED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SERVED]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [], // Terminal state
  [ORDER_STATUS.CANCELLED]: [], // Terminal state
};

/**
 * Check if a status transition is valid
 * 
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - Desired new status
 * @returns {boolean} - True if transition is allowed
 */
export const isValidTransition = (currentStatus, newStatus) => {
  // Allow same status (idempotent updates)
  if (currentStatus === newStatus) {
    return true;
  }

  // Check if transition is in allowed list
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
};

/**
 * Get next possible statuses from current status
 * 
 * @param {string} currentStatus - Current order status
 * @returns {string[]} - Array of allowed next statuses
 */
export const getNextStatuses = (currentStatus) => {
  return STATUS_TRANSITIONS[currentStatus] || [];
};

/**
 * Validate status transition and throw error if invalid
 * 
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - Desired new status
 * @param {string} orderNumber - Order number for logging
 * @throws {Error} - If transition is invalid
 */
export const validateStatusTransition = (currentStatus, newStatus, orderNumber) => {
  if (!isValidTransition(currentStatus, newStatus)) {
    const allowedStatuses = getNextStatuses(currentStatus);
    
    logger.warn("Invalid status transition attempted", {
      orderNumber,
      currentStatus,
      attemptedStatus: newStatus,
      allowedStatuses,
    });

    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
      `Allowed transitions: ${allowedStatuses.join(", ") || "none (terminal state)"}`
    );
  }

  logger.info("Status transition validated", {
    orderNumber,
    from: currentStatus,
    to: newStatus,
  });
};

/**
 * Get human-readable status description
 * 
 * @param {string} status - Order status
 * @returns {string} - Human-readable description
 */
export const getStatusDescription = (status) => {
  const descriptions = {
    [ORDER_STATUS.PENDING]: "Order received, waiting to start",
    [ORDER_STATUS.PREPARING]: "Kitchen is preparing your order",
    [ORDER_STATUS.READY]: "Order is ready for pickup/serving",
    [ORDER_STATUS.SERVED]: "Order delivered to table",
    [ORDER_STATUS.COMPLETED]: "Order completed and paid",
    [ORDER_STATUS.CANCELLED]: "Order cancelled",
  };

  return descriptions[status] || "Unknown status";
};

/**
 * Check if order can be cancelled
 * 
 * @param {string} currentStatus - Current order status
 * @returns {boolean} - True if order can be cancelled
 */
export const canCancelOrder = (currentStatus) => {
  return currentStatus !== ORDER_STATUS.COMPLETED && 
         currentStatus !== ORDER_STATUS.CANCELLED;
};

/**
 * Check if order can be modified (items added/removed)
 * 
 * @param {string} currentStatus - Current order status
 * @returns {boolean} - True if order can be modified
 */
export const canModifyOrder = (currentStatus) => {
  return currentStatus === ORDER_STATUS.PENDING;
};

/**
 * Check if order is in active state (not completed or cancelled)
 * 
 * @param {string} currentStatus - Current order status
 * @returns {boolean} - True if order is active
 */
export const isActiveOrder = (currentStatus) => {
  return currentStatus !== ORDER_STATUS.COMPLETED && 
         currentStatus !== ORDER_STATUS.CANCELLED;
};

/**
 * Check if order is ready for payment
 * 
 * @param {string} currentStatus - Current order status
 * @returns {boolean} - True if order can be paid
 */
export const canProcessPayment = (currentStatus) => {
  return currentStatus === ORDER_STATUS.SERVED;
};

/**
 * Get Socket.IO room name for restaurant orders
 * 
 * @param {number} restaurantId - Restaurant ID
 * @returns {string} - Socket.IO room name
 */
export const getRestaurantRoom = (restaurantId) => {
  return `restaurant_${restaurantId}`;
};

/**
 * Get Socket.IO room name for kitchen panel
 * 
 * @param {number} restaurantId - Restaurant ID
 * @returns {string} - Socket.IO room name
 */
export const getKitchenRoom = (restaurantId) => {
  return `kitchen_${restaurantId}`;
};

/**
 * Get Socket.IO room name for captain panel
 * 
 * @param {number} restaurantId - Restaurant ID
 * @returns {string} - Socket.IO room name
 */
export const getCaptainRoom = (restaurantId) => {
  return `captain_${restaurantId}`;
};

logger.info("Order lifecycle utility initialized", {
  statuses: Object.values(ORDER_STATUS),
  transitions: STATUS_TRANSITIONS,
});
