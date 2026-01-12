import React, { useState } from 'react';
import { Order, MenuItem, OrderStatus, PaymentStatus } from '../types.ts';
import Receipt from './Receipt.tsx';

interface Props {
  menu: MenuItem[];
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onUpdatePayment: (id: string, status: PaymentStatus) => void;
  onToggleMenu: (id: string) => void;
  onClearOrders: () => void;
}

const StaffPortal: React.FC<Props> = ({ menu, orders, onUpdateStatus, onUpdatePayment, onToggleMenu, onClearOrders }) => {
  const [activeTab, setActiveTab] = useState<'Orders' | 'Menu' | 'QR'>('Orders');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'Preparing': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Ready': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'Delivered': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getTableQRUrl = (tableNum?: number) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = tableNum ? `${baseUrl}?table=${tableNum}` : baseUrl;
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=312e81&margin=10`;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-indigo-950">Luna Staff</h1>
          <p className="text-slate-500 font-medium">Real-time Order Management</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border shadow-sm no-scrollbar overflow-x-auto">
          {['Orders', 'Menu', 'QR'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>{tab}</button>
          ))}
        </div>
      </div>

      {activeTab === 'Orders' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b flex justify-between items-start bg-slate-50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-indigo-600 uppercase">#{order.id.slice(-6)}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                  <h3 className="font-black text-xl text-slate-800">{order.tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${order.tableNumber}`}</h3>
                </div>
                <p className="font-black text-indigo-950">RM {order.total.toFixed(2)}</p>
              </div>
              <div className="p-6 flex-1 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <img src={item.image} className="w-10 h-10 rounded-xl object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-700">{item.quantity}x {item.name}</p>
                      {item.note && <p className="text-[11px] text-indigo-500 font-bold italic">"{item.note}"</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50 border-t space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {['Preparing', 'Ready', 'Delivered'].map(s => (
                    <button key={s} onClick={() => onUpdateStatus(order.id, s as OrderStatus)} className={`text-[10px] font-black py-2 rounded-xl border transition-all ${order.status === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-white hover:border-indigo-600 text-slate-600'}`}>{s}</button>
                  ))}
                  <button onClick={() => setSelectedReceiptOrder(order)} className="text-[10px] font-black py-2 rounded-xl bg-white border hover:bg-slate-100">Receipt</button>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="col-span-full py-40 text-center text-slate-300 font-black uppercase tracking-[0.2em]">No Active Orders</div>}
        </div>
      )}

      {activeTab === 'Menu' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Dish</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Price</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {menu.map(item => (
                <tr key={item.id}>
                  <td className="px-8 py-4 flex items-center gap-4">
                    <img src={item.image} className="w-12 h-12 rounded-2xl object-cover border" />
                    <div>
                      <p className="font-black text-slate-800">{item.name}</p>
                      <span className="text-[10px] text-indigo-500 font-black">{item.category}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right font-black text-indigo-600">RM {item.price.toFixed(2)}</td>
                  <td className="px-8 py-4 text-center">
                    <button onClick={() => onToggleMenu(item.id)} className={`px-6 py-2 rounded-full text-[10px] font-black border transition-all ${item.isAvailable ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>{item.isAvailable ? 'ACTIVE' : 'OUT'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'QR' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: 25 }, (_, i) => i + 1).map(n => (
            <div key={n} className="bg-white p-6 rounded-[2.5rem] border text-center space-y-4 hover:shadow-xl transition-all">
              <p className="font-black text-indigo-950">Table {n}</p>
              <img src={getTableQRUrl(n)} className="w-full aspect-square object-contain bg-slate-50 rounded-2xl p-2" />
              <button className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">Print</button>
            </div>
          ))}
        </div>
      )}

      {selectedReceiptOrder && <Receipt order={selectedReceiptOrder} onClose={() => setSelectedReceiptOrder(null)} />}
    </div>
  );
};

export default StaffPortal;