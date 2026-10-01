import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Send, 
  Receipt, 
  CreditCard, 
  DollarSign, 
  Utensils, 
  Flame, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  Users,
  Percent,
  Sparkles
} from 'lucide-react';

export default function TableOrderModal({ 
  table, 
  menuItems = [], 
  onClose, 
  onSaveOrder, 
  onCheckout 
}) {
  const [activeTab, setActiveTab] = useState('comanda'); // 'comanda' | 'cuenta'
  const [mobileSubTab, setMobileSubTab] = useState('menu'); // 'menu' | 'ticket'
  const [selectedCourse, setSelectedCourse] = useState('Plato Fuerte'); // 'Entrada' | 'Plato Fuerte' | 'Postre' | 'Bebida'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('Todas');
  
  // Orden actual de la mesa (items existentes o nuevo)
  const [items, setItems] = useState(table.order?.items || []);
  const [customNote, setCustomNote] = useState('');
  const [guestsCount, setGuestsCount] = useState(table.comensales || 2);
  const [selectedTipPercent, setSelectedTipPercent] = useState(15);
  const [splitCount, setSplitCount] = useState(table.comensales || 2);
  const [paymentMethod, setPaymentMethod] = useState('Tarjeta'); // 'Tarjeta' | 'Efectivo MXN' | 'Dólares USD'

  // Opciones rápidas de notas de cocina para Porto Brezza
  const quickNotes = [
    'Sin cebolla', 
    'Burrata extra', 
    'Masa bien tostada', 
    'Al centro para compartir', 
    'Salsa picante aparte', 
    'Maridaje recomendado'
  ];

  // Agregar platillo a la comanda
  const handleAddItem = (dish) => {
    const existingIndex = items.findIndex(
      i => i.id === dish.id && i.tiempo === selectedCourse && i.nota === (customNote || '')
    );

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].cantidad += 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          id: dish.id,
          nombre: dish.nombre,
          precio: dish.precio,
          categoria: dish.categoria,
          tiempo: selectedCourse,
          nota: customNote,
          cantidad: 1,
          horaAgregado: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setCustomNote('');
    }
  };

  // Modificar cantidad
  const handleQuantityChange = (index, delta) => {
    const updated = [...items];
    const newQty = updated[index].cantidad + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].cantidad = newQty;
    }
    setItems(updated);
  };

  // Eliminar item
  const handleRemoveItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // Cálculos financieros
  const subtotal = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const tipAmount = Math.round(subtotal * (selectedTipPercent / 100));
  const total = subtotal + tipAmount;
  const exchangeRateUSD = 18.20;
  const totalUSD = (total / exchangeRateUSD).toFixed(2);
  const perPerson = splitCount > 0 ? (total / splitCount).toFixed(2) : total;

  // Filtrado de menú
  const filteredDishes = menuItems.filter(dish => {
    const matchesCategory = activeMenuCategory === 'Todas' ? true : 
      dish.categoria?.toLowerCase().includes(activeMenuCategory.toLowerCase());
    const matchesSearch = searchTerm.trim() === '' ? true :
      dish.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && dish.disponible !== false;
  });

  // Guardar y enviar comanda a cocina
  const handleSendToKitchen = () => {
    onSaveOrder({
      tableId: table.id,
      comensales: guestsCount,
      items,
      subtotal,
      estadoMesa: 'OCUPADA'
    });
  };

  // Finalizar cobro y liberar mesa
  const handleCompletePayment = () => {
    onCheckout({
      tableId: table.id,
      subtotal,
      propina: tipAmount,
      total,
      metodoPago: paymentMethod,
      items
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-1 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAF7F2] w-full max-w-5xl rounded-sm shadow-2xl border border-[#D8CFC2] overflow-hidden flex flex-col h-[96dvh] sm:h-auto sm:max-h-[92vh]">
        
        {/* Encabezado del Comandero */}
        <div className="bg-[#1C1613] text-white px-3.5 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between border-b border-[#3A2E28] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#6E1B24] border border-[#B88E3E] flex items-center justify-center font-serif-luxury text-base sm:text-lg font-bold text-white shrink-0">
              {table.numero}
            </span>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-serif-luxury text-base sm:text-xl font-bold tracking-wide">
                  Mesa {table.numero}
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] uppercase tracking-widest bg-[#2E241F] text-[#D4B26F] border border-[#48372E] rounded-xs font-medium">
                  {table.zona}
                </span>
                {table.reservaNombre && (
                  <span className="px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] uppercase tracking-wider bg-[#1A382B] text-[#86EFAC] rounded-xs font-medium flex items-center gap-1">
                    <Sparkles size={10} /> {table.reservaNombre}
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#A69B8F]">
                {table.order?.items?.length ? `Comanda activa • ${items.length} tiempos/ítems` : 'Nueva comanda'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Pestañas: Comanda vs Cuenta */}
            <div className="flex bg-[#28201B] p-0.5 rounded-xs border border-[#3E3129] mr-1 sm:mr-2">
              <button
                onClick={() => setActiveTab('comanda')}
                className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer ${
                  activeTab === 'comanda' 
                    ? 'bg-[#6E1B24] text-white' 
                    : 'text-[#A69B8F] hover:text-white'
                }`}
              >
                Comanda
              </button>
              <button
                onClick={() => setActiveTab('cuenta')}
                disabled={items.length === 0}
                className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer disabled:opacity-40 ${
                  activeTab === 'cuenta' 
                    ? 'bg-[#B88E3E] text-[#14100E]' 
                    : 'text-[#A69B8F] hover:text-white'
                }`}
              >
                Cuenta (${subtotal})
              </button>
            </div>

            <button 
              onClick={onClose}
              className="p-1.5 text-[#A69B8F] hover:text-white hover:bg-[#2C231E] rounded-xs transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CONTENIDO: MODO COMANDA */}
        {activeTab === 'comanda' ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Sub-navegación móvil para meseros */}
            <div className="lg:hidden flex bg-[#EAE3D6] p-1 border-b border-[#D8CFC2] shrink-0">
              <button
                onClick={() => setMobileSubTab('menu')}
                className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-bold rounded-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  mobileSubTab === 'menu' ? 'bg-[#1A382B] text-white shadow-xs' : 'text-[#635A53]'
                }`}
              >
                <Utensils size={13} /> 1. Platillos
              </button>
              <button
                onClick={() => setMobileSubTab('ticket')}
                className={`flex-1 py-2 text-[11px] uppercase tracking-wider font-bold rounded-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  mobileSubTab === 'ticket' ? 'bg-[#6E1B24] text-white shadow-xs' : 'text-[#635A53]'
                }`}
              >
                <Receipt size={13} /> 2. Comanda ({items.reduce((acc, i) => acc + i.cantidad, 0)}) • ${subtotal}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
            
            {/* COLUMNA IZQUIERDA: Selector de Platillos de la Carta (7 cols) */}
            <div className={`${mobileSubTab === 'menu' ? 'flex' : 'hidden'} lg:flex lg:col-span-7 p-3 sm:p-5 border-r border-[#E8DFCFC0] flex-col overflow-y-auto flex-1`}>
              
              {/* Barra de Filtros y Búsqueda */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Buscar pizza, pasta, vino..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#DDD5C7] rounded-xs focus:outline-none focus:border-[#B88E3E]"
                  />
                  <div className="flex items-center gap-1 text-xs text-[#6A6057] bg-white border border-[#DDD5C7] px-2.5 py-2 rounded-xs">
                    <Users size={12} className="text-[#B88E3E]" />
                    <span>Comensales:</span>
                    <select 
                      value={guestsCount} 
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                      className="font-bold bg-transparent focus:outline-none ml-1 cursor-pointer"
                    >
                      {[1,2,3,4,5,6,8,10,12].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Categorías de Menú */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {['Todas', 'Pizza', 'Pasta', 'Focaccia', 'Postre', 'Bebida'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveMenuCategory(cat)}
                      className={`px-2.5 py-1 rounded-xs uppercase tracking-wider transition-colors cursor-pointer ${
                        activeMenuCategory === cat
                          ? 'bg-[#1A382B] text-white font-semibold'
                          : 'bg-white border border-[#DDD5C7] text-[#635A53] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Selector de Tiempo de Cocina */}
                <div className="flex items-center justify-between bg-[#F4EFE6] px-3 py-2 rounded-xs border border-[#E4DBD0]">
                  <span className="text-[11px] uppercase tracking-wider text-[#635A53] font-semibold flex items-center gap-1.5">
                    <Clock size={12} className="text-[#B88E3E]" /> Tiempo a servir:
                  </span>
                  <div className="flex gap-1">
                    {['Entrada', 'Plato Fuerte', 'Postre', 'Bebida'].map(t => (
                      <button
                        key={t}
                        onClick={() => setSelectedCourse(t)}
                        className={`px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-xs transition-colors cursor-pointer ${
                          selectedCourse === t 
                            ? 'bg-[#6E1B24] text-white shadow-xs' 
                            : 'bg-white text-[#635A53] hover:bg-[#EBE2D5] border border-[#DDD5C7]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lista de Platillos (Grid táctil para meseros) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 overflow-y-auto pr-1">
                {filteredDishes.map(dish => (
                  <button
                    key={dish.id}
                    onClick={() => handleAddItem(dish)}
                    className="text-left p-3 rounded-xs bg-white border border-[#E3DBD0] hover:border-[#B88E3E] hover:shadow-sm transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <h4 className="font-serif-luxury font-bold text-sm text-[#1C1816] group-hover:text-[#6E1B24] transition-colors leading-tight">
                          {dish.nombre}
                        </h4>
                        <span className="text-xs font-mono font-bold text-[#6E1B24] shrink-0">
                          ${dish.precio}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7A7067] line-clamp-2 leading-relaxed font-light">
                        {dish.descripcion}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#F2ECE1] flex items-center justify-between text-[9px] uppercase tracking-wider text-[#A69B8F]">
                      <span className="text-[#B88E3E] font-medium">{dish.categoria}</span>
                      <span className="text-[#1A382B] group-hover:underline font-bold flex items-center gap-0.5">
                        <Plus size={10} /> Añadir
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Notas Rápidas para Cocina */}
              <div className="mt-3 pt-3 border-t border-[#E8DFCFC0]">
                <span className="text-[10px] uppercase tracking-wider text-[#635A53] font-semibold block mb-1.5">
                  Notas culinarias o términos para el siguiente platillo:
                </span>
                <div className="flex flex-wrap gap-1 mb-2">
                  {quickNotes.map(n => (
                    <button
                      key={n}
                      onClick={() => setCustomNote(prev => prev ? `${prev}, ${n}` : n)}
                      className="px-2 py-0.5 text-[9px] bg-white border border-[#DDD5C7] rounded-xs text-[#524943] hover:bg-[#F2ECE1] cursor-pointer"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Instrucción especial (ej: sin queso, término medio, etc.)..."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded-xs focus:outline-none focus:border-[#B88E3E]"
                />
              </div>

            </div>

            {/* COLUMNA DERECHA: Ticket de Comanda Actual (5 cols) */}
            <div className={`${mobileSubTab === 'ticket' ? 'flex' : 'hidden'} lg:flex lg:col-span-5 bg-[#FBF9F5] p-3 sm:p-5 flex-col justify-between overflow-y-auto flex-1`}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E3DBD0] mb-3">
                  <div className="flex items-center gap-1.5">
                    <Receipt size={15} className="text-[#6E1B24]" />
                    <h4 className="font-serif-luxury text-base font-bold text-[#1C1816]">
                      Comanda en Proceso
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-[#7A7067]">
                    {items.reduce((acc, i) => acc + i.cantidad, 0)} artículos
                  </span>
                </div>

                {/* Lista de Ítems en la Comanda */}
                {items.length === 0 ? (
                  <div className="text-center py-12 text-[#9E948A]">
                    <Utensils size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No hay platillos en la orden.</p>
                    <p className="text-[10px] mt-1">Selecciona platillos de la carta a la izquierda.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white p-2.5 rounded-xs border border-[#E5DFD4] flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 text-[8px] uppercase tracking-wider font-bold rounded-xs bg-[#F4EFE6] text-[#6E1B24] border border-[#E3DBD0]">
                              {item.tiempo}
                            </span>
                            <span className="text-xs font-bold text-[#1C1816] truncate">
                              {item.nombre}
                            </span>
                          </div>
                          {item.nota && (
                            <p className="text-[10px] text-[#B88E3E] italic mt-0.5 truncate">
                              Nota: {item.nota}
                            </p>
                          )}
                          <span className="text-[10px] text-[#7A7067] font-mono">
                            ${item.precio} c/u
                          </span>
                        </div>

                        {/* Botones de Cantidad */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleQuantityChange(idx, -1)}
                            className="w-6 h-6 rounded-xs bg-[#F4EFE6] hover:bg-[#EBE2D5] text-[#524943] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-5 text-center font-bold text-xs font-mono">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(idx, 1)}
                            className="w-6 h-6 rounded-xs bg-[#F4EFE6] hover:bg-[#EBE2D5] text-[#524943] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="w-6 h-6 rounded-xs text-[#EF4444] hover:bg-[#FEE2E2] flex items-center justify-center transition-colors cursor-pointer ml-1"
                            title="Eliminar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pie con Subtotal y Enviar a Cocina */}
              <div className="mt-4 pt-3 border-t border-[#E3DBD0]">
                <div className="flex items-baseline justify-between mb-3 font-mono">
                  <span className="text-xs text-[#7A7067] uppercase tracking-wider">Subtotal:</span>
                  <span className="font-serif-luxury text-xl font-bold text-[#1C1816]">
                    ${subtotal.toLocaleString('es-MX')} MXN
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveTab('cuenta')}
                    disabled={items.length === 0}
                    className="py-2.5 px-3 bg-[#EAE3D6] hover:bg-[#DDD4C4] text-[#1C1816] text-[11px] uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Receipt size={13} /> Ir a Cuenta
                  </button>
                  <button
                    onClick={handleSendToKitchen}
                    disabled={items.length === 0}
                    className="py-2.5 px-3 bg-[#6E1B24] hover:bg-[#58131B] text-white text-[11px] uppercase tracking-wider font-bold rounded-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} /> Mandar a Cocina
                  </button>
                </div>
              </div>

            </div>

            </div>
          </div>
        ) : (
          /* CONTENIDO: MODO CUENTA Y COBRO (SPLIT BILL) */
          <div className="p-6 overflow-y-auto max-w-3xl mx-auto w-full">
            <div className="bg-white border border-[#E3DBD0] p-6 rounded-xs shadow-sm mb-6">
              <div className="text-center pb-4 border-b border-[#EAE3D6] mb-4">
                <h3 className="font-serif-luxury text-2xl font-bold text-[#1C1816]">
                  Porto Brezza • Cuenta Mesa {table.numero}
                </h3>
                <p className="text-xs text-[#7A7067] mt-0.5">
                  Zona {table.zona} • {guestsCount} comensales • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hrs
                </p>
              </div>

              {/* Detalle de ítems */}
              <div className="space-y-2 mb-4 text-xs font-mono">
                {items.map((it, i) => (
                  <div key={i} className="flex justify-between border-b border-dashed border-[#F0EAE1] pb-1">
                    <span>
                      {it.cantidad}x {it.nombre} <span className="text-[#9E948A]">({it.tiempo})</span>
                    </span>
                    <span className="font-bold">${it.precio * it.cantidad}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="flex justify-between text-sm font-mono border-t border-[#E3DBD0] pt-2 mb-3">
                <span className="text-[#635A53]">Subtotal Alimentos & Bebidas:</span>
                <span className="font-bold">${subtotal} MXN</span>
              </div>

              {/* Selector de Propina Sugerida */}
              <div className="bg-[#FAF7F2] p-3 rounded-xs border border-[#E5DFD4] mb-4">
                <label className="text-[11px] uppercase tracking-wider text-[#635A53] font-bold block mb-2 flex items-center gap-1.5">
                  <Percent size={12} className="text-[#B88E3E]" /> Propina Sugerida para el Servicio:
                </label>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[0, 10, 15, 18, 20].map(p => (
                    <button
                      key={p}
                      onClick={() => setSelectedTipPercent(p)}
                      className={`py-1.5 rounded-xs font-mono font-bold transition-all cursor-pointer ${
                        selectedTipPercent === p
                          ? 'bg-[#1A382B] text-white shadow-xs'
                          : 'bg-white border border-[#DDD5C7] text-[#524943] hover:bg-[#EAE3D6]'
                      }`}
                    >
                      {p}% {p > 0 && <span className="block text-[9px] font-normal font-sans text-white/80">${Math.round(subtotal * (p/100))}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total y División de Cuenta */}
              <div className="bg-[#1C1613] text-white p-4 rounded-xs mb-5">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs uppercase tracking-widest text-[#D4B26F] font-semibold">
                    Total a Pagar (inc. propina):
                  </span>
                  <div className="text-right">
                    <span className="font-serif-luxury text-3xl font-bold text-white block">
                      ${total.toLocaleString('es-MX')} MXN
                    </span>
                    <span className="text-[11px] text-[#A69B8F] font-mono">
                      ≈ ${totalUSD} USD (TC: $18.20)
                    </span>
                  </div>
                </div>

                {/* División en Partes Iguales */}
                <div className="pt-3 border-t border-[#382D26] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-[#D4B26F]" />
                    <span>Dividir entre:</span>
                    <select
                      value={splitCount}
                      onChange={(e) => setSplitCount(Number(e.target.value))}
                      className="bg-[#2D231E] border border-[#4D3D33] px-2 py-0.5 rounded-xs text-white font-mono focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                        <option key={n} value={n}>{n} personas</option>
                      ))}
                    </select>
                  </div>
                  <span className="font-mono text-[#86EFAC] font-bold">
                    ${perPerson} MXN c/u
                  </span>
                </div>
              </div>

              {/* Método de Pago */}
              <div className="mb-6">
                <label className="text-[11px] uppercase tracking-wider text-[#635A53] font-bold block mb-2">
                  Método de Pago:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'Tarjeta', icon: CreditCard, label: 'Terminal / Tarjeta' },
                    { id: 'Efectivo MXN', icon: DollarSign, label: 'Efectivo (Pesos)' },
                    { id: 'Dólares USD', icon: DollarSign, label: 'Efectivo (USD)' },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`p-2.5 rounded-xs border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          paymentMethod === m.id
                            ? 'bg-[#FAF7F2] border-[#B88E3E] text-[#1C1816] font-bold ring-1 ring-[#B88E3E]'
                            : 'bg-white border-[#DDD5C7] text-[#635A53] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <Icon size={14} className="text-[#B88E3E]" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Botón de Cobro y Cierre */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('comanda')}
                  className="flex-1 py-3 border border-[#DDD5C7] hover:bg-[#F2ECE1] text-[#1C1816] text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer"
                >
                  Volver a Comanda
                </button>
                <button
                  onClick={handleCompletePayment}
                  className="flex-2 py-3 bg-[#1A382B] hover:bg-[#132A20] text-white text-xs uppercase tracking-[0.2em] font-bold rounded-xs transition-colors cursor-pointer shadow flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Cobrar y Liberar Mesa
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
