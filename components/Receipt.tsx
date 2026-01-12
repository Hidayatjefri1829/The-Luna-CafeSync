import React from 'react';
import { Order } from '../types.ts';

interface Props {
  order: Order;
  onClose: () => void;
}

const Receipt: React.FC<Props> = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
        <div className="bg-indigo-900 p-10 text-center text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-3 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div className="w-20 h-20 bg-white p-1 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-indigo-400/30">
            <span className="text-4xl font-black text-indigo-950 italic">L</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2">The Luna Shop</h2>
          <p className="text-indigo-200 font-medium">Authentic Malaysian Delights</p>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
          <div className="flex justify-between items-end border-b pb-8 border-dashed border-slate-200">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order ID</p>
              <p className="font-black text-indigo-950 text-lg">#{order.id.slice(-6)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service</p>
              <p className="text-slate-800 font-bold">{order.orderType} • {order.tableNumber === 'Takeaway' ? 'Pickup' : `Table ${order.tableNumber}`}</p>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Summary</h3>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <img src={item.image} className="w-14 h-14 rounded-2xl object-cover border" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-black text-slate-800 pr-4">{item.quantity}x {item.name}</p>
                    <p className="text-sm font-black text-indigo-950">RM {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  {item.note && <p className="text-[10px] text-slate-400 font-medium italic mt-1 leading-relaxed">"{item.note}"</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t space-y-2">
            <div className="flex justify-between text-slate-500 font-medium text-sm">
              <span>Subtotal</span>
              <span>RM {(order.total * 0.94).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium text-sm">
              <span>Tax (6%)</span>
              <span>RM {(order.total * 0.06).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
              <span className="text-4xl font-black text-indigo-950">RM {order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-10 text-center pb-4">
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">Thank you for dining with us!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;