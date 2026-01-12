
import React from 'react';
import { Order } from '../types';

interface Props {
  order: Order;
  onClose: () => void;
}

const Receipt: React.FC<Props> = ({ order, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Receipt Header Style */}
        <div className="bg-indigo-900 p-8 text-center text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
            <span className="text-2xl font-black">L</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">The Luna Shop</h2>
          <p className="text-indigo-200 text-sm">Authentic Malaysian Food</p>
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-end border-b pb-6 border-dashed border-slate-200">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipt ID</p>
              <p className="font-bold text-slate-800 text-sm">#{order.id.slice(-12)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date & Time</p>
              <p className="text-slate-800 text-sm">{new Date(order.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Service Type</span>
              <span className="font-bold text-slate-800">{order.orderType}</span>
            </div>
            {order.orderType === 'Dine-in' && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Table Number</span>
                <span className="font-bold text-slate-800">{order.tableNumber}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Payment Status</span>
              <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase border ${order.paymentStatus === 'Paid' ? 'border-green-200 bg-green-50 text-green-600' : 'border-red-200 bg-red-50 text-red-500'}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          <div className="border-t border-b py-6 space-y-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <p className="text-sm font-bold text-slate-800">{item.quantity}x {item.name}</p>
                  {item.note && <p className="text-xs text-slate-400 italic">Note: {item.note}</p>}
                </div>
                <p className="text-sm font-bold text-slate-800">RM {(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-500 text-sm">
              <span>Subtotal</span>
              <span>RM {(order.total * 0.94).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-sm">
              <span>Service Tax (6%)</span>
              <span>RM {(order.total * 0.06).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-indigo-950 pt-4">
              <span>Total</span>
              <span>RM {order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-6 text-center">
            <p className="text-xs text-slate-400">Paid via {order.paymentMethod}</p>
            <p className="text-[10px] text-slate-300 mt-6 font-bold uppercase tracking-widest italic">Thank you for dining at The Luna Shop</p>
          </div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute left-0 bottom-1/3 -ml-3 w-6 h-6 bg-slate-950/80 rounded-full"></div>
        <div className="absolute right-0 bottom-1/3 -mr-3 w-6 h-6 bg-slate-950/80 rounded-full"></div>
      </div>
    </div>
  );
};

export default Receipt;
