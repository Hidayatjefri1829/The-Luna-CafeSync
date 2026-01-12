
export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Unpaid' | 'Paid';
export type OrderType = 'Dine-in' | 'Takeaway';
export type PaymentMethod = 'Cash' | 'Online Payment';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  note: string;
}

export interface Order {
  id: string;
  tableNumber: number | string; // 1-25 or "Takeaway"
  orderType: OrderType;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  timestamp: Date;
}

export type ViewMode = 'customer' | 'staff';
