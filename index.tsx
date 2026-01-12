
/**
 * PURE VANILLA JS ORDERING SYSTEM
 * No React, No Pictures, No TypeScript Syntax.
 */

// --- CONFIG & DATA ---
const CATEGORIES = ['All', 'Main Course', 'Noodles', 'Appetizer', 'Snacks', 'Dessert', 'Beverage'];

const INITIAL_MENU = [
  { id: '1', name: 'Nasi Lemak Ayam Berempah', description: 'Fragrant coconut rice, crispy spiced fried chicken, sambal, anchovies.', price: 15.90, category: 'Main Course', class: 'icon-main' },
  { id: '2', name: 'Char Kway Teow', description: 'Stir-fried flat rice noodles with prawns, eggs, and wok hei.', price: 12.50, category: 'Noodles', class: 'icon-noodle' },
  { id: '3', name: 'Satay Ayam (10 Sticks)', description: 'Grilled chicken skewers with peanut sauce, cucumber, and onions.', price: 18.00, category: 'Appetizer', class: 'icon-appetizer' },
  { id: '4', name: 'Beef Rendang', description: 'Tender beef slow-cooked in rich coconut milk and caramelized spices.', price: 18.90, category: 'Main Course', class: 'icon-main' },
  { id: '5', name: 'Mee Goreng Mamak', description: 'Spicy stir-fried yellow noodles with tofu, potatoes, and squid sambal.', price: 11.50, category: 'Noodles', class: 'icon-noodle' },
  { id: '6', name: 'Teh Tarik', description: 'Classic Malaysian pulled milk tea, frothy and sweet.', price: 3.50, category: 'Beverage', class: 'icon-beverage' },
  { id: '7', name: 'Sirap Bandung', description: 'Rose syrup mixed with evaporated milk, served chilled.', price: 4.00, category: 'Beverage', class: 'icon-beverage' },
  { id: '8', name: 'Cendol', description: 'Shaved ice with green rice jellies, coconut milk, and palm sugar.', price: 6.50, category: 'Dessert', class: 'icon-dessert' },
  { id: '9', name: 'Roti Canai', description: 'Flaky Malaysian flatbread served with dhal curry.', price: 4.50, category: 'Snacks', class: 'icon-snack' }
];

// --- APP STATE ---
let state: any = {
  view: 'customer',
  selectedCategory: 'All',
  menu: [...INITIAL_MENU.map(m => ({ ...m, isAvailable: true }))],
  cart: [], // Array of { id, quantity, note }
  orders: [],
  tableNumber: null,
  showCheckout: false,
  showSuccess: false,
  showReceipt: null 
};

// --- DATA PERSISTENCE ---
function saveData() {
  localStorage.setItem('luna_vanilla_v1', JSON.stringify({
    menu: state.menu,
    orders: state.orders
  }));
}

function loadData() {
  const saved = localStorage.getItem('luna_vanilla_v1');
  if (saved) {
    const parsed = JSON.parse(saved);
    state.menu = parsed.menu || state.menu;
    state.orders = parsed.orders || state.orders;
  }
}

// --- CORE RENDERER ---
function render() {
  const main = document.getElementById('main-content');
  const modal = document.getElementById('modal-container');
  if (!main || !modal) return;

  // Update Nav
  const btnCustomer = document.getElementById('view-customer');
  const btnStaff = document.getElementById('view-staff');
  if (btnCustomer && btnStaff) {
    btnCustomer.className = `px-5 py-2 rounded-full transition-all ${state.view === 'customer' ? 'bg-indigo-600 shadow-lg scale-105' : 'opacity-50 hover:opacity-100'}`;
    btnStaff.className = `px-5 py-2 rounded-full transition-all ${state.view === 'staff' ? 'bg-indigo-600 shadow-lg scale-105' : 'opacity-50 hover:opacity-100'}`;
  }

  main.innerHTML = '';
  modal.innerHTML = '';

  if (state.view === 'customer') {
    renderCustomer(main);
  } else {
    renderStaff(main);
  }

  renderModals(modal);
  saveData();
}

// Global setState to trigger re-renders
// Fix: Use any cast for window to allow custom property assignment (Error on line 79)
(window as any).updateState = (update: any) => {
  state = { ...state, ...update };
  render();
};

// --- GLOBAL ACTIONS ---
// Fix: Use any cast for window to allow custom property assignment (Error on line 85)
(window as any).addToCart = (id: string) => {
  const item = state.menu.find((i: any) => i.id === id);
  if (!item.isAvailable) return;

  const existing = state.cart.find((c: any) => c.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ id, quantity: 1, note: '' });
  }
  render();
};

// Fix: Use any cast for window to allow custom property assignment (Error on line 98)
(window as any).updateQty = (id: string, delta: number) => {
  const idx = state.cart.findIndex((c: any) => c.id === id);
  if (idx > -1) {
    state.cart[idx].quantity += delta;
    if (state.cart[idx].quantity <= 0) state.cart.splice(idx, 1);
  }
  render();
};

// Fix: Use any cast for window to allow custom property assignment (Error on line 107)
(window as any).updateNote = (id: string, note: string) => {
  const item = state.cart.find((c: any) => c.id === id);
  if (item) item.note = note;
  // No re-render for input to avoid focus loss
};

// Fix: Use any cast for window to allow custom property assignment (Error on line 113)
(window as any).placeOrder = () => {
  const orderItems = state.cart.map((c: any) => {
    const m = state.menu.find((item: any) => item.id === c.id);
    return { ...m, ...c };
  });

  const total = orderItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
  
  const newOrder = {
    id: 'LUNA-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    items: orderItems,
    total,
    tableNumber: state.tableNumber || 'Takeaway',
    status: 'Pending',
    timestamp: new Date().toISOString()
  };

  state.orders.unshift(newOrder);
  state.cart = [];
  state.showCheckout = false;
  state.showSuccess = true;
  render();
};

// Fix: Use any cast for window to allow custom property assignment (Error on line 137)
(window as any).updateOrderStatus = (id: string, status: string) => {
  const order = state.orders.find((o: any) => o.id === id);
  if (order) order.status = status;
  render();
};

// Fix: Use any cast for window to allow custom property assignment (Error on line 143)
(window as any).toggleItemStock = (id: string) => {
  const item = state.menu.find((m: any) => m.id === id);
  if (item) item.isAvailable = !item.isAvailable;
  render();
};

// --- COMPONENT RENDERERS ---
function renderCustomer(container: HTMLElement) {
  const filteredMenu = state.menu.filter((i: any) => state.selectedCategory === 'All' || i.category === state.selectedCategory);
  const subtotal = state.cart.reduce((acc: number, c: any) => {
    const item = state.menu.find((m: any) => m.id === c.id);
    return acc + (item.price * c.quantity);
  }, 0);

  container.innerHTML = `
    <div class="max-w-6xl mx-auto px-6 py-12 pb-48">
      <header class="mb-16">
        <h1 class="text-6xl font-black text-indigo-950 tracking-tighter mb-2">The Luna Shop</h1>
        <p class="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Pure Malaysian Culinary Arts</p>
      </header>

      <div class="flex gap-2.5 overflow-x-auto no-scrollbar mb-12">
        ${CATEGORIES.map(cat => `
          <button onclick="updateState({selectedCategory: '${cat}'})" class="px-6 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap ${state.selectedCategory === cat ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white border text-slate-400'}">${cat}</button>
        `).join('')}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          ${filteredMenu.map((item: any) => `
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between min-h-[280px]">
              <div>
                <div class="flex justify-between items-start mb-6">
                  <div class="w-16 h-16 dish-icon ${item.class || 'icon-main'} text-xl">${item.name[0]}</div>
                  <span class="font-black text-indigo-600 text-lg">RM ${item.price.toFixed(2)}</span>
                </div>
                <span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 block">${item.category}</span>
                <h3 class="text-2xl font-black text-slate-800 mb-2 leading-tight">${item.name}</h3>
                <p class="text-sm text-slate-400 font-medium leading-relaxed mb-6">${item.description}</p>
              </div>
              <button 
                onclick="addToCart('${item.id}')"
                ${!item.isAvailable ? 'disabled' : ''}
                class="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${item.isAvailable ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}"
              >
                ${item.isAvailable ? 'Add to cart' : 'Sold Out'}
              </button>
            </div>
          `).join('')}
        </div>

        <div class="lg:col-span-1">
          <div class="sticky top-24 bg-indigo-950 rounded-[2.5rem] text-white p-10 shadow-2xl flex flex-col min-h-[500px]">
            <h2 class="text-3xl font-black mb-10 flex items-center justify-between">Cart <span class="text-xs bg-indigo-500 px-3 py-1 rounded-full">${state.cart.length}</span></h2>
            
            <div class="flex-1 space-y-8 overflow-y-auto no-scrollbar max-h-[400px]">
              ${state.cart.length === 0 ? '<p class="text-indigo-400 font-black italic opacity-30 mt-10">Empty cart...</p>' : ''}
              ${state.cart.map((c: any) => {
                const item = state.menu.find((m: any) => m.id === c.id);
                return `
                  <div class="space-y-4 fade-in">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <p class="font-black text-sm">${item.name}</p>
                        <p class="text-[10px] text-indigo-400 font-bold">RM ${(item.price * c.quantity).toFixed(2)}</p>
                      </div>
                      <div class="flex items-center gap-3 bg-white/10 p-1.5 rounded-xl">
                        <button onclick="updateQty('${c.id}', -1)" class="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded font-bold">-</button>
                        <span class="text-xs font-black w-4 text-center">${c.quantity}</span>
                        <button onclick="updateQty('${c.id}', 1)" class="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded font-bold">+</button>
                      </div>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Any special requests? (No spicy, etc.)" 
                      class="w-full bg-white/5 border-none rounded-xl px-4 py-2.5 text-[10px] focus:ring-1 focus:ring-indigo-400 text-white placeholder:text-white/20"
                      onchange="updateNote('${c.id}', this.value)"
                      value="${c.note}"
                    />
                  </div>
                `;
              }).join('')}
            </div>

            <div class="pt-8 mt-8 border-t border-white/10 space-y-6">
              <div class="flex justify-between items-end">
                <span class="text-[10px] font-black uppercase opacity-40">Subtotal</span>
                <span class="text-3xl font-black">RM ${subtotal.toFixed(2)}</span>
              </div>
              <button 
                onclick="updateState({showCheckout: true})"
                ${state.cart.length === 0 ? 'disabled' : ''}
                class="w-full py-5 rounded-2xl bg-white text-indigo-950 font-black text-sm shadow-xl hover:bg-indigo-50 transition-all disabled:opacity-10"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStaff(container: HTMLElement) {
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-6 py-12">
      <div class="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
        <div>
          <h2 class="text-4xl font-black text-indigo-950">Luna Staff</h2>
          <p class="text-slate-400 font-bold">Live Order Management Dashboard</p>
        </div>
        <button onclick="if(confirm('Reset all records?')){ updateState({orders: []}); }" class="text-[10px] font-black text-red-500 bg-red-50 px-5 py-2.5 rounded-xl border border-red-100 uppercase tracking-widest">Reset System</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${state.orders.map((order: any) => `
          <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-in slide-in-from-bottom-4 duration-300">
            <div class="p-8 border-b bg-slate-50/50 flex justify-between items-start">
              <div>
                <span class="text-[9px] font-black text-indigo-500 uppercase block mb-1">#${order.id.slice(-6)}</span>
                <h3 class="text-xl font-black text-slate-800">${order.tableNumber === 'Takeaway' ? 'Pickup' : 'Table ' + order.tableNumber}</h3>
              </div>
              <span class="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-600 text-[9px] font-black uppercase">${order.status}</span>
            </div>
            
            <div class="p-8 flex-1 space-y-5">
              ${order.items.map((item: any) => `
                <div class="flex justify-between text-sm">
                  <div class="flex-1">
                    <p class="font-black text-slate-700">${item.quantity}x ${item.name}</p>
                    ${item.note ? `<p class="text-[10px] text-indigo-500 font-bold italic mt-1 leading-tight">“${item.note}”</p>` : ''}
                  </div>
                  <span class="text-slate-400 font-bold">RM ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>

            <div class="p-8 bg-slate-50 border-t space-y-3">
              <div class="grid grid-cols-2 gap-2">
                ${['Preparing', 'Ready', 'Delivered'].map(s => `
                  <button onclick="updateOrderStatus('${order.id}', '${s}')" class="py-3 rounded-2xl text-[10px] font-black border transition-all ${order.status === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 hover:border-indigo-600'}">${s}</button>
                `).join('')}
                <button onclick="updateState({showReceipt: '${order.id}'})" class="py-3 rounded-2xl text-[10px] font-black bg-white border text-slate-800 hover:bg-slate-50">Receipt</button>
              </div>
            </div>
          </div>
        `).join('')}
        ${state.orders.length === 0 ? '<div class="col-span-full py-40 text-center text-slate-200 font-black uppercase tracking-[0.4em]">Waiting for orders...</div>' : ''}
      </div>

      <div class="mt-24">
        <h2 class="text-2xl font-black text-slate-800 mb-8">Inventory Management</h2>
        <div class="bg-white rounded-[2.5rem] border overflow-hidden shadow-sm">
          <table class="w-full text-left">
            <thead class="bg-slate-50/80">
              <tr>
                <th class="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dish Item</th>
                <th class="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Availability</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${state.menu.map((item: any) => `
                <tr class="hover:bg-slate-50/30 transition-colors">
                  <td class="px-10 py-6">
                    <p class="font-black text-slate-800">${item.name}</p>
                    <p class="text-[9px] text-indigo-400 font-black uppercase">${item.category}</p>
                  </td>
                  <td class="px-10 py-6 text-right">
                    <button onclick="toggleItemStock('${item.id}')" class="px-6 py-2.5 rounded-full text-[10px] font-black transition-all ${item.isAvailable ? 'bg-emerald-500 text-white shadow-md' : 'bg-red-500 text-white shadow-md'}">${item.isAvailable ? 'AVAILABLE' : 'OUT'}</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderModals(container: HTMLElement) {
  if (state.showCheckout) {
    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-6">
        <div class="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
          <div class="p-10 border-b flex justify-between items-center">
            <h2 class="text-3xl font-black text-indigo-950">Confirmation</h2>
            <button onclick="updateState({showCheckout: false})" class="text-slate-300 hover:text-slate-900 text-xl">✕</button>
          </div>
          <div class="p-10 space-y-8">
            <div>
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Service Type</label>
              <div class="grid grid-cols-2 gap-4">
                <button onclick="updateState({tableNumber: 1})" class="py-4 rounded-2xl border-2 font-black transition-all ${state.tableNumber ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}">Dine-In</button>
                <button onclick="updateState({tableNumber: null})" class="py-4 rounded-2xl border-2 font-black transition-all ${!state.tableNumber ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}">Takeaway</button>
              </div>
            </div>
            
            ${state.tableNumber ? `
              <div class="fade-in">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Select Your Table</label>
                <div class="grid grid-cols-5 gap-2.5">
                  ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => `
                    <button onclick="updateState({tableNumber: ${n}})" class="py-3 rounded-xl font-black text-xs transition-all ${state.tableNumber === n ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}">${n}</button>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          <div class="p-10 bg-slate-50">
            <button onclick="placeOrder()" class="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Send to Kitchen</button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.showSuccess) {
    container.innerHTML = `
      <div class="fixed inset-0 bg-indigo-950 z-[300] flex items-center justify-center p-6 text-center">
        <div class="space-y-10 max-w-md fade-in">
          <div class="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center mx-auto text-white text-4xl font-bold">✓</div>
          <h2 class="text-5xl font-black text-white leading-tight">Done!</h2>
          <p class="text-indigo-200 font-medium text-lg">Your order is cooking. Please stay at your table.</p>
          <button onclick="updateState({showSuccess: false})" class="bg-white text-indigo-950 px-14 py-5 rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all">Return to Menu</button>
        </div>
      </div>
    `;
  }

  if (state.showReceipt) {
    const order = state.orders.find((o: any) => o.id === state.showReceipt);
    if (!order) return;
    
    container.innerHTML = `
      <div class="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-center justify-center p-6">
        <div class="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 flex flex-col max-h-[90vh]">
          <div class="bg-indigo-900 p-12 text-center text-white relative flex flex-col items-center">
             <button onclick="updateState({showReceipt: null})" class="absolute top-6 right-6 text-white/30 hover:text-white text-xl">✕</button>
             <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-950 font-black text-3xl mb-4 italic shadow-lg">L</div>
             <h3 class="text-2xl font-black tracking-tighter">The Luna Shop</h3>
             <p class="text-[9px] text-indigo-300 font-black uppercase tracking-[0.2em] mt-2">Paperless Receipt</p>
          </div>
          <div class="flex-1 overflow-y-auto p-12 space-y-10 no-scrollbar">
            <div class="flex justify-between border-b border-dashed border-slate-200 pb-10">
              <div><p class="text-[9px] font-black text-slate-300 uppercase mb-1">ID</p><p class="font-black text-indigo-950">#${order.id.slice(-6)}</p></div>
              <div class="text-right"><p class="text-[9px] font-black text-slate-300 uppercase mb-1">Type</p><p class="font-black text-slate-800">${order.tableNumber === 'Takeaway' ? 'Pickup' : 'Table ' + order.tableNumber}</p></div>
            </div>
            
            <div class="space-y-6">
              ${order.items.map((item: any) => `
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <p class="text-sm font-black text-slate-800">${item.quantity}x ${item.name}</p>
                    ${item.note ? `<p class="text-[10px] text-slate-400 italic font-medium">“${item.note}”</p>` : ''}
                  </div>
                  <span class="text-sm font-black text-indigo-950">RM ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>

            <div class="pt-10 border-t border-slate-100 space-y-2">
              <div class="flex justify-between text-slate-400 font-bold text-xs"><span>Subtotal</span><span>RM ${(order.total * 0.94).toFixed(2)}</span></div>
              <div class="flex justify-between text-slate-400 font-bold text-xs"><span>Service Tax (6%)</span><span>RM ${(order.total * 0.06).toFixed(2)}</span></div>
              <div class="flex justify-between items-end pt-6">
                <span class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total Bill</span>
                <span class="text-4xl font-black text-indigo-950">RM ${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div class="pt-12 text-center pb-4">
              <p class="text-[10px] text-slate-200 font-black uppercase tracking-[0.3em] italic">Terima Kasih!</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// --- INITIALIZE ---
const init = () => {
  const btnC = document.getElementById('view-customer');
  const btnS = document.getElementById('view-staff');
  // Fix: Use any cast for window to allow custom property calls (Error on line 428)
  if (btnC) btnC.onclick = () => (window as any).updateState({ view: 'customer' });
  // Fix: Use any cast for window to allow custom property calls (Error on line 429)
  if (btnS) btnS.onclick = () => (window as any).updateState({ view: 'staff' });

  loadData();
  render();
};

init();
