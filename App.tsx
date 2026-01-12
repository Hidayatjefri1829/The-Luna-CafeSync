import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem, Order, ViewMode, OrderStatus, PaymentStatus } from './types.ts';
import { INITIAL_MENU } from './constants.tsx';
import CustomerPortal from './components/CustomerPortal.tsx';
import StaffPortal from './components/StaffPortal.tsx';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('customer');
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

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
      localStorage.removeItem('luna_orders');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-indigo-950 text-white p-2 text-[10px] font-black uppercase tracking-widest flex justify-center gap-6 sticky top-0 z-50 backdrop-blur-md bg-opacity-90 border-b border-indigo-900">
        <button 
          onClick={() => setViewMode('customer')}
          className={`px-4 py-1.5 rounded-full transition-all ${viewMode === 'customer' ? 'bg-indigo-600 shadow-lg scale-105' : 'opacity-50 hover:opacity-100'}`}
        >
          Customer View
        </button>
        <button 
          onClick={() => setViewMode('staff')}
          className={`px-4 py-1.5 rounded-full transition-all ${viewMode === 'staff' ? 'bg-indigo-600 shadow-lg scale-105' : 'opacity-50 hover:opacity-100'}`}
        >
          Staff Portal
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