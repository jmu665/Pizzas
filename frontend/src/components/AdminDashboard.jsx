import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  SlidersHorizontal,
  Utensils,
  ArrowLeft,
  Lock,
  LogOut,
  ChevronDown,
  Eye,
  EyeOff,
  Flame,
  MessageCircle,
  ExternalLink,
  ChefHat,
  Receipt,
  Plus,
  Wine,
  Sparkles,
  TrendingUp,
  Percent,
  Check,
  DollarSign,
  Coffee,
  Edit3,
  Trash2,
  Save,
  X,
  Camera,
  Upload
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import TableOrderModal from './TableOrderModal';
import KitchenDisplay from './KitchenDisplay';

export default function AdminDashboard({ onExit }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Pestañas Principales: 'mesas' | 'cocina' | 'reservas' | 'menu'
  const [activeTab, setActiveTab] = useState('mesas');
  const [reservations, setReservations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de Mesas y Comandero POS (Conectados a Supabase)
  const [tables, setTables] = useState([]);
  const [selectedTableForOrder, setSelectedTableForOrder] = useState(null);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('TODAS'); // 'TODAS' | 'Terraza' | 'Salón Principal' | 'Barra & Cava'
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableZone, setNewTableZone] = useState('Terraza');
  const [newTableCap, setNewTableCap] = useState(4);

  // Tickets de Cocina KDS
  const [kitchenTickets, setKitchenTickets] = useState(() => {
    const saved = localStorage.getItem('porto_brezza_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  // Total de ventas cobradas REALES en el turno (Corte real)
  const [shiftSales, setShiftSales] = useState(0);

  // Gestor de Carta y Modificación de Precios
  const [editingDish, setEditingDish] = useState(null); // null o el objeto platillo a editar/crear
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState('TODAS');
  const [savingDish, setSavingDish] = useState(false);
  const [quickPriceEditId, setQuickPriceEditId] = useState(null);
  const [quickPriceValue, setQuickPriceValue] = useState('');

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('porto_brezza_tables', JSON.stringify(tables));
  }, [tables]);

  useEffect(() => {
    localStorage.setItem('porto_brezza_tickets', JSON.stringify(kitchenTickets));
  }, [kitchenTickets]);

  useEffect(() => {
    localStorage.setItem('porto_brezza_shift_sales', shiftSales.toString());
  }, [shiftSales]);

  // Filtros de Reservaciones
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  // Validación de PIN
  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === '1234' || pinInput === '2026') {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  // Cargar Reservaciones y Menú desde Supabase
  // Cargar Reservaciones, Menú, Mesas Reales y Ventas del Turno desde Supabase
  const loadData = async () => {
    setRefreshing(true);
    try {
      // 1. Cargar reservaciones
      const { data: resData, error: resErr } = await supabase
        .from('reservas')
        .select('*')
        .order('fecha', { ascending: false })
        .order('hora', { ascending: true });

      if (!resErr && resData) {
        setReservations(resData);
      }

      // 2. Cargar menú
      const { data: menuData, error: menuErr } = await supabase
        .from('menu_items')
        .select('*')
        .order('categoria', { ascending: true })
        .order('precio', { ascending: true });

      if (!menuErr && menuData) {
        setMenuItems(menuData);
      }

      // 3. Cargar mesas físicas reales desde Supabase
      const { data: dbTables, error: tblErr } = await supabase
        .from('mesas')
        .select('*')
        .order('id', { ascending: true });

      if (!tblErr && dbTables && dbTables.length > 0) {
        const formatted = dbTables.map(t => ({
          id: t.id,
          numero: t.numero,
          zona: t.zona,
          capacidad: t.capacidad,
          estado: t.estado || 'LIBRE',
          comensales: t.comensales || 0,
          reservaNombre: t.reserva_nombre,
          tiempoOcupada: t.tiempo_ocupada,
          order: t.order_data
        }));
        setTables(formatted);
      }

      // 4. Cargar ventas reales del turno desde comandas_historico
      const { data: salesData, error: salesErr } = await supabase
        .from('comandas_historico')
        .select('total, fecha')
        .eq('fecha', todayStr);

      if (!salesErr && salesData) {
        const sum = salesData.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
        setShiftSales(sum);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Manejador para guardar comanda y enviar a cocina (persiste en Supabase)
  const handleSaveOrder = async ({ tableId, comensales, items, subtotal, estadoMesa }) => {
    setTables(prev => prev.map(tbl => {
      if (tbl.id === tableId) {
        return {
          ...tbl,
          estado: estadoMesa || 'OCUPADA',
          comensales,
          order: { items, subtotal },
          tiempoOcupada: tbl.tiempoOcupada || 'En servicio'
        };
      }
      return tbl;
    }));

    try {
      await supabase
        .from('mesas')
        .update({
          estado: estadoMesa || 'OCUPADA',
          comensales,
          order_data: { items, subtotal },
          tiempo_ocupada: 'En servicio',
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);
    } catch (e) {
      console.error('Error sincronizando mesa en DB:', e);
    }

    // Enviar a KDS de cocina
    const targetTable = tables.find(t => t.id === tableId);
    if (targetTable && items.length > 0) {
      const newTicket = {
        id: `t-${Date.now()}`,
        tableNumber: targetTable.numero,
        zone: targetTable.zona,
        guests: comensales,
        timeAgo: 'Justo ahora',
        status: 'PENDIENTE',
        items: items.map(i => ({
          nombre: i.nombre,
          cantidad: i.cantidad,
          tiempo: i.tiempo,
          categoria: i.categoria,
          nota: i.nota
        }))
      };
      setKitchenTickets(prev => [newTicket, ...prev]);
    }

    setSelectedTableForOrder(null);
  };

  // Manejador para cobrar y liberar mesa (registra ticket real en comandas_historico)
  const handleCheckout = async ({ tableId, subtotal, propina, total, metodoPago, items }) => {
    const targetTable = tables.find(t => t.id === tableId);

    setTables(prev => prev.map(tbl => {
      if (tbl.id === tableId) {
        return {
          ...tbl,
          estado: 'LIBRE',
          comensales: 0,
          reservaNombre: null,
          tiempoOcupada: null,
          order: null
        };
      }
      return tbl;
    }));

    setShiftSales(prev => prev + total);

    try {
      await supabase
        .from('comandas_historico')
        .insert([{
          mesa_numero: targetTable?.numero || String(tableId),
          zona: targetTable?.zona || 'Salón',
          comensales: targetTable?.comensales || 2,
          items,
          subtotal,
          propina,
          total,
          metodo_pago: metodoPago,
          fecha: todayStr,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

      await supabase
        .from('mesas')
        .update({
          estado: 'LIBRE',
          comensales: 0,
          reserva_nombre: null,
          tiempo_ocupada: null,
          order_data: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);
    } catch (e) {
      console.error('Error al registrar cobro en DB:', e);
    }

    setSelectedTableForOrder(null);
  };

  // Sentar comensal de reservación en una mesa libre (sincronizado con Supabase)
  const handleSeatReservation = async (reserva) => {
    const freeTable = tables.find(t => t.estado === 'LIBRE');
    if (!freeTable) {
      alert('No hay mesas libres disponibles en este momento. Verifique el plano de mesas.');
      return;
    }

    setTables(prev => prev.map(tbl => {
      if (tbl.id === freeTable.id) {
        return {
          ...tbl,
          estado: 'OCUPADA',
          comensales: reserva.personas || 2,
          reservaNombre: reserva.nombre_cliente,
          tiempoOcupada: 'Acaba de llegar',
          order: {
            items: [],
            subtotal: 0
          }
        };
      }
      return tbl;
    }));

    try {
      await supabase
        .from('mesas')
        .update({
          estado: 'OCUPADA',
          comensales: reserva.personas || 2,
          reserva_nombre: reserva.nombre_cliente,
          tiempo_ocupada: 'Acaba de llegar',
          order_data: { items: [], subtotal: 0 },
          updated_at: new Date().toISOString()
        })
        .eq('id', freeTable.id);
    } catch (e) {
      console.error('Error al sentar en DB:', e);
    }

    handleUpdateStatus(reserva.id, 'EN MESA');

    const updatedTable = {
      ...freeTable,
      estado: 'OCUPADA',
      comensales: reserva.personas || 2,
      reservaNombre: reserva.nombre_cliente,
      order: { items: [], subtotal: 0 }
    };
    setSelectedTableForOrder(updatedTable);
    setActiveTab('mesas');
  };

  // Crear nueva mesa física en Supabase
  const handleAddNewTable = async (e) => {
    e.preventDefault();
    if (!newTableNum.trim()) return;

    try {
      const { data, error } = await supabase
        .from('mesas')
        .insert([{
          numero: newTableNum.trim(),
          zona: newTableZone,
          capacidad: Number(newTableCap),
          estado: 'LIBRE'
        }])
        .select();

      if (!error && data && data.length > 0) {
        const newT = {
          id: data[0].id,
          numero: data[0].numero,
          zona: data[0].zona,
          capacidad: data[0].capacidad,
          estado: 'LIBRE',
          comensales: 0,
          order: null
        };
        setTables(prev => [...prev, newT]);
        setShowAddTableModal(false);
        setNewTableNum('');
      } else {
        alert('Error al crear la mesa: Verifique que el número no esté repetido.');
      }
    } catch (err) {
      console.error('Error agregando mesa:', err);
    }
  };

  // Eliminar mesa física de Supabase y del plano
  const handleDeleteTable = async (tableId, tableNum) => {
    if (!window.confirm(`¿Estás seguro de que deseas quitar la Mesa ${tableNum} de la sala? Esta acción no se puede deshacer.`)) return;
    try {
      const { error } = await supabase
        .from('mesas')
        .delete()
        .eq('id', tableId);

      if (!error) {
        setTables(prev => prev.filter(t => t.id !== tableId));
      } else {
        setTables(prev => prev.filter(t => t.id !== tableId));
      }
    } catch (err) {
      console.error('Error eliminando mesa:', err);
      setTables(prev => prev.filter(t => t.id !== tableId));
    }
  };

  // Reiniciar todas las mesas a LIBRE (Empezar turno limpio)
  const handleResetAllTables = async () => {
    if (!window.confirm('¿Desea reiniciar todas las mesas a estado LIBRE para iniciar un nuevo turno limpio?')) return;
    try {
      await supabase
        .from('mesas')
        .update({
          estado: 'LIBRE',
          comensales: 0,
          reserva_nombre: null,
          tiempo_ocupada: null,
          order_data: null,
          updated_at: new Date().toISOString()
        })
        .neq('id', 0);

      setTables(prev => prev.map(t => ({
        ...t,
        estado: 'LIBRE',
        comensales: 0,
        reservaNombre: null,
        tiempoOcupada: null,
        order: null
      })));

      setKitchenTickets([]);
      localStorage.removeItem('porto_brezza_tickets');
    } catch (err) {
      console.error('Error reiniciando turno:', err);
    }
  };

  // Cambiar estado de reservación
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('reservas')
        .update({ estado: newStatus })
        .eq('id', id);

      if (!error) {
        setReservations(prev => 
          prev.map(r => r.id === id ? { ...r, estado: newStatus } : r)
        );
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  // Alternar disponibilidad de platillo
  const handleToggleDishAvailability = async (id, currentAvailable) => {
    const newStatus = !currentAvailable;
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ disponible: newStatus })
        .eq('id', id);

      if (!error) {
        setMenuItems(prev => 
          prev.map(item => item.id === id ? { ...item, disponible: newStatus } : item)
        );
      }
    } catch (err) {
      console.error('Error al actualizar disponibilidad:', err);
    }
  };

  // Guardar platillo (crear o editar existente con precio)
  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!editingDish || !editingDish.nombre || editingDish.precio === undefined || editingDish.precio === '') return;
    setSavingDish(true);

    try {
      const priceNum = parseFloat(editingDish.precio);

      if (editingDish.id && !editingDish.isNew) {
        // Actualizar platillo existente en Supabase
        const { error } = await supabase
          .from('menu_items')
          .update({
            nombre: editingDish.nombre,
            precio: priceNum,
            categoria: editingDish.categoria || 'Pizzas Artesanales',
            descripcion: editingDish.descripcion || '',
            disponible: editingDish.disponible !== false,
            imagen_url: editingDish.imagen_url || null
          })
          .eq('id', editingDish.id);

        if (!error) {
          setMenuItems(prev => prev.map(item => 
            item.id === editingDish.id 
              ? { ...item, ...editingDish, precio: priceNum, imagen_url: editingDish.imagen_url || null } 
              : item
          ));
          setEditingDish(null);
        } else {
          alert('Error al guardar platillo en base de datos: ' + error.message);
        }
      } else {
        // Crear nuevo platillo en Supabase
        const { data, error } = await supabase
          .from('menu_items')
          .insert([{
            restaurante_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
            nombre: editingDish.nombre,
            precio: priceNum,
            categoria: editingDish.categoria || 'Pizzas Artesanales',
            descripcion: editingDish.descripcion || '',
            disponible: true,
            imagen_url: editingDish.imagen_url || null
          }])
          .select();

        if (!error && data && data.length > 0) {
          setMenuItems(prev => [...prev, data[0]]);
          setEditingDish(null);
        } else if (error) {
          alert('Error al crear platillo: ' + error.message);
        }
      }
    } catch (err) {
      console.error('Error al guardar platillo:', err);
      alert('Error inesperado al guardar platillo.');
    } finally {
      setSavingDish(false);
    }
  };

  // Manejo de carga de imagen local desde dispositivo
  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 4MB. Por favor elija una imagen más ligera.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingDish(prev => ({
        ...prev,
        imagen_url: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // Edición rápida de precio directo desde la tarjeta
  const handleQuickPriceSave = async (id) => {
    const newPrice = parseFloat(quickPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      setQuickPriceEditId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ precio: newPrice })
        .eq('id', id);

      if (!error) {
        setMenuItems(prev => prev.map(item => 
          item.id === id ? { ...item, precio: newPrice } : item
        ));
      } else {
        alert('Error al actualizar precio: ' + error.message);
      }
    } catch (err) {
      console.error('Error al actualizar precio:', err);
    } finally {
      setQuickPriceEditId(null);
    }
  };

  // Eliminar platillo de la carta
  const handleDeleteDish = async (id, nombre) => {
    if (!window.confirm(`¿Está seguro de eliminar "${nombre}" de la carta permanentemente?`)) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (!error) {
        setMenuItems(prev => prev.filter(item => item.id !== id));
      } else {
        alert('Error al eliminar platillo: ' + error.message);
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  // Actualizar estado de ticket en KDS
  const handleUpdateTicketStatus = (ticketId, nextStatus) => {
    if (nextStatus === 'DESPACHADO') {
      setKitchenTickets(prev => prev.filter(t => t.id !== ticketId));
    } else {
      setKitchenTickets(prev => prev.map(t => 
        t.id === ticketId ? { ...t, status: nextStatus } : t
      ));
    }
  };

  // Filtrado de mesas por zona
  const filteredTables = tables.filter(t => {
    if (selectedZoneFilter === 'TODAS') return true;
    return t.zona.toLowerCase().includes(selectedZoneFilter.toLowerCase());
  });

  // Métricas del Plano de Mesas
  const occupiedTablesCount = tables.filter(t => t.estado === 'OCUPADA' || t.estado === 'CUENTA').length;
  const currentDinersInRestaurant = tables.reduce((acc, t) => acc + (t.comensales || 0), 0);
  const activeComandasTotal = tables.reduce((acc, t) => acc + (t.order?.subtotal || 0), 0);
  const outOfStockDishes = menuItems.filter(i => !i.disponible).length;

  // Filtrado de reservaciones
  const filteredReservations = reservations.filter(r => {
    const matchesDate = selectedDate ? r.fecha === selectedDate : true;
    const matchesStatus = statusFilter === 'TODAS' ? true : r.estado === statusFilter;
    const matchesSearch = searchTerm.trim() === '' ? true :
      r.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.telefono_cliente?.includes(searchTerm) ||
      r.codigo_reserva?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDate && matchesStatus && matchesSearch;
  });

  // Filtrado de Platillos en el Gestor de Carta
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = menuSearchTerm.trim() === '' ? true :
      item.nombre?.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(menuSearchTerm.toLowerCase()) ||
      item.categoria?.toLowerCase().includes(menuSearchTerm.toLowerCase());

    const matchesCategory = menuCategoryFilter === 'TODAS' ? true :
      item.categoria && item.categoria.toLowerCase().includes(menuCategoryFilter.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // PANTALLA DE ACCESO (LOGIN CON PIN - ESTILO APPLE)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-6 text-[#1D1D1F]">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white/60 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-3xl text-center">
          <div className="mb-6">
            <img 
              src="/Gemini_Generated_Image_78a1e378a1e378a1.jpg" 
              alt="Porto Brezza" 
              className="w-18 h-18 rounded-full object-cover ring-4 ring-black/5 mx-auto mb-3 shadow-md"
            />
            <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
              Porto Brezza
            </h2>
            <span className="text-xs text-[#86868B] font-medium block mt-0.5">
              Panel del Propietario & Gerencia
            </span>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-[#86868B] mb-2 uppercase tracking-wider">
                Ingresa tu PIN de Seguridad
              </label>
              <input
                type="password"
                maxLength="6"
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-[#E5E5EA]/60 border-0 focus:ring-2 focus:ring-[#0071E3] text-center text-3xl tracking-[0.4em] py-3 text-[#1D1D1F] focus:outline-none rounded-2xl font-mono transition-all"
              />
              {pinError && (
                <p className="text-[12px] text-[#FF3B30] mt-2 font-medium">
                  PIN incorrecto. (PIN sugerido: 1234)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs uppercase tracking-wider font-semibold rounded-full transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              Acceder al Sistema
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-black/[0.06] text-center">
            <button
              onClick={onExit}
              className="text-xs text-[#86868B] hover:text-[#1D1D1F] inline-flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <ArrowLeft size={13} /> Volver a la Carta Web
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PANEL DE CONTROL AUTENTICADO (ESTILO APPLE)
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#0071E3]/20">
      
      {/* 1. Header Superior Trans translúcido (Apple Frosted Glass) */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/[0.08] sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/Gemini_Generated_Image_78a1e378a1e378a1.jpg" 
              alt="Porto Brezza" 
              className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base text-[#1D1D1F] tracking-tight">
                  Porto Brezza
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B] px-2 py-0.5 bg-black/[0.04] rounded-full">
                  Gerencia
                </span>
              </div>
              <p className="text-[11px] text-[#86868B] tracking-normal">
                Plaza Costasur • Los Cabos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-xs font-medium text-[#1D1D1F] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#0071E3]' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={onExit}
              className="px-3.5 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-xs text-white font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Eye size={13} />
              <span>Ver Web Cliente</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Barra de Métricas del Turno (Widgets Estilo Apple) */}
      <section className="px-4 sm:px-8 pt-6 pb-2 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Mesas Ocupadas */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                Ocupación
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Utensils size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                {occupiedTablesCount} <span className="text-lg text-[#86868B] font-normal">/ {tables.length}</span>
              </span>
            </div>
            <span className="text-[12px] text-[#86868B] mt-0.5 block">Mesas en servicio</span>
          </div>

          {/* Comensales en Salón */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                Comensales
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                {currentDinersInRestaurant}
              </span>
            </div>
            <span className="text-[12px] text-[#86868B] mt-0.5 block">Personas en piso</span>
          </div>

          {/* Cuentas Activas por Cobrar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                Comandas Activas
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#0071E3]">
                ${activeComandasTotal.toLocaleString('es-MX')}
              </span>
            </div>
            <span className="text-[12px] text-[#86868B] mt-0.5 block">MXN en mesas</span>
          </div>

          {/* Ventas Cobradas del Turno */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#86868B]">
                Ventas del Turno
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp size={14} />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-emerald-600">
                ${shiftSales.toLocaleString('es-MX')}
              </span>
            </div>
            <span className="text-[12px] text-[#86868B] mt-0.5 block">MXN corte cobrado</span>
          </div>

        </div>
      </section>

      {/* 3. Navegación Segmentada Estilo Apple (iOS / macOS Segmented Control) */}
      <div className="px-4 sm:px-8 pt-4 pb-2 max-w-7xl mx-auto w-full sticky top-[61px] z-20">
        <div className="bg-[#E5E5EA]/70 backdrop-blur-md p-1 rounded-2xl inline-flex gap-1 border border-black/[0.04] overflow-x-auto max-w-full no-scrollbar shadow-xs">
          
          <button
            onClick={() => setActiveTab('mesas')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'mesas'
                ? 'bg-white text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.02]'
            }`}
          >
            <Utensils size={15} className={activeTab === 'mesas' ? 'text-[#0071E3]' : ''} />
            <span>Mesas & POS</span>
          </button>

          <button
            onClick={() => setActiveTab('cocina')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'cocina'
                ? 'bg-white text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.02]'
            }`}
          >
            <ChefHat size={15} className={activeTab === 'cocina' ? 'text-[#0071E3]' : ''} />
            <span>Cocina (KDS)</span>
            {kitchenTickets.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FF3B30] text-white text-[10px] font-bold">
                {kitchenTickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservas')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'reservas'
                ? 'bg-white text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.02]'
            }`}
          >
            <Calendar size={15} className={activeTab === 'reservas' ? 'text-[#0071E3]' : ''} />
            <span>Reservaciones</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'menu'
                ? 'bg-white text-[#1D1D1F] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                : 'text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.02]'
            }`}
          >
            <Wine size={15} className={activeTab === 'menu' ? 'text-[#0071E3]' : ''} />
            <span>Carta & Precios</span>
            {outOfStockDishes > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#FF9500] text-white text-[10px] font-bold">
                {outOfStockDishes}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* 4. Contenido de las Pestañas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        
        {/* PESTAÑA 1: MESAS & COMANDERO POS (ESTILO APPLE) */}
        {activeTab === 'mesas' && (
          <div className="space-y-6">
            
            {/* Barra de Filtro de Zonas y Acciones Estilo Apple */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              
              {/* Filtro de Zonas */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#86868B] mr-1.5">
                  Zona:
                </span>
                <div className="bg-[#E5E5EA]/60 p-1 rounded-xl inline-flex flex-wrap gap-1 border border-black/[0.04]">
                  {['TODAS', 'Terraza', 'Salón Principal', 'Barra & Cava'].map(zone => (
                    <button
                      key={zone}
                      onClick={() => setSelectedZoneFilter(zone)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        selectedZoneFilter === zone
                          ? 'bg-white text-[#1D1D1F] shadow-xs'
                          : 'text-[#86868B] hover:text-[#1D1D1F]'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
                <button
                  onClick={() => setShowAddTableModal(true)}
                  className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-[0.98]"
                >
                  <Plus size={13} /> Nueva Mesa
                </button>

                <button
                  onClick={handleResetAllTables}
                  className="px-3.5 py-2 bg-black/[0.04] hover:bg-red-50 text-[#86868B] hover:text-[#FF3B30] text-xs font-medium rounded-full transition-colors cursor-pointer"
                  title="Reinicia todas las mesas a libres para empezar un nuevo turno limpio"
                >
                  Limpiar Turno
                </button>
              </div>

              {/* Leyenda de Estados Apple */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-[#86868B]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#34C759]"></span> Libre
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF3B30]"></span> En Mesa
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF9500]"></span> Pide Cuenta
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0071E3]"></span> Reservada
                </span>
              </div>
            </div>

            {/* Plano de Mesas Interactivo - Tarjetas Apple */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTables.map(table => {
                const isLibre = table.estado === 'LIBRE';
                const isOcupada = table.estado === 'OCUPADA';
                const isCuenta = table.estado === 'CUENTA';
                const isReservada = table.estado === 'RESERVADA';

                const statusStyles = {
                  LIBRE: {
                    ring: 'ring-1 ring-[#34C759]/30 hover:ring-[#34C759]',
                    badge: 'bg-[#34C759]/10 text-[#34C759]',
                    label: 'Libre'
                  },
                  OCUPADA: {
                    ring: 'ring-1 ring-[#FF3B30]/30 hover:ring-[#FF3B30]',
                    badge: 'bg-[#FF3B30]/10 text-[#FF3B30]',
                    label: 'En Mesa'
                  },
                  CUENTA: {
                    ring: 'ring-1 ring-[#FF9500]/30 hover:ring-[#FF9500]',
                    badge: 'bg-[#FF9500]/10 text-[#FF9500]',
                    label: 'Pide Cuenta'
                  },
                  RESERVADA: {
                    ring: 'ring-1 ring-[#0071E3]/30 hover:ring-[#0071E3]',
                    badge: 'bg-[#0071E3]/10 text-[#0071E3]',
                    label: 'Reservada'
                  }
                }[table.estado] || {
                  ring: 'ring-1 ring-black/[0.08]',
                  badge: 'bg-black/[0.04] text-[#86868B]',
                  label: table.estado
                };

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTableForOrder(table)}
                    className={`bg-white rounded-2xl ${statusStyles.ring} p-4 sm:p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col justify-between group relative`}
                  >
                    <div>
                      {/* Encabezado de Mesa con Número, Estado y Botón para Eliminar */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-10 h-10 rounded-full text-base font-semibold flex items-center justify-center shadow-xs ${
                            isOcupada ? 'bg-[#FF3B30] text-white' :
                            isCuenta ? 'bg-[#FF9500] text-white' :
                            isReservada ? 'bg-[#0071E3] text-white' :
                            'bg-[#F5F5F7] text-[#1D1D1F] border border-black/[0.06]'
                          }`}>
                            {table.numero}
                          </span>
                          <div>
                            <h4 className="font-semibold text-sm text-[#1D1D1F] leading-tight">
                              Mesa {table.numero}
                            </h4>
                            <span className="text-[11px] text-[#86868B] block mt-0.5">
                              {table.zona} • Max {table.capacidad}p
                            </span>
                          </div>
                        </div>

                        {/* Estado y Botón de Quitar Mesa */}
                        <div className="flex items-center gap-1">
                          <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${statusStyles.badge}`}>
                            {statusStyles.label}
                          </span>
                          
                          {/* Opción para Quitar / Eliminar Mesa */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTable(table.id, table.numero);
                            }}
                            className="p-1 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full transition-colors cursor-pointer"
                            title={`Quitar Mesa ${table.numero}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Información del Comensal */}
                      {table.reservaNombre && (
                        <div className="bg-[#F5F5F7] p-2.5 rounded-xl border border-black/[0.04] mb-2.5 text-xs">
                          <span className="text-[10px] uppercase font-semibold text-[#86868B] block">
                            Cliente:
                          </span>
                          <span className="font-medium text-[#1D1D1F] truncate block">
                            {table.reservaNombre}
                          </span>
                        </div>
                      )}

                      {/* Comanda en Mesa */}
                      {table.order && table.order.items?.length > 0 ? (
                        <div className="space-y-1.5 my-2">
                          <div className="text-[11px] text-[#86868B] font-medium flex justify-between">
                            <span>{table.order.items.reduce((acc, i) => acc + i.cantidad, 0)} ítems pedidos</span>
                            {table.tiempoOcupada && <span>⏳ {table.tiempoOcupada}</span>}
                          </div>
                          <div className="text-xs text-[#1D1D1F] line-clamp-2 italic bg-[#F5F5F7] p-2 rounded-xl border border-black/[0.04]">
                            {table.order.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <div className="py-3.5 text-center text-[#86868B] text-xs">
                          {isReservada ? 'Esperando llegada de comensales' : 'Mesa lista para abrir comanda'}
                        </div>
                      )}
                    </div>

                    {/* Pie de Mesa con Monto y Acción */}
                    <div className="pt-3 border-t border-black/[0.06] mt-2 flex items-center justify-between">
                      {table.order && table.order.subtotal > 0 ? (
                        <div>
                          <span className="text-[10px] text-[#86868B] block">Consumo actual:</span>
                          <span className="font-semibold text-sm text-[#1D1D1F]">
                            ${table.order.subtotal.toLocaleString('es-MX')} MXN
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#86868B]">Sin consumo</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTableForOrder(table);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#1D1D1F] hover:bg-[#0071E3] text-white text-[11px] font-medium transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        {table.order?.items?.length ? 'Ver Comanda' : 'Abrir Mesa'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* PESTAÑA 2: COCINA & HORNO (KDS) */}
        {activeTab === 'cocina' && (
          <KitchenDisplay
            tickets={kitchenTickets}
            onUpdateTicketStatus={handleUpdateTicketStatus}
          />
        )}

        {/* PESTAÑA 3: LIBRO DE RESERVACIONES (ESTILO APPLE) */}
        {activeTab === 'reservas' && (
          <div className="space-y-6">
            
            {/* Barra de Filtros Estilo Apple */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] uppercase tracking-wider text-[#86868B] font-semibold">Fecha:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-[#F5F5F7] border border-black/10 px-3.5 py-1.5 text-xs text-[#1D1D1F] rounded-xl focus:outline-none focus:bg-white focus:border-[#0071E3]"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate('')}
                      className="text-[11px] text-[#0071E3] hover:underline cursor-pointer font-medium"
                    >
                      Ver todas
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] uppercase tracking-wider text-[#86868B] font-semibold">Estado:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#F5F5F7] border border-black/10 px-3.5 py-1.5 text-xs text-[#1D1D1F] rounded-xl focus:outline-none focus:bg-white focus:border-[#0071E3] cursor-pointer"
                  >
                    <option value="TODAS">Todos los estados</option>
                    <option value="CONFIRMADA">Confirmadas</option>
                    <option value="EN MESA">En Mesa</option>
                    <option value="COMPLETADA">Completadas</option>
                    <option value="CANCELADA">Canceladas</option>
                  </select>
                </div>
              </div>

              {/* Búsqueda por nombre o teléfono */}
              <div className="relative w-full md:w-72">
                <Search size={14} className="absolute left-3.5 top-2.5 text-[#86868B]" />
                <input
                  type="text"
                  placeholder="Buscar por cliente o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/10 pl-9 pr-3.5 py-1.5 text-xs text-[#1D1D1F] rounded-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20"
                />
              </div>
            </div>

            {/* Tabla de Reservaciones Estilo Apple */}
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
              <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F] tracking-tight">
                    {selectedDate ? `Reservas para el día ${selectedDate}` : 'Todas las Reservaciones Registradas'}
                  </h3>
                  <p className="text-[11px] text-[#86868B]">
                    Libro de mesa y comensales en vivo
                  </p>
                </div>
                <span className="text-xs text-[#86868B] px-3 py-1 bg-black/[0.04] rounded-full font-medium">
                  <b>{filteredReservations.length}</b> reservas
                </span>
              </div>

              {loading ? (
                <p className="text-center text-xs text-[#86868B] py-16">Cargando libro de reservas...</p>
              ) : filteredReservations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Calendar size={36} className="text-[#86868B]/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#1D1D1F]">No hay reservaciones registradas para este filtro.</p>
                  <p className="text-xs text-[#86868B] mt-1">Prueba seleccionando otra fecha o borra los filtros.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F5F7] border-b border-black/[0.06] text-[10px] uppercase tracking-wider font-semibold text-[#86868B]">
                      <tr>
                        <th className="py-3 px-6">Hora</th>
                        <th className="py-3 px-4">Cliente & Contacto</th>
                        <th className="py-3 px-4 text-center">Personas</th>
                        <th className="py-3 px-4">Notas / Ocasión</th>
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {filteredReservations.map((r) => {
                        const isCanceled = r.estado === 'CANCELADA';

                        return (
                          <tr key={r.id} className={`hover:bg-[#F5F5F7]/50 transition-colors ${isCanceled ? 'opacity-50' : ''}`}>
                            
                            {/* Hora */}
                            <td className="py-4 px-6 whitespace-nowrap">
                              <span className="text-sm font-semibold text-[#1D1D1F] block">
                                {r.hora?.substring(0, 5)} hrs
                              </span>
                              <span className="text-[11px] text-[#86868B]">{r.fecha}</span>
                            </td>

                            {/* Cliente & Teléfono */}
                            <td className="py-4 px-4">
                              <span className="font-semibold text-sm text-[#1D1D1F] block">{r.nombre_cliente}</span>
                              <a
                                href={`https://wa.me/${r.telefono_cliente?.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(r.nombre_cliente)},%20le%20escribimos%20de%20Porto%20Brezza%20con%20relación%20a%20su%20reserva%20${r.codigo_reserva}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#0071E3] hover:underline font-medium inline-flex items-center gap-1 mt-0.5"
                                title="Contactar por WhatsApp"
                              >
                                <Phone size={11} className="text-[#34C759]" /> {r.telefono_cliente}
                              </a>
                            </td>

                            {/* Personas */}
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#F5F5F7] font-semibold text-xs text-[#1D1D1F] border border-black/[0.04]">
                                {r.personas}
                              </span>
                            </td>

                            {/* Notas */}
                            <td className="py-4 px-4 max-w-xs text-xs text-[#86868B] italic">
                              {r.notas || 'Sin notas especiales'}
                            </td>

                            {/* Código */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#F5F5F7] rounded-md text-[#1D1D1F] border border-black/[0.04]">
                                #{r.codigo_reserva}
                              </span>
                            </td>

                            {/* Estado con Badge */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-block ${
                                r.estado === 'CONFIRMADA' ? 'bg-[#34C759]/10 text-[#34C759]' :
                                r.estado === 'EN MESA' ? 'bg-[#0071E3]/10 text-[#0071E3]' :
                                r.estado === 'COMPLETADA' ? 'bg-black/5 text-[#86868B]' :
                                'bg-[#FF3B30]/10 text-[#FF3B30]'
                              }`}>
                                {r.estado}
                              </span>
                            </td>

                            {/* Acciones de cambio de estado y Sentar en Mesa */}
                            <td className="py-4 px-6 text-right whitespace-nowrap space-x-1.5">
                              {r.estado !== 'EN MESA' && r.estado !== 'CANCELADA' && r.estado !== 'COMPLETADA' && (
                                <button
                                  onClick={() => handleSeatReservation(r)}
                                  className="px-3.5 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-[11px] font-medium rounded-full transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1 active:scale-[0.98]"
                                  title="Sentar comensal en mesa física y abrir comanda"
                                >
                                  <Utensils size={11} /> Sentar en Mesa
                                </button>
                              )}

                              {r.estado === 'EN MESA' && (
                                <button
                                  onClick={() => handleUpdateStatus(r.id, 'COMPLETADA')}
                                  className="px-3 py-1.5 bg-[#1D1D1F] hover:bg-black text-white text-[11px] font-medium rounded-full transition-colors cursor-pointer"
                                  title="Marcar como finalizada"
                                >
                                  Finalizar
                                </button>
                              )}

                              {r.estado !== 'CANCELADA' && r.estado !== 'COMPLETADA' && (
                                <button
                                  onClick={() => handleUpdateStatus(r.id, 'CANCELADA')}
                                  className="px-3 py-1.5 bg-black/[0.04] hover:bg-red-50 text-[#86868B] hover:text-[#FF3B30] text-[11px] font-medium rounded-full transition-colors cursor-pointer"
                                  title="Cancelar reserva"
                                >
                                  Cancelar
                                </button>
                              )}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: GESTOR DE CARTA & PRECIOS (ESTILO APPLE) */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            
            {/* Cabecera del Gestor con Acción para Agregar Platillo */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
                    <Wine size={16} />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                    Catálogo de Carta & Precios
                  </h3>
                </div>
                <p className="text-xs text-[#86868B] mt-1 max-w-xl font-normal leading-relaxed">
                  Modifica platillos, precios, descripciones y fotografías en tiempo real. Los cambios se sincronizan al instante en la carta web y con el Concierge de IA.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setEditingDish({
                    isNew: true,
                    nombre: '',
                    precio: '',
                    categoria: 'Pizzas Artesanales',
                    descripcion: '',
                    disponible: true
                  })}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-full transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Plus size={14} /> Nuevo Platillo
                </button>
              </div>
            </div>

            {/* Barra de Filtros por Categoría y Búsqueda */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Categorías Apple */}
              <div className="bg-[#E5E5EA]/60 p-1 rounded-xl inline-flex flex-wrap gap-1 border border-black/[0.04] w-full md:w-auto">
                {['TODAS', 'Pizzas Artesanales', 'Pastas & Especialidades', 'Focaccias', 'Dolci', 'Bebidas & Vinos'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setMenuCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      menuCategoryFilter === cat
                        ? 'bg-white text-[#1D1D1F] shadow-xs'
                        : 'text-[#86868B] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Buscador Estilo Apple */}
              <div className="w-full md:w-72 relative">
                <Search size={14} className="absolute left-3.5 top-2.5 text-[#86868B]" />
                <input
                  type="text"
                  placeholder="Buscar platillo o ingrediente..."
                  value={menuSearchTerm}
                  onChange={(e) => setMenuSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-[#F5F5F7] border border-black/[0.04] rounded-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 transition-all text-[#1D1D1F]"
                />
                {menuSearchTerm && (
                  <button
                    onClick={() => setMenuSearchTerm('')}
                    className="absolute right-3 top-2.5 text-[#86868B] hover:text-[#1D1D1F] text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Grid de Platillos de la Carta - Tarjetas Apple */}
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-black/[0.06] text-[#86868B]">
                <Utensils size={32} className="mx-auto mb-2 opacity-30 text-[#0071E3]" />
                <p className="text-sm font-semibold text-[#1D1D1F]">No se encontraron platillos con los filtros actuales.</p>
                <p className="text-xs text-[#86868B] mt-1">Prueba limpiando el buscador o cambiando de categoría.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      item.disponible
                        ? 'bg-white border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5'
                        : 'bg-[#F5F5F7] border-black/[0.04] opacity-75'
                    }`}
                  >
                    <div>
                      {/* Fotografía de portada si tiene imagen */}
                      {item.imagen_url && (
                        <div className="mb-3 rounded-xl overflow-hidden h-32 border border-black/[0.04] relative bg-[#F5F5F7]">
                          <img
                            src={item.imagen_url}
                            alt={item.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium rounded-full">
                            {item.categoria}
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          {!item.imagen_url && (
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B] block truncate">
                              {item.categoria}
                            </span>
                          )}
                          <h4 className="font-semibold text-base text-[#1D1D1F] mt-0.5 truncate leading-snug">
                            {item.nombre}
                          </h4>
                        </div>

                        {/* Caja de Precio con Edición Rápida en píldora Apple */}
                        <div className="shrink-0 text-right">
                          {quickPriceEditId === item.id ? (
                            <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 border-2 border-[#0071E3] rounded-full shadow-xs">
                              <span className="text-xs text-[#86868B] font-bold pl-1.5">$</span>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={quickPriceValue}
                                onChange={(e) => setQuickPriceValue(e.target.value)}
                                className="w-14 px-1 py-0.5 text-xs font-bold bg-transparent focus:outline-none text-[#1D1D1F]"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuickPriceSave(item.id);
                                  if (e.key === 'Escape') setQuickPriceEditId(null);
                                }}
                              />
                              <button
                                onClick={() => handleQuickPriceSave(item.id)}
                                className="w-5 h-5 rounded-full bg-[#0071E3] text-white flex items-center justify-center cursor-pointer shadow-xs"
                                title="Guardar precio"
                              >
                                <Check size={11} />
                              </button>
                              <button
                                onClick={() => setQuickPriceEditId(null)}
                                className="w-5 h-5 rounded-full text-[#86868B] hover:text-black flex items-center justify-center cursor-pointer"
                                title="Cancelar"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setQuickPriceEditId(item.id);
                                setQuickPriceValue(item.precio);
                              }}
                              className="group/price cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5EA] border border-black/[0.04] transition-all"
                              title="Clic para modificar precio rápidamente"
                            >
                              <span className="font-semibold text-sm text-[#1D1D1F]">
                                ${Number(item.precio).toFixed(2)}
                              </span>
                              <Edit3 size={11} className="text-[#86868B] opacity-60 group-hover/price:opacity-100 transition-opacity" />
                            </div>
                          )}
                          <span className="text-[10px] text-[#86868B] block mt-0.5 font-medium">MXN</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#86868B] line-clamp-2 leading-relaxed mb-4">
                        {item.descripcion || 'Sin descripción culinaria.'}
                      </p>
                    </div>

                    {/* Pie de la tarjeta con acciones Apple */}
                    <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${
                          item.disponible ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                        }`}>
                          {item.disponible ? 'Disponible' : 'Agotado'}
                        </span>
                        <button
                          onClick={() => handleToggleDishAvailability(item.id, item.disponible)}
                          className="text-[11px] text-[#86868B] hover:text-[#1D1D1F] underline cursor-pointer"
                        >
                          {item.disponible ? 'Pausar' : 'Activar'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingDish({ ...item, isNew: false })}
                          className="px-3 py-1.5 text-xs font-medium bg-[#1D1D1F] text-white hover:bg-[#0071E3] rounded-full transition-colors cursor-pointer flex items-center gap-1 shadow-xs active:scale-[0.98]"
                          title="Editar nombre, precio, categoría, foto y descripción"
                        >
                          <Edit3 size={11} /> Modificar
                        </button>

                        <button
                          onClick={() => handleDeleteDish(item.id, item.nombre)}
                          className="p-1.5 text-[#86868B] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-full transition-colors cursor-pointer"
                          title="Eliminar de la carta"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* MODAL DE COMANDERO POS DE MESA */}
      {selectedTableForOrder && (
        <TableOrderModal
          table={selectedTableForOrder}
          menuItems={menuItems}
          onClose={() => setSelectedTableForOrder(null)}
          onSaveOrder={handleSaveOrder}
          onCheckout={handleCheckout}
        />
      )}

      {/* MODAL PARA CONFIGURAR / AÑADIR NUEVA MESA (ESTILO APPLE) */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-black/[0.08] overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-black/[0.06]">
              <div>
                <h3 className="text-base font-semibold text-[#1D1D1F] tracking-tight">
                  Nueva Mesa Física
                </h3>
                <p className="text-[11px] text-[#86868B]">
                  Configura e incorpora una mesa a la sala
                </p>
              </div>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddNewTable} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-[#86868B] font-semibold mb-1.5">
                  Número o Identificador de Mesa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 11, T7, VIP-1, B3..."
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/10 px-3.5 py-2 text-xs text-[#1D1D1F] rounded-xl focus:bg-white focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#86868B] font-semibold mb-1.5">
                    Zona del Restaurante
                  </label>
                  <select
                    value={newTableZone}
                    onChange={(e) => setNewTableZone(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-black/10 px-3.5 py-2 text-xs text-[#1D1D1F] rounded-xl focus:bg-white focus:outline-none focus:border-[#0071E3] cursor-pointer"
                  >
                    <option value="Terraza">Terraza Panorámica</option>
                    <option value="Salón Principal">Salón Principal</option>
                    <option value="Barra & Cava">Barra & Cava</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#86868B] font-semibold mb-1.5">
                    Capacidad (Personas)
                  </label>
                  <select
                    value={newTableCap}
                    onChange={(e) => setNewTableCap(Number(e.target.value))}
                    className="w-full bg-[#F5F5F7] border border-black/10 px-3.5 py-2 text-xs text-[#1D1D1F] rounded-xl focus:bg-white focus:outline-none focus:border-[#0071E3] cursor-pointer font-semibold"
                  >
                    {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                      <option key={n} value={n}>{n} personas</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-black/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-4 py-2 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-full cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  Guardar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN O CREACIÓN DE PLATILLO Y PRECIO (ESTILO APPLE) */}
      {editingDish && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl w-full max-w-lg rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] border border-black/[0.08] overflow-hidden flex flex-col my-8">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
                  <Utensils size={15} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1D1D1F] tracking-tight">
                    {editingDish.isNew ? 'Nuevo Platillo en Carta' : 'Modificar Platillo & Precio'}
                  </h3>
                  <p className="text-[11px] text-[#86868B]">
                    {editingDish.isNew ? 'Registro de nuevo ítem' : `Editando: ${editingDish.nombre}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDish(null)}
                className="w-7 h-7 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X size={14} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveDish} className="p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#86868B] mb-1.5">
                  Nombre del Platillo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pizza Quattro Formaggi D.O.P."
                  value={editingDish.nombre || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, nombre: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/10 rounded-xl focus:bg-white focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 font-medium text-[#1D1D1F]"
                />
              </div>

              {/* Precio y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#1D1D1F] mb-1.5 flex items-center gap-1">
                    <DollarSign size={13} className="text-[#0071E3]" /> Precio de Venta (MXN) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs font-semibold text-[#86868B]">$</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      placeholder="340.00"
                      value={editingDish.precio !== undefined ? editingDish.precio : ''}
                      onChange={(e) => setEditingDish({ ...editingDish, precio: e.target.value })}
                      className="w-full pl-7 pr-3.5 py-2 text-sm font-semibold bg-[#F5F5F7] border border-black/10 focus:bg-white focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 rounded-xl focus:outline-none text-[#1D1D1F]"
                    />
                  </div>
                  <span className="text-[10px] text-[#86868B] mt-0.5 block">Sincronizado con carta web e IA</span>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#86868B] mb-1.5">
                    Categoría *
                  </label>
                  <select
                    value={editingDish.categoria || 'Pizzas Artesanales'}
                    onChange={(e) => setEditingDish({ ...editingDish, categoria: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/10 rounded-xl focus:bg-white focus:outline-none focus:border-[#0071E3] cursor-pointer text-[#1D1D1F]"
                  >
                    <option value="Pizzas Artesanales">Pizzas Artesanales</option>
                    <option value="Pastas & Especialidades">Pastas & Especialidades</option>
                    <option value="Focaccias">Focaccias</option>
                    <option value="Dolci">Dolci / Postres</option>
                    <option value="Bebidas & Vinos">Bebidas & Vinos</option>
                    <option value="Entradas">Entradas</option>
                  </select>
                </div>
              </div>

              {/* Descripción e Ingredientes */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-[#86868B] mb-1.5">
                  Descripción culinaria e Ingredientes
                </label>
                <textarea
                  rows="3"
                  placeholder="Detalle de ingredientes, tiempo de fermentación, preparación al horno de leña..."
                  value={editingDish.descripcion || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-[#F5F5F7] border border-black/10 rounded-xl focus:bg-white focus:outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20 leading-relaxed text-[#1D1D1F]"
                ></textarea>
              </div>

              {/* Fotografía del Platillo */}
              <div className="bg-[#F5F5F7] p-4 rounded-2xl border border-black/[0.04] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-[#1D1D1F] flex items-center gap-1.5">
                    <Camera size={13} className="text-[#0071E3]" />
                    Fotografía del Platillo
                  </label>
                  {editingDish.imagen_url && (
                    <button
                      type="button"
                      onClick={() => setEditingDish({ ...editingDish, imagen_url: '' })}
                      className="text-[11px] text-[#FF3B30] hover:underline cursor-pointer font-medium"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                {/* Preview de la imagen si está seleccionada */}
                {editingDish.imagen_url ? (
                  <div className="relative rounded-xl overflow-hidden h-36 border border-black/10 bg-white group">
                    <img
                      src={editingDish.imagen_url}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3.5 py-1.5 bg-white text-xs font-semibold text-[#1D1D1F] rounded-full cursor-pointer hover:bg-gray-100 shadow-md flex items-center gap-1.5">
                        <Upload size={12} /> Cambiar Foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-black/15 rounded-xl p-5 text-center bg-white">
                    <Camera size={26} className="mx-auto text-[#86868B] mb-1.5" />
                    <p className="text-xs text-[#1D1D1F] font-medium">Sube una fotografía del platillo</p>
                    <p className="text-[11px] text-[#86868B] mb-3">Desde tu dispositivo o cámara (máx. 4MB)</p>
                    <label className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium rounded-full cursor-pointer shadow-xs active:scale-[0.98]">
                      <Upload size={12} /> Seleccionar Archivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Alternativa: URL o Galería rápida */}
                <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                  <div>
                    <span className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider block mb-1">
                      O pegar enlace directo de imagen (URL):
                    </span>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/foto-pizza.jpg"
                      value={editingDish.imagen_url || ''}
                      onChange={(e) => setEditingDish({ ...editingDish, imagen_url: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-black/10 rounded-xl focus:outline-none focus:border-[#0071E3] text-[#1D1D1F]"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wider block mb-1">
                      O elegir de la galería del restaurante:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '🍕 Pizza Horno', url: '/image copy 3.png' },
                        { label: '🍕 Pizza Trufa', url: '/image copy 4.png' },
                        { label: '🍝 Pasta Fresca', url: '/image copy 2.png' },
                        { label: '🥖 Focaccia Romero', url: '/image.png' },
                        { label: '🍰 Dolci / Tiramisù', url: '/Gemini_Generated_Image_78a1e378a1e378a1.jpg' }
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setEditingDish({ ...editingDish, imagen_url: preset.url })}
                          className={`text-[11px] px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                            editingDish.imagen_url === preset.url
                              ? 'bg-[#0071E3] text-white border-[#0071E3]'
                              : 'bg-white hover:bg-black/5 text-[#1D1D1F] border-black/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Disponibilidad */}
              <div className="flex items-center gap-2.5 p-3 bg-[#F5F5F7] rounded-xl border border-black/[0.04]">
                <input
                  type="checkbox"
                  id="disponibleCheck"
                  checked={editingDish.disponible !== false}
                  onChange={(e) => setEditingDish({ ...editingDish, disponible: e.target.checked })}
                  className="w-4 h-4 rounded-md cursor-pointer accent-[#0071E3]"
                />
                <label htmlFor="disponibleCheck" className="text-xs text-[#1D1D1F] cursor-pointer font-medium select-none">
                  Disponible de inmediato en la carta web y comandero POS de mesas
                </label>
              </div>

              {/* Acciones */}
              <div className="pt-4 border-t border-black/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-4 py-2 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDish}
                  className="px-5 py-2 text-xs font-semibold bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50 active:scale-[0.98]"
                >
                  <Save size={13} />
                  {savingDish ? 'Guardando...' : 'Guardar Platillo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
