import React, { useState, useEffect, useRef } from 'react';
import { MenuItem, CartItem, Order, OrderType, PaymentMethod } from '../types.ts';
import { CATEGORIES, FALLBACK_IMAGE } from '../constants.tsx';
import Receipt from './Receipt.tsx';
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
  const [previewItem, setPreviewItem] = useState<MenuItem | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

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
      alert("Camera access denied.");
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
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
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
    requestRef.current = requestAnimationFrame(tick);
  };

  const filteredMenu = menu.filter(item => selectedCategory === 'All' || item.category === selectedCategory);

  const addToCart = (item: MenuItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    const newOrder: Order = {
      id: `LUNA-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
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
    <div className="pb-32 px-4 max-w-6xl mx-auto pt-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-indigo-950 mb-2">The Luna Shop</h1>
          <p className="text-slate-500 font-medium italic">Traditional Flavors, Modern Dining.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={startScanner} className="bg-white border-2 border-slate-100 p-3 rounded-2xl shadow-sm hover:border-indigo-600 transition-all active:scale-95">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          </button>
          <div className="bg-indigo-900 text-white px-6 py-3 rounded-2xl flex flex-col justify-center min-w-[120px] shadow-xl">
            <span className="text-[9px] font-black uppercase opacity-60">Table</span>
            <span className="text-xl font-black">{tableNumber || 'Pick One'}</span>
          </div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2.5 rounded-full text-xs font-black transition-all ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMenu.map(item => (
          <div key={item.id} onClick={() => setPreviewItem(item)} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 group cursor-pointer">
            <div className="h-56 relative overflow-hidden">
              <img src={item.image || FALLBACK_IMAGE} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-black text-indigo-900 text-xs shadow-lg">RM {item.price.toFixed(2)}</div>
            </div>
            <div className="p-6">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">{item.category}</span>
              <h3 className="font-black text-xl text-slate-800 mb-2">{item.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-6">{item.description}</p>
              <button disabled={!item.isAvailable} onClick={(e) => addToCart(item, e)} className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 ${item.isAvailable ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm' : 'bg-slate-100 text-slate-300'}`}>
                {item.isAvailable ? 'Add To Cart' : 'Sold Out'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t z-40 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex -space-x-3 overflow-hidden">
              {cart.slice(0, 4).map((item, i) => (
                <img key={i} src={item.image} className="inline-block h-12 w-12 rounded-full ring-4 ring-white object-cover" />
              ))}
              {cart.length > 4 && <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-xs font-black text-slate-500 ring-4 ring-white">+{cart.length - 4}</div>}
            </div>
            <button onClick={() => setShowCheckout(true)} className="bg-indigo-600 text-white px-10 py-4 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-all">
              Order • RM {cartTotal.toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {previewItem && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
          <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="h-80 relative">
              <img src={previewItem.image} className="w-full h-full object-cover" />
              <button onClick={() => setPreviewItem(null)} className="absolute top-6 right-6 bg-black/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/40">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-10">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 block">{previewItem.category}</span>
              <h2 className="text-4xl font-black text-slate-900 mb-4">{previewItem.name}</h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-10">{previewItem.description}</p>
              <div className="flex items-center justify-between border-t pt-8">
                <span className="text-3xl font-black text-slate-900">RM {previewItem.price.toFixed(2)}</span>
                <button onClick={() => { addToCart(previewItem); setPreviewItem(null); }} className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black hover:bg-indigo-700 transition-all shadow-xl">Add To Order</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="p-10 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black text-indigo-950">Review Order</h2>
              <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4">
                  <img src={item.image} className="w-16 h-16 rounded-2xl object-cover border" />
                  <div className="flex-1">
                    <div className="flex justify-between font-black text-slate-800">
                      <span>{item.name}</span>
                      <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-3 bg-slate-50 border rounded-full px-1 py-0.5">
                        <button onClick={() => updateCartQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center font-bold text-slate-400">-</button>
                        <span className="text-xs font-black">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center font-bold text-slate-400">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-8 border-t space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setOrderType('Dine-in')} className={`py-3 rounded-2xl font-black text-xs border-2 transition-all ${orderType === 'Dine-in' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>Dine-in</button>
                  <button onClick={() => setOrderType('Takeaway')} className={`py-3 rounded-2xl font-black text-xs border-2 transition-all ${orderType === 'Takeaway' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}>Takeaway</button>
                </div>
                {orderType === 'Dine-in' && (
                  <select value={tableNumber || ''} onChange={(e) => setTableNumber(Number(e.target.value))} className="w-full p-4 rounded-2xl border bg-slate-50 font-black text-sm outline-none">
                    <option value="" disabled>Select Table Number</option>
                    {Array.from({ length: 25 }, (_, i) => i + 1).map(n => <option key={n} value={n}>Table {n}</option>)}
                  </select>
                )}
              </div>
            </div>
            <div className="p-10 bg-slate-50">
              <button onClick={handleCheckout} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Send to Kitchen • RM {cartTotal.toFixed(2)}</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && activeOrder && (
        <div className="fixed inset-0 bg-indigo-950 z-[200] flex items-center justify-center p-4">
          <div className="text-center space-y-10 animate-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto border-2 border-white/20 animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h2 className="text-5xl font-black text-white">Order Received!</h2>
            <button onClick={() => setShowSuccess(false)} className="bg-white text-indigo-950 px-12 py-5 rounded-[2rem] font-black text-lg hover:bg-indigo-50 transition-all shadow-2xl">Return Home</button>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 bg-black z-[300] flex flex-col items-center justify-center p-6">
          <div className="relative w-full max-w-sm aspect-square border-4 border-indigo-600 rounded-[3rem] overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <button onClick={stopScanner} className="mt-12 text-white font-black uppercase tracking-widest bg-white/10 px-8 py-3 rounded-full border border-white/20">Cancel</button>
        </div>
      )}

      {activeOrder && !showSuccess && <Receipt order={activeOrder} onClose={() => setActiveOrder(null)} />}
    </div>
  );
};

export default CustomerPortal;