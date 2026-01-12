
import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, CartItem, Order, OrderType, PaymentMethod } from '../types';
import { CATEGORIES } from '../constants';
import Receipt from './Receipt';
import jsQR from 'https://esm.sh/jsqr@1.4.0';

interface Props {
  menu: MenuItem[];
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onPlaceOrder: (order: Order) => void;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
}

const CustomerPortal: React.FC<Props> = ({ menu, cart, setCart, onPlaceOrder, activeOrder, setActiveOrder }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('Dine-in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // QR Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);

  // 1. Check for table URL parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      const num = parseInt(tableParam);
      if (!isNaN(num) && num >= 1 && num <= 25) {
        setTableNumber(num);
        setOrderType('Dine-in');
      }
    }
  }, []);

  // 2. QR Scanner Logic
  const startScanner = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please enable camera permissions to scan table QR codes.");
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    setIsScanning(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          try {
             // Handle raw number, full URL with table=, or path ending in table=
            const url = new URL(code.data);
            const num = parseInt(url.searchParams.get('table') || '');
            if (!isNaN(num) && num >= 1 && num <= 25) {
              setTableNumber(num);
              setOrderType('Dine-in');
              stopScanner();
              return;
            }
          } catch (e) {
            // Check for raw numeric code
            const match = code.data.match(/table=(\d+)/i) || code.data.match(/^(\d+)$/);
            if (match) {
              const num = parseInt(match[1]);
              if (num >= 1 && num <= 25) {
                setTableNumber(num);
                setOrderType('Dine-in');
                stopScanner();
                return;
              }
            }
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  const filteredMenu = menu.filter(item => selectedCategory === 'All' || item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, note: '' }];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => 
      i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
    ).filter(i => i.quantity > 0));
  };

  const updateCartNote = (id: string, note: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, note } : i));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      tableNumber: orderType === 'Dine-in' ? (tableNumber || 'N/A') : 'Takeaway',
      orderType,
      items: [...cart],
      total: cartTotal,
      status: 'Pending',
      paymentMethod,
      paymentStatus: 'Unpaid',
      timestamp: new Date(),
    };

    onPlaceOrder(newOrder);
    setShowCheckout(false);
    setShowSuccess(true);
  };

  return (
    <div className="pb-32 px-4 max-w-4xl mx-auto pt-6">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-indigo-950 mb-2">The Luna Shop</h1>
          <p className="text-slate-500 font-medium italic">Authentic Malaysian Delights</p>
        </div>

        <div className="flex items-center gap-3">
          {orderType === 'Dine-in' && tableNumber ? (
            <div className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-100 border border-indigo-500">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Table</span>
              <span className="text-xl font-black">{tableNumber}</span>
              <button 
                onClick={() => setTableNumber(null)}
                className="ml-2 bg-white/20 hover:bg-white/30 p-1 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={startScanner}
              className="bg-white border-2 border-indigo-100 text-indigo-600 px-6 py-2.5 rounded-2xl font-black flex items-center gap-3 hover:border-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
              Scan Table QR
            </button>
          )}
        </div>
      </header>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
              selectedCategory === cat 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Menu Grid - No Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMenu.map(item => (
          <div 
            key={item.id} 
            className={`bg-white rounded-2xl p-6 shadow-sm border transition-all flex flex-col justify-between ${!item.isAvailable ? 'opacity-60 grayscale bg-slate-50' : 'hover:shadow-md border-slate-100'}`}
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{item.name}</h3>
                  <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-md uppercase tracking-wider mb-2">
                    {item.category}
                  </span>
                </div>
                <span className="font-bold text-indigo-600 text-lg">RM {item.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-slate-500 mb-6 line-clamp-2 h-10">{item.description}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                disabled={!item.isAvailable}
                onClick={() => addToCart(item)}
                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  item.isAvailable 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-100' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {item.isAvailable ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    Add to Cart
                  </>
                ) : (
                  'Sold Out'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Drawer / Bottom Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Total Amount</p>
              <p className="text-2xl font-black text-indigo-950">RM {cartTotal.toFixed(2)}</p>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 transition-transform active:scale-95 shadow-xl shadow-indigo-200"
            >
              Review Order
              <span className="bg-indigo-400/30 text-white px-2.5 py-1 rounded-lg text-xs font-black">{cart.length} items</span>
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b flex items-center justify-between bg-indigo-50/50">
              <h2 className="text-xl font-black text-indigo-950">Review Your Selection</h2>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-indigo-100">
                <svg className="w-6 h-6 text-indigo-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
                  <div className="flex justify-between font-bold text-slate-800 gap-2 mb-2">
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0">RM {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-1 py-1">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="w-7 h-7 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center font-bold">-</button>
                      <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 h-7 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center font-bold">+</button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">RM {item.price.toFixed(2)} ea</span>
                  </div>
                  <input 
                    placeholder="Add a note (e.g. no spicy, extra egg)..." 
                    className="mt-3 text-xs w-full p-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                    value={item.note}
                    onChange={(e) => updateCartNote(item.id, e.target.value)}
                  />
                </div>
              ))}

              {/* Order Options */}
              <div className="pt-4 border-t space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Choice</label>
                    <select 
                      value={orderType} 
                      onChange={(e) => setOrderType(e.target.value as OrderType)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white font-bold text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="Dine-in">Dine-in</option>
                      <option value="Takeaway">Takeaway</option>
                    </select>
                  </div>
                  {orderType === 'Dine-in' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table Number</label>
                      <div className="flex gap-2">
                        <select 
                          value={tableNumber || 1} 
                          onChange={(e) => setTableNumber(Number(e.target.value))}
                          className="flex-1 p-3 rounded-xl border border-slate-200 bg-white font-bold text-sm outline-none focus:border-indigo-500"
                        >
                          <option disabled value="">Select</option>
                          {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>Table {num}</option>
                          ))}
                        </select>
                        <button 
                          onClick={startScanner}
                          className="bg-indigo-50 text-indigo-600 p-3 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center justify-center"
                          title="Scan Table QR"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                <div className="flex gap-3">
                  {(['Cash', 'Online Payment'] as PaymentMethod[]).map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 p-3 rounded-xl border text-sm font-bold transition-all ${
                        paymentMethod === method 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm' 
                          : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-200'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t space-y-4">
              <div className="flex justify-between text-2xl font-black text-slate-900">
                <span>Final Amount</span>
                <span>RM {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]"
              >
                Confirm & Place Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Overlay */}
      {isScanning && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg aspect-square p-8">
            <video ref={videoRef} className="w-full h-full object-cover rounded-3xl" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning UI Overlays */}
            <div className="absolute inset-8 border-4 border-white/20 rounded-3xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1 rounded-br-xl" />
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-white text-center bg-black/40 backdrop-blur-md px-6 py-3 rounded-full text-sm font-bold border border-white/10">
                 Aim at the table QR code
               </div>
            </div>
          </div>
          
          <div className="mt-8 text-center space-y-6 px-6">
            <h3 className="text-white text-xl font-black">Scan Table QR</h3>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Point your camera at the QR code on your table to automatically set your table number.</p>
            <button 
              onClick={stopScanner}
              className="px-10 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-sm transition-all border border-white/10"
            >
              Cancel Scanning
            </button>
          </div>
        </div>
      )}

      {/* Order Success Popup */}
      {showSuccess && activeOrder && (
        <div className="fixed inset-0 bg-indigo-950/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">Order Success!</h2>
              <p className="text-slate-500 font-medium">Your order <span className="text-indigo-600 font-bold">#{activeOrder.id.slice(-6)}</span> has been received.</p>
            </div>
            
            <div className="p-5 bg-indigo-50 rounded-[1.5rem] text-left border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Details</p>
              <p className="text-lg font-bold text-indigo-900">{activeOrder.orderType} • {activeOrder.tableNumber === 'Takeaway' ? 'Takeaway' : `Table ${activeOrder.tableNumber}`}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setShowSuccess(false); setActiveOrder(null); }}
                className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => { setShowSuccess(false); }}
                className="py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Receipt Modal */}
      {!showSuccess && activeOrder && (
        <Receipt order={activeOrder} onClose={() => setActiveOrder(null)} />
      )}
    </div>
  );
};

export default CustomerPortal;
