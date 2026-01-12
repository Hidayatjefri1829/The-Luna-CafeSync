
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
  const [showActiveReceipt, setShowActiveReceipt] = useState(false);
  
  // QR Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

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
  // Fixes: Error in file components/CustomerPortal.tsx on line 53: Cannot find name 'tick'.
  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          try {
            const url = new URL(code.data);
            const tableParam = url.searchParams.get('table');
            if (tableParam) {
              const num = parseInt(tableParam);
              if (!isNaN(num) && num >= 1 && num <= 25) {
                setTableNumber(num);
                setOrderType('Dine-in');
                stopScanner();
                return;
              }
            }
          } catch (e) {
            // Not a URL or no table param, ignore
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

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
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  const filteredMenu = selectedCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory);

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

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateNote = (id: string, note: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, note } : item));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal;

  const handlePlaceOrderClick = () => {
    if (orderType === 'Dine-in' && tableNumber === null) {
      alert("Please select a table number or scan a table QR code.");
      return;
    }

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      tableNumber: orderType === 'Dine-in' ? tableNumber! : 'Takeaway',
      orderType,
      items: [...cart],
      total,
      status: 'Pending',
      paymentMethod,
      paymentStatus: 'Unpaid',
      timestamp: new Date(),
    };

    onPlaceOrder(newOrder);
    setShowCheckout(false);
    setShowSuccess(true);
  };

  // Fixes: Error in file components/CustomerPortal.tsx on line 17: Type '...' is not assignable to type 'FC<Props>'.
  // Adding the missing return statement.
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-indigo-950 mb-2">The Luna Shop</h1>
          <p className="text-slate-500 font-medium italic">Traditional Malaysian Flavors, Modern Dining.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={startScanner}
            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl font-black text-xs text-indigo-600 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
            Scan Table QR
          </button>
          
          <div className="bg-indigo-950 text-white px-5 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Your Table</span>
            <span className="text-lg font-black">{tableNumber ? `Table ${tableNumber}` : 'Takeaway'}</span>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 mb-8 pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-black transition-all whitespace-nowrap ${
              selectedCategory === cat 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'bg-white text-slate-500 border border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Menu List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-slate-800">Available Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredMenu.map(item => (
              <div key={item.id} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={item.image || FALLBACK_IMAGE} 
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-white text-slate-900 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Sold Out</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-black text-indigo-900 text-xs shadow-lg">
                    RM {item.price.toFixed(2)}
                  </div>
                </div>
                <div className="p-6">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 block">{item.category}</span>
                  <h3 className="font-black text-lg text-slate-800 mb-2 leading-tight">{item.name}</h3>
                  <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6 h-10">{item.description}</p>
                  
                  <button
                    disabled={!item.isAvailable}
                    onClick={() => addToCart(item)}
                    className={`w-full py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
                      item.isAvailable 
                        ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white' 
                        : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
            <div className="p-8 border-b bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                Your Order
                <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">{cart.length}</span>
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {cart.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                  </div>
                  <p className="text-slate-400 font-medium italic">Your cart is empty.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-sm leading-tight">{item.name}</h4>
                        <p className="text-xs text-indigo-600 font-bold mt-1">RM {(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 border">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-red-500"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-700">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input 
                      type="text"
                      placeholder="Special instructions (optional)..."
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-medium text-slate-600 placeholder:text-slate-300 focus:ring-1 focus:ring-indigo-100"
                      value={item.note}
                      onChange={(e) => updateNote(item.id, e.target.value)}
                    />
                  </div>
                ))
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Grand Total</span>
                <span className="text-3xl font-black text-indigo-950">RM {total.toFixed(2)}</span>
              </div>
              
              <button
                disabled={cart.length === 0}
                onClick={() => setShowCheckout(true)}
                className={`w-full py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 ${
                  cart.length > 0 
                    ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                Checkout Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-800">Complete Your Order</h2>
                <button onClick={() => setShowCheckout(false)} className="text-slate-400 hover:text-slate-800 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="space-y-8">
                {/* Order Type */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dining Option</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['Dine-in', 'Takeaway'] as OrderType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setOrderType(type)}
                        className={`py-4 rounded-2xl font-black text-sm border-2 transition-all ${
                          orderType === type ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Selection for Dine-in */}
                {orderType === 'Dine-in' && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Table Number</label>
                    <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
                        <button
                          key={num}
                          onClick={() => setTableNumber(num)}
                          className={`py-2 rounded-xl text-xs font-black transition-all ${
                            tableNumber === num ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['Cash', 'Online Payment'] as PaymentMethod[]).map(method => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-4 rounded-2xl font-black text-sm border-2 transition-all ${
                          paymentMethod === method ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => setShowCheckout(false)}
                className="flex-1 py-4 text-slate-500 font-black text-sm hover:text-slate-800 transition-colors"
              >
                Go Back
              </button>
              <button 
                onClick={handlePlaceOrderClick}
                className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Place Order • RM {total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && activeOrder && (
        <div className="fixed inset-0 bg-indigo-950 z-[110] flex items-center justify-center p-4">
          <div className="text-center space-y-8 max-w-md">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto border border-white/20 animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black text-white">Order Received!</h2>
              <p className="text-indigo-200 font-medium">Your order #{(activeOrder.id).slice(-6)} is being prepared. Grab a seat and enjoy the vibes!</p>
            </div>
            
            <button 
              onClick={() => setShowSuccess(false)}
              className="bg-white text-indigo-950 px-10 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-2xl"
            >
              Back to Menu
            </button>
            
            <div className="pt-8">
              <button 
                onClick={() => setShowActiveReceipt(true)}
                className="text-indigo-300 text-xs font-black uppercase tracking-widest hover:text-white transition-colors underline underline-offset-8"
              >
                View Digital Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[150] flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm aspect-square relative rounded-[2.5rem] overflow-hidden border-2 border-white/20 shadow-2xl">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanner Frame Overlay */}
            <div className="absolute inset-0 border-[40px] border-black/40"></div>
            <div className="absolute top-[40px] left-[40px] right-[40px] bottom-[40px] border-2 border-indigo-400 rounded-2xl animate-pulse"></div>
            
            <div className="absolute bottom-8 left-0 right-0 text-center">
              <p className="bg-white/10 backdrop-blur-md inline-block px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest">Scanning Table QR...</p>
            </div>
          </div>
          
          <button 
            onClick={stopScanner}
            className="mt-10 px-10 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-black text-sm hover:bg-white/20 transition-all"
          >
            Cancel Scanning
          </button>
          
          <p className="mt-6 text-white/40 text-xs font-medium max-w-xs text-center">Point your camera at the QR code sticker located on your table.</p>
        </div>
      )}

      {/* Floating Receipt Button (if active order exists) */}
      {activeOrder && !showSuccess && (
        <button 
          onClick={() => setShowActiveReceipt(true)}
          className="fixed bottom-8 right-8 bg-indigo-600 text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all z-40 group"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-black py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">View Current Order</span>
        </button>
      )}

      {/* Order Receipt Modal */}
      {showActiveReceipt && activeOrder && (
        <Receipt order={activeOrder} onClose={() => setShowActiveReceipt(false)} />
      )}
    </div>
  );
};

// Fixes: Error in file App.tsx on line 5: Module '"..."' has no default export.
export default CustomerPortal;
