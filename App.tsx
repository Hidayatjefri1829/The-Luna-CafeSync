
import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, CartItem, Order, ViewMode, OrderStatus, PaymentStatus } from './types';
import { INITIAL_MENU } from './constants';
import CustomerPortal from './components/CustomerPortal';
import StaffPortal from './components/StaffPortal';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('customer');
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Persistence (Simulated)
  useEffect(() => {
    const savedOrders = localStorage.getItem('luna_orders');
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    
    const savedMenu = localStorage.getItem('luna_menu');
    if (savedMenu) setMenu(JSON.parse(savedMenu));
  }, []);

  useEffect(() => {
    localStorage.setItem('luna_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('luna_menu', JSON.stringify(menu));
  }, [menu]);

  // Order Handlers
  const handlePlaceOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    setCart([]);
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const handleUpdatePaymentStatus = (orderId: string, status: PaymentStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: status } : o));
  };

  const handleToggleAvailability = (itemId: string) => {
    setMenu(prev => prev.map(item => 
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  const handleClearOrders = () => {
    if (window.confirm("Are you sure you want to clear all order history?")) {
      setOrders([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top View Switcher (For Demo Purposes) */}
      <div className="bg-indigo-900 text-white p-2 text-xs flex justify-center gap-4 sticky top-0 z-50 shadow-md">
        <button 
          onClick={() => setViewMode('customer')}
          className={`px-3 py-1 rounded-full transition-colors ${viewMode === 'customer' ? 'bg-indigo-500 font-bold' : 'hover:bg-indigo-800'}`}
        >
          Customer View
        </button>
        <button 
          onClick={() => setViewMode('staff')}
          className={`px-3 py-1 rounded-full transition-colors ${viewMode === 'staff' ? 'bg-indigo-500 font-bold' : 'hover:bg-indigo-800'}`}
        >
          Staff Dashboard
        </button>
      </div>

      {viewMode === 'customer' ? (
        <CustomerPortal 
          menu={menu}
          cart={cart}
          setCart={setCart}
          onPlaceOrder={handlePlaceOrder}
          activeOrder={activeOrder}
          setActiveOrder={setActiveOrder}
        />
      ) : (
        <StaffPortal 
          menu={menu}
          orders={orders}
          onUpdateStatus={handleUpdateOrderStatus}
          onUpdatePayment={handleUpdatePaymentStatus}
          onToggleMenu={handleToggleAvailability}
          onClearOrders={handleClearOrders}
        />
      )}
    </div>
  );
};

export default App;
