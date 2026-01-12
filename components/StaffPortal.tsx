
import React, { useState } from 'react';
import { Order, MenuItem, OrderStatus, PaymentStatus } from '../types';
import Receipt from './Receipt';

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
      case 'Cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-100';
    }
  };

  const getTableQRUrl = (tableNum?: number) => {
    const baseUrl = window.location.origin + window.location.pathname;
    const url = tableNum ? `${baseUrl}?table=${tableNum}` : baseUrl;
    const data = encodeURIComponent(url);
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${data}&bgcolor=ffffff&color=312e81&margin=10`;
  };

  const handleDownloadQR = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 pt-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-indigo-950">Luna Management</h1>
          <p className="text-slate-500 font-medium tracking-tight">System control panel for "The Luna Shop"</p>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm self-start md:self-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('Orders')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'Orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('Menu')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'Menu' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            Availability
          </button>
          <button 
            onClick={() => setActiveTab('QR')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'QR' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            Share Shop QR
          </button>
        </div>
      </div>

      {activeTab === 'Orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800">Recent Orders ({orders.length})</h2>
            <button 
              onClick={onClearOrders}
              className="text-xs font-black text-red-500 bg-red-50 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors uppercase tracking-widest border border-red-100"
            >
              Clear Records
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-medium italic">No active orders in the system.</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-all border-slate-200/60 group">
                  <div className="p-5 border-b flex justify-between items-start bg-slate-50/50 group-hover:bg-indigo-50/20 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">#{order.id.slice(-6)}</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <h3 className="font-black text-lg text-slate-800">
                        {order.orderType === 'Dine-in' ? `Table ${order.tableNumber}` : 'Takeaway'}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="font-black text-indigo-950">RM {order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="p-5 flex-1 space-y-4">
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-700 leading-tight">
                              <span className="inline-block w-6 h-6 bg-slate-100 rounded text-center text-[10px] pt-1 mr-2 font-black">{item.quantity}</span>
                              {item.name}
                            </p>
                            {item.note && <p className="text-[11px] text-indigo-500 font-medium italic mt-1 pl-8">“{item.note}”</p>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t space-y-3">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Status Update</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Preparing', 'Ready', 'Delivered', 'Cancelled'] as OrderStatus[]).map(s => (
                            <button
                              key={s}
                              onClick={() => onUpdateStatus(order.id, s)}
                              className={`text-[10px] font-black py-2 rounded-xl border transition-all ${
                                order.status === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 hover:border-indigo-300'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${order.paymentStatus === 'Paid' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {order.paymentStatus}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{order.paymentMethod}</span>
                        </div>
                        <button 
                          onClick={() => onUpdatePayment(order.id, order.paymentStatus === 'Paid' ? 'Unpaid' : 'Paid')}
                          className="text-[10px] font-black text-indigo-600 hover:underline"
                        >
                          Update Payment
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50/80 border-t">
                    <button 
                      onClick={() => setSelectedReceiptOrder(order)}
                      className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      View Digital Receipt
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'Menu' && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
          <div className="p-8 border-b bg-slate-50/30">
            <h2 className="text-xl font-black text-slate-800">Menu Management</h2>
            <p className="text-sm text-slate-500 font-medium">Control item availability in real-time.</p>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Name & Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menu.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-black text-slate-800">{item.name}</p>
                        <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tight">{item.category}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-indigo-600">
                      RM {item.price.toFixed(2)}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button
                        onClick={() => onToggleMenu(item.id)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black transition-all border shadow-sm ${
                          item.isAvailable 
                            ? 'bg-green-500 text-white border-transparent hover:bg-green-600' 
                            : 'bg-red-500 text-white border-transparent hover:bg-red-600'
                        }`}
                      >
                        {item.isAvailable ? 'IN STOCK' : 'OUT OF STOCK'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'QR' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Shop QR Card */}
          <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col md:flex-row items-center gap-10 overflow-hidden relative">
            <div className="relative z-10 flex-1 space-y-4">
              <span className="bg-indigo-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Official Store QR</span>
              <h2 className="text-4xl font-black leading-tight">Share The Luna Shop</h2>
              <p className="text-indigo-200 font-medium text-lg leading-relaxed max-w-md">This is your main store QR code. Share it with customers for takeaway orders or general browsing. Customers can scan this anywhere to start ordering.</p>
              <div className="pt-6 flex flex-wrap gap-4">
                <button 
                  onClick={() => handleDownloadQR(getTableQRUrl(), 'TheLunaShop_MainQR.png')}
                  className="bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Download Main QR
                </button>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'The Luna Shop',
                        text: 'Order authentic Malaysian food at The Luna Shop!',
                        url: window.location.origin + window.location.pathname,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.origin + window.location.pathname);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="bg-indigo-800 text-white border border-indigo-700 px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                  Share Shop Link
                </button>
              </div>
            </div>
            <div className="relative z-10 w-64 h-64 bg-white p-4 rounded-[2rem] shadow-2xl">
              <img 
                src={getTableQRUrl()} 
                alt="Main Shop QR" 
                className="w-full h-full object-contain"
              />
            </div>
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-800 rounded-full blur-3xl opacity-50"></div>
          </div>
          
          <div className="pt-10">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Table-Specific QR Codes</h2>
            <p className="text-slate-500 font-medium mb-8">Place these at specific tables to automatically identify where the customer is sitting.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
                <div key={num} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 text-center flex flex-col items-center hover:border-indigo-300 transition-all group shadow-sm">
                  <p className="text-xl font-black text-indigo-950 mb-4">Table {num}</p>
                  <div className="aspect-square w-full bg-slate-50 rounded-2xl flex items-center justify-center p-3 border border-slate-100 group-hover:scale-105 transition-transform duration-300">
                    <img 
                      src={getTableQRUrl(num)} 
                      alt={`Table ${num} QR`} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <button 
                    onClick={() => handleDownloadQR(getTableQRUrl(num), `TheLunaShop_Table${num}_QR.png`)}
                    className="mt-4 w-full py-3 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedReceiptOrder && (
        <Receipt order={selectedReceiptOrder} onClose={() => setSelectedReceiptOrder(null)} />
      )}
    </div>
  );
};

export default StaffPortal;
