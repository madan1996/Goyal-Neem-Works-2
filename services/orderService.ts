
import { Order, CartItem, Address, OrderStatus } from '../types';
import { logger } from './loggerService';

let ORDERS: Order[] = [
  // Mock Data
  {
    id: 'ord-123',
    userId: 'user-1',
    items: [],
    totalAmount: 1200,
    status: 'delivered',
    shippingAddress: { street: '123 Herb St', city: 'Delhi', state: 'DL', zipCode: '110001', country: 'India' },
    paymentMethod: 'online',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    trackingNumber: 'GNW-DEL-889922'
  }
];

export const orderService = {
  createOrder: async (userId: string, items: CartItem[], total: number, address: Address, payment: 'cod' | 'online'): Promise<Order> => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      userId,
      items,
      totalAmount: total,
      status: 'pending',
      shippingAddress: address,
      paymentMethod: payment,
      createdAt: new Date().toISOString()
    };

    ORDERS.unshift(newOrder);
    logger.log('INFO', 'Order Created', { userId, requestData: { orderId: newOrder.id, total } });
    return newOrder;
  },

  getOrdersByUser: (userId: string): Order[] => {
    return ORDERS.filter(o => o.userId === userId);
  },

  getAllOrders: (): Order[] => {
    return ORDERS;
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus, trackingNumber?: string): Promise<void> => {
    const order = ORDERS.find(o => o.id === orderId);
    if (order) {
      order.status = status;
      if (trackingNumber !== undefined) {
        order.trackingNumber = trackingNumber;
      }
      logger.log('INFO', 'Order Status Updated', { requestData: { orderId, status, trackingNumber } });
    }
  }
};