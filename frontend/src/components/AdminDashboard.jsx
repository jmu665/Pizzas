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

  // Inventario de Insumos Críticos de Porto Brezza
  const [criticalStock, setCriticalStock] = useState([
    { id: 'burrata', nombre: 'Burratas Frescas de Puglia', restante: 14, total: 20, unidad: 'pzas', minAlerta: 4 },
    { id: 'masas', nombre: 'Bolas de Masa Madre (48h fermentación)', restante: 38, total: 50, unidad: 'masas', minAlerta: 8 },
    { id: 'serrano', nombre: 'Jamón Serrano Gran Reserva', restante: 18, total: 25, unidad: 'porciones', minAlerta: 5 },
    { id: 'chianti', nombre: 'Chianti Classico Riserva 2019 (Cava)', restante: 6, total: 12, unidad: 'botellas', minAlerta: 3 },
    { id: 'tartufo', nombre: 'Crema de Trufa Negra Estiva', restante: 5, total: 8, unidad: 'frascos', minAlerta: 2 },
  ]);

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

  // Ajustar stock crítico (+ / -)
  const handleAdjustStock = (id, delta) => {
    setCriticalStock(prev => prev.map(item => {
      if (item.id === id) {
        const nextVal = Math.max(0, item.restante + delta);
        return { ...item, restante: nextVal };
      }
      return item;
    }));
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

  // PANTALLA DE ACCESO (LOGIN CON PIN)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#14100E] flex items-center justify-center p-6 text-[#FAF7F2]">
        <div className="w-full max-w-sm bg-[#1E1815] border border-[#B88E3E]/40 p-8 shadow-2xl rounded-sm">
          <div className="text-center mb-8">
            <img 
              src="/Gemini_Generated_Image_78a1e378a1e378a1.jpg" 
              alt="Porto Brezza" 
              className="w-16 h-16 rounded-full object-cover border-2 border-[#B88E3E] mx-auto mb-3 shadow"
            />
            <h2 className="font-serif-luxury text-2xl font-bold tracking-wider">
              <span className="text-[#3E7D5C]">PORTO</span> <span className="text-[#B83240]">BREZZA</span>
            </h2>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4B26F] font-semibold block mt-1">
              Panel del Propietario & Gerencia
            </span>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#A69B8F] mb-2 font-medium">
                Ingrese su PIN de Seguridad
              </label>
              <input
                type="password"
                maxLength="6"
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-[#120E0C] border border-[#3A2E28] focus:border-[#B88E3E] text-center text-2xl tracking-[0.5em] py-3 text-white focus:outline-none rounded-xs font-mono"
              />
              {pinError && (
                <p className="text-[11px] text-[#EF4444] mt-1.5 text-center">
                  PIN incorrecto. (PIN sugerido: 1234)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#6E1B24] hover:bg-[#58131B] text-white text-[11px] uppercase tracking-[0.25em] font-semibold transition-all cursor-pointer shadow"
            >
              Acceder al Sistema
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#2A221E] text-center">
            <button
              onClick={onExit}
              className="text-xs text-[#A69B8F] hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} /> Volver a la Carta Web
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PANEL DE CONTROL AUTENTICADO
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#221E1C] flex flex-col font-sans-clean">
      
      {/* 1. Header del Panel de Control */}
      <header className="bg-[#14100E] text-white border-b border-[#B88E3E]/30 sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/Gemini_Generated_Image_78a1e378a1e378a1.jpg" 
              alt="Porto Brezza" 
              className="w-9 h-9 rounded-full object-cover border border-[#B88E3E]"
            />
            <div>
              <div className="font-serif-luxury text-lg font-bold tracking-wider leading-none">
                <span className="text-[#3E7D5C]">PORTO</span> <span className="text-[#B83240]">BREZZA</span>
                <span className="text-[10px] font-sans-clean font-semibold uppercase tracking-widest text-[#D4B26F] ml-2 px-2 py-0.5 bg-[#251C17] border border-[#3D2E24] rounded-xs">
                  POS & Gerencia
                </span>
              </div>
              <p className="text-[10px] text-[#A69B8F] tracking-wide mt-0.5">
                Plaza Costasur • Los Cabos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="px-2.5 sm:px-3 py-1.5 rounded-xs bg-[#241D18] hover:bg-[#332822] text-xs text-[#D4B26F] border border-[#3D2E24] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={onExit}
              className="px-3 sm:px-3.5 py-1.5 rounded-xs bg-[#6E1B24] hover:bg-[#58131B] text-xs text-white uppercase tracking-wider font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye size={13} />
              <span className="hidden sm:inline">Ver Web Cliente</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Barra de Métricas del Turno en Vivo */}
      <section className="bg-[#1C1613] text-[#FAF7F2] border-b border-[#2A221E] px-4 sm:px-6 py-5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Mesas Ocupadas */}
          <div className="bg-[#14100E] p-3 sm:p-4 border border-[#2D231E] rounded-xs">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#A69B8F] block mb-1 flex items-center gap-1.5">
              <Utensils size={11} className="text-[#D4B26F]" /> Ocupación de Mesas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#D4B26F]">
                {occupiedTablesCount} / {tables.length}
              </span>
              <span className="text-[11px] text-[#A69B8F]">mesas en servicio</span>
            </div>
          </div>

          {/* Comensales en Salón */}
          <div className="bg-[#14100E] p-3 sm:p-4 border border-[#2D231E] rounded-xs">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#A69B8F] block mb-1 flex items-center gap-1.5">
              <Users size={11} className="text-[#3E7D5C]" /> Comensales en Piso
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#3E7D5C]">
                {currentDinersInRestaurant}
              </span>
              <span className="text-[11px] text-[#A69B8F]">personas comiendo</span>
            </div>
          </div>

          {/* Cuentas Activas por Cobrar */}
          <div className="bg-[#14100E] p-3 sm:p-4 border border-[#2D231E] rounded-xs">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#A69B8F] block mb-1 flex items-center gap-1.5">
              <Receipt size={11} className="text-[#60A5FA]" /> Comandas Activas
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
                ${activeComandasTotal.toLocaleString('es-MX')}
              </span>
              <span className="text-[10px] text-[#A69B8F] font-mono">MXN en mesas</span>
            </div>
          </div>

          {/* Ventas Cobradas del Turno */}
          <div className="bg-[#14100E] p-3 sm:p-4 border border-[#2D231E] rounded-xs">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#A69B8F] block mb-1 flex items-center gap-1.5">
              <TrendingUp size={11} className="text-[#86EFAC]" /> Ventas del Turno (Corte)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[#86EFAC]">
                ${shiftSales.toLocaleString('es-MX')}
              </span>
              <span className="text-[10px] text-[#A69B8F] font-mono">MXN cobrado</span>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Navegación Principal del Sistema (4 Pestañas de Restaurante) */}
      <div className="bg-[#F2ECE1] border-b border-[#E0D8C8] px-4 sm:px-6 sticky top-[57px] z-20">
        <div className="max-w-7xl mx-auto flex items-center overflow-x-auto gap-4 sm:gap-6 no-scrollbar">
          
          <button
            onClick={() => setActiveTab('mesas')}
            className={`py-3.5 text-xs uppercase tracking-[0.18em] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'mesas'
                ? 'border-[#6E1B24] text-[#6E1B24]'
                : 'border-transparent text-[#6B635E] hover:text-[#221E1C]'
            }`}
          >
            <Utensils size={14} /> Mesas & Comandero POS
          </button>

          <button
            onClick={() => setActiveTab('cocina')}
            className={`py-3.5 text-xs uppercase tracking-[0.18em] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'cocina'
                ? 'border-[#6E1B24] text-[#6E1B24]'
                : 'border-transparent text-[#6B635E] hover:text-[#221E1C]'
            }`}
          >
            <ChefHat size={14} /> Cocina & Horno (KDS)
            {kitchenTickets.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                {kitchenTickets.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservas')}
            className={`py-3.5 text-xs uppercase tracking-[0.18em] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'reservas'
                ? 'border-[#6E1B24] text-[#6E1B24]'
                : 'border-transparent text-[#6B635E] hover:text-[#221E1C]'
            }`}
          >
            <Calendar size={14} /> Libro de Reservaciones
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`py-3.5 text-xs uppercase tracking-[0.18em] font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-2 ${
              activeTab === 'menu'
                ? 'border-[#6E1B24] text-[#6E1B24]'
                : 'border-transparent text-[#6B635E] hover:text-[#221E1C]'
            }`}
          >
            <Wine size={14} /> Carta & Insumos Críticos
            {outOfStockDishes > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                {outOfStockDishes}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* 4. Contenido de las Pestañas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        
        {/* PESTAÑA 1: MESAS & COMANDERO POS */}
        {activeTab === 'mesas' && (
          <div className="space-y-6">
            
            {/* Barra de Filtro de Zonas y Leyenda */}
            <div className="bg-white p-4 border border-[#E3DBD0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#7A7067] font-semibold mr-1">
                  Zona:
                </span>
                {['TODAS', 'Terraza', 'Salón Principal', 'Barra & Cava'].map(zone => (
                  <button
                    key={zone}
                    onClick={() => setSelectedZoneFilter(zone)}
                    className={`px-3 py-1 text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer ${
                      selectedZoneFilter === zone
                        ? 'bg-[#1A382B] text-white'
                        : 'bg-[#F4EFE6] text-[#524943] hover:bg-[#EAE3D6] border border-[#DDD5C7]'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddTableModal(true)}
                  className="px-3 py-1 bg-[#1A382B] hover:bg-[#122A20] text-white text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Plus size={12} /> Nueva Mesa
                </button>

                <button
                  onClick={handleResetAllTables}
                  className="px-3 py-1 bg-white hover:bg-red-50 text-[#EF4444] border border-red-200 text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer"
                  title="Reinicia todas las mesas a libres para empezar un nuevo turno limpio"
                >
                  Limpiar Turno
                </button>
              </div>

              {/* Leyenda de Estados */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-wider font-medium text-[#7A7067]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Libre
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Comiendo
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Pide Cuenta
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span> Reservada
                </span>
              </div>
            </div>

            {/* Plano de Mesas Interactivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTables.map(table => {
                const isLibre = table.estado === 'LIBRE';
                const isOcupada = table.estado === 'OCUPADA';
                const isCuenta = table.estado === 'CUENTA';
                const isReservada = table.estado === 'RESERVADA';

                const statusStyles = {
                  LIBRE: {
                    border: 'border-[#10B981]/50 hover:border-[#10B981]',
                    badge: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
                    label: 'Libre'
                  },
                  OCUPADA: {
                    border: 'border-[#EF4444]/60 hover:border-[#EF4444]',
                    badge: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
                    label: 'En Mesa'
                  },
                  CUENTA: {
                    border: 'border-[#F59E0B]/60 hover:border-[#F59E0B]',
                    badge: 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]',
                    label: 'Pide Cuenta'
                  },
                  RESERVADA: {
                    border: 'border-[#3B82F6]/60 hover:border-[#3B82F6]',
                    badge: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
                    label: 'Reservada'
                  }
                }[table.estado] || {
                  border: 'border-[#DDD5C7]',
                  badge: 'bg-gray-100 text-gray-700',
                  label: table.estado
                };

                return (
                  <div
                    key={table.id}
                    onClick={() => setSelectedTableForOrder(table)}
                    className={`bg-white rounded-xs border-2 ${statusStyles.border} p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative`}
                  >
                    <div>
                      {/* Encabezado de Mesa */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-10 h-10 rounded-full font-serif-luxury text-lg font-bold flex items-center justify-center shadow-xs ${
                            isOcupada ? 'bg-[#6E1B24] text-white' :
                            isCuenta ? 'bg-[#F59E0B] text-white' :
                            isReservada ? 'bg-[#3B82F6] text-white' :
                            'bg-[#F4EFE6] text-[#1C1816] border border-[#DDD5C7]'
                          }`}>
                            {table.numero}
                          </span>
                          <div>
                            <h4 className="font-serif-luxury font-bold text-base text-[#1C1816] leading-tight">
                              Mesa {table.numero}
                            </h4>
                            <span className="text-[10px] text-[#7A7067] uppercase tracking-wider block">
                              {table.zona} • Max {table.capacidad}p
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-xs border ${statusStyles.badge}`}>
                          {statusStyles.label}
                        </span>
                      </div>

                      {/* Información de la Comanda Activa */}
                      {table.reservaNombre && (
                        <div className="bg-[#FAF7F2] p-2 rounded-xs border border-[#EBE3D7] mb-2 text-xs">
                          <span className="text-[9px] uppercase tracking-wider text-[#A69B8F] block font-semibold">
                            Comensal:
                          </span>
                          <span className="font-bold text-[#1C1816] truncate block">
                            {table.reservaNombre}
                          </span>
                        </div>
                      )}

                      {table.order && table.order.items?.length > 0 ? (
                        <div className="space-y-1.5 my-2">
                          <div className="text-[10px] text-[#7A7067] uppercase tracking-wider font-semibold flex justify-between">
                            <span>{table.order.items.reduce((acc, i) => acc + i.cantidad, 0)} ítems pedidos</span>
                            {table.tiempoOcupada && <span>⏳ {table.tiempoOcupada}</span>}
                          </div>
                          <div className="text-xs text-[#524943] line-clamp-2 italic bg-[#FBF9F5] p-1.5 rounded-xs border border-[#F0EAE1]">
                            {table.order.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-[#A69B8F] text-xs">
                          {isReservada ? 'Esperando llegada de clientes' : 'Mesa lista para abrir comanda'}
                        </div>
                      )}
                    </div>

                    {/* Pie de Mesa con Monto y Acción */}
                    <div className="pt-3 border-t border-[#F0EAE1] mt-2 flex items-center justify-between">
                      {table.order && table.order.subtotal > 0 ? (
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-[#7A7067] block">Total actual:</span>
                          <span className="font-mono font-bold text-sm text-[#6E1B24]">
                            ${table.order.subtotal.toLocaleString('es-MX')} MXN
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#A69B8F]">Sin consumo aún</span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTableForOrder(table);
                        }}
                        className="px-3 py-1.5 rounded-xs bg-[#1C1613] hover:bg-[#6E1B24] text-white text-[10px] uppercase tracking-wider font-bold transition-colors cursor-pointer shadow-xs"
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

        {/* PESTAÑA 3: LIBRO DE RESERVACIONES */}
        {activeTab === 'reservas' && (
          <div className="space-y-6">
            
            {/* Barra de Filtros */}
            <div className="bg-white p-4 border border-[#E3D8C5] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <label className="text-xs uppercase tracking-wider text-[#6B635E] font-medium">Fecha:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-[#FAF7F2] border border-[#DCD2C0] px-3 py-1.5 text-xs text-[#221E1C] rounded-xs focus:outline-none focus:border-[#6E1B24]"
                  />
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate('')}
                      className="text-[11px] text-[#6E1B24] underline cursor-pointer"
                    >
                      Ver todas
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs uppercase tracking-wider text-[#6B635E] font-medium">Estado:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#FAF7F2] border border-[#DCD2C0] px-3 py-1.5 text-xs text-[#221E1C] rounded-xs focus:outline-none focus:border-[#6E1B24]"
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
                <Search size={14} className="absolute left-3 top-2.5 text-[#8A8077]" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, teléfono o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#DCD2C0] pl-9 pr-3 py-1.5 text-xs text-[#221E1C] rounded-xs focus:outline-none focus:border-[#6E1B24]"
                />
              </div>
            </div>

            {/* Tabla / Tarjetas de Reservaciones */}
            <div className="bg-white border border-[#E3D8C5] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#EAE3D6] flex items-center justify-between">
                <h3 className="font-serif-luxury text-xl font-semibold text-[#1C1816]">
                  {selectedDate ? `Reservas para el día ${selectedDate}` : 'Todas las Reservaciones Registradas'}
                </h3>
                <span className="text-xs text-[#6B635E]">
                  Mostrando <b>{filteredReservations.length}</b> reservas
                </span>
              </div>

              {loading ? (
                <p className="text-center text-xs text-[#8A8077] py-16">Cargando libro de reservas...</p>
              ) : filteredReservations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <Calendar size={36} className="text-[#D8CFC2] mx-auto mb-2" />
                  <p className="text-sm font-serif-luxury text-[#463E38]">No hay reservaciones registradas para este filtro.</p>
                  <p className="text-xs text-[#8A8077] mt-1">Pruebe seleccionando otra fecha o borre los filtros.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F2] border-b border-[#EAE3D6] text-[10px] uppercase tracking-wider text-[#6B635E]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Hora</th>
                        <th className="py-3 px-4 font-semibold">Cliente & Contacto</th>
                        <th className="py-3 px-4 font-semibold text-center">Personas</th>
                        <th className="py-3 px-4 font-semibold">Notas / Ocasión</th>
                        <th className="py-3 px-4 font-semibold">Código</th>
                        <th className="py-3 px-4 font-semibold">Estado</th>
                        <th className="py-3 px-4 font-semibold text-right">Acciones de Piso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D6]">
                      {filteredReservations.map((r) => {
                        const isCanceled = r.estado === 'CANCELADA';
                        const isSeated = r.estado === 'EN MESA';
                        const isDone = r.estado === 'COMPLETADA';

                        return (
                          <tr key={r.id} className={`hover:bg-[#FDFBF7] transition-colors ${isCanceled ? 'opacity-50' : ''}`}>
                            
                            {/* Hora */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="font-serif-luxury text-base font-bold text-[#6E1B24] block">
                                {r.hora?.substring(0, 5)} hrs
                              </span>
                              <span className="text-[10px] text-[#8A8077]">{r.fecha}</span>
                            </td>

                            {/* Cliente & Teléfono */}
                            <td className="py-4 px-4">
                              <span className="font-semibold text-sm text-[#1C1816] block">{r.nombre_cliente}</span>
                              <a
                                href={`https://wa.me/${r.telefono_cliente?.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(r.nombre_cliente)},%20le%20escribimos%20de%20Porto%20Brezza%20con%20relación%20a%20su%20reserva%20${r.codigo_reserva}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#1A382B] hover:text-[#25D366] font-medium inline-flex items-center gap-1 mt-0.5"
                                title="Contactar por WhatsApp"
                              >
                                <Phone size={11} className="text-[#25D366]" /> {r.telefono_cliente}
                              </a>
                            </td>

                            {/* Personas */}
                            <td className="py-4 px-4 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#DCD2C0] font-serif-luxury font-bold text-sm text-[#1C1816]">
                                {r.personas}
                              </span>
                            </td>

                            {/* Notas */}
                            <td className="py-4 px-4 max-w-xs text-xs text-[#5E554E] italic">
                              {r.notas || 'Sin notas especiales'}
                            </td>

                            {/* Código */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="font-mono text-xs font-semibold px-2 py-1 bg-[#FAF7F2] border border-[#E0D8C8] text-[#6E1B24]">
                                #{r.codigo_reserva}
                              </span>
                            </td>

                            {/* Estado con Badge */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-xs inline-block ${
                                r.estado === 'CONFIRMADA' ? 'bg-[#3E7D5C]/15 text-[#1A382B] border border-[#3E7D5C]/30' :
                                r.estado === 'EN MESA' ? 'bg-[#D4B26F]/20 text-[#8F6A1E] border border-[#D4B26F]/40' :
                                r.estado === 'COMPLETADA' ? 'bg-slate-200 text-slate-700' :
                                'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                              }`}>
                                {r.estado}
                              </span>
                            </td>

                            {/* Acciones de cambio de estado y Sentar en Mesa */}
                            <td className="py-4 px-4 text-right whitespace-nowrap space-x-1.5">
                              {r.estado !== 'EN MESA' && r.estado !== 'CANCELADA' && r.estado !== 'COMPLETADA' && (
                                <button
                                  onClick={() => handleSeatReservation(r)}
                                  className="px-3 py-1 bg-[#6E1B24] hover:bg-[#58131B] text-white text-[10px] uppercase tracking-wider font-bold rounded-xs transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                                  title="Sentar comensal en mesa física y abrir comanda"
                                >
                                  <Utensils size={10} /> Sentar en Mesa
                                </button>
                              )}

                              {r.estado === 'EN MESA' && (
                                <button
                                  onClick={() => handleUpdateStatus(r.id, 'COMPLETADA')}
                                  className="px-2.5 py-1 bg-[#241D18] hover:bg-black text-white text-[10px] uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer"
                                  title="Marcar como finalizada"
                                >
                                  Finalizar
                                </button>
                              )}

                              {r.estado !== 'CANCELADA' && r.estado !== 'COMPLETADA' && (
                                <button
                                  onClick={() => handleUpdateStatus(r.id, 'CANCELADA')}
                                  className="px-2.5 py-1 bg-white hover:bg-red-50 text-[#EF4444] border border-red-200 text-[10px] uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer"
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

        {/* PESTAÑA 4: GESTOR DE CARTA & INSUMOS CRÍTICOS */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            
            {/* Control de Insumos Críticos (Burrata, Masas, Cava) */}
            <div className="bg-white p-6 border border-[#E3D8C5] shadow-xs rounded-xs">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="text-[#B88E3E]" size={20} />
                <h3 className="font-serif-luxury text-xl font-bold text-[#1C1816]">
                  Control de Insumos Críticos del Turno
                </h3>
              </div>
              <p className="text-xs text-[#7A7067] mb-6 max-w-2xl font-light">
                Monitoreo en tiempo real de porciones limitadas. Al agotar un insumo, el personal de piso y el Concierge de IA son prevenidos inmediatamente.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criticalStock.map(st => {
                  const isLow = st.restante <= st.minAlerta;
                  return (
                    <div 
                      key={st.id} 
                      className={`p-4 rounded-xs border transition-all ${
                        isLow ? 'bg-[#FEF2F2] border-[#EF4444]' : 'bg-[#FAF7F2] border-[#E3DBD0]'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-serif-luxury font-bold text-sm text-[#1C1816]">
                          {st.nombre}
                        </h4>
                        {isLow && (
                          <span className="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-[#EF4444] text-white rounded-xs">
                            Bajo Stock
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between mb-3">
                        <span className="text-xs text-[#7A7067]">Disponibles para hoy:</span>
                        <span className={`font-serif-luxury text-2xl font-bold ${isLow ? 'text-[#EF4444]' : 'text-[#1A382B]'}`}>
                          {st.restante} <span className="text-xs font-sans font-normal text-[#7A7067]">/ {st.total} {st.unidad}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE3D6]">
                        <button
                          onClick={() => handleAdjustStock(st.id, -1)}
                          className="w-7 h-7 rounded-xs bg-white border border-[#DDD5C7] text-[#1C1816] hover:bg-[#F2ECE1] font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleAdjustStock(st.id, 1)}
                          className="w-7 h-7 rounded-xs bg-white border border-[#DDD5C7] text-[#1C1816] hover:bg-[#F2ECE1] font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          +1
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gestor de Carta & Modificación de Precios */}
            <div className="space-y-6">
              
              {/* Cabecera del Gestor con Acción para Agregar Platillo */}
              <div className="bg-white p-5 sm:p-6 border border-[#E3D8C5] shadow-xs rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Utensils className="text-[#6E1B24]" size={20} />
                    <h3 className="font-serif-luxury text-2xl font-bold text-[#1C1816]">
                      Gestor de Carta & Modificación de Precios
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B635E] mt-1 font-light max-w-xl">
                    Edite precios, descripciones y disponibilidad de platillos en tiempo real. Los cambios se sincronizan al instante en la carta web y con el Concierge de IA.
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
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#6E1B24] hover:bg-[#58131B] text-white text-xs uppercase tracking-wider font-bold rounded-xs transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={14} /> Nuevo Platillo
                  </button>
                </div>
              </div>

              {/* Barra de Filtros por Categoría y Búsqueda */}
              <div className="bg-[#FAF7F2] p-4 border border-[#E0D8C8] rounded-xs flex flex-col md:flex-row items-center justify-between gap-3">
                {/* Categorías */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs">
                  {['TODAS', 'Pizzas Artesanales', 'Pastas & Especialidades', 'Focaccias', 'Dolci', 'Bebidas & Vinos'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setMenuCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer text-[11px] ${
                        menuCategoryFilter === cat
                          ? 'bg-[#1A382B] text-white shadow-xs'
                          : 'bg-white text-[#524943] hover:bg-[#F2ECE1] border border-[#DDD5C7]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Buscador */}
                <div className="w-full md:w-72 relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-[#8A8077]" />
                  <input
                    type="text"
                    placeholder="Buscar platillo o ingrediente..."
                    value={menuSearchTerm}
                    onChange={(e) => setMenuSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-[#DDD5C7] rounded-xs focus:outline-none focus:border-[#6E1B24]"
                  />
                  {menuSearchTerm && (
                    <button
                      onClick={() => setMenuSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-[#8A8077] hover:text-black text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Grid de Platillos de la Carta */}
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E3DBD0] rounded-xs text-[#7A7067]">
                  <Utensils size={32} className="mx-auto mb-2 opacity-30 text-[#6E1B24]" />
                  <p className="text-sm font-semibold">No se encontraron platillos con los filtros actuales.</p>
                  <p className="text-xs text-[#8A8077] mt-1">Pruebe limpiando el buscador o cambiando de categoría.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMenuItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-5 rounded-xs border transition-all flex flex-col justify-between ${
                        item.disponible
                          ? 'bg-white border-[#E0D8C8] shadow-xs hover:border-[#B88E3E]/60'
                          : 'bg-[#F4EFE6] border-[#D0C6B4] opacity-75'
                      }`}
                    >
                      <div>
                        {/* Fotografía de portada si tiene imagen */}
                        {item.imagen_url && (
                          <div className="mb-3 -mt-1 -mx-1 rounded-xs overflow-hidden h-28 border border-[#EAE3D6] relative bg-[#FAF7F2]">
                            <img
                              src={item.imagen_url}
                              alt={item.nombre}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] uppercase tracking-wider font-semibold rounded-xs">
                              {item.categoria}
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            {!item.imagen_url && (
                              <span className="text-[9px] uppercase tracking-widest text-[#B88E3E] font-semibold block truncate">
                                {item.categoria}
                              </span>
                            )}
                            <h4 className="font-serif-luxury text-lg font-bold text-[#1C1816] mt-0.5 truncate leading-snug">
                              {item.nombre}
                            </h4>
                          </div>

                          {/* Caja de Precio con Edición Rápida */}
                          <div className="shrink-0 text-right">
                            {quickPriceEditId === item.id ? (
                              <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 border-2 border-[#6E1B24] rounded-xs shadow-sm">
                                <span className="text-xs text-[#7A7067] font-bold">$</span>
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={quickPriceValue}
                                  onChange={(e) => setQuickPriceValue(e.target.value)}
                                  className="w-16 px-1 py-0.5 text-xs font-mono font-bold bg-white border border-[#DDD5C7] rounded-xs focus:outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickPriceSave(item.id);
                                    if (e.key === 'Escape') setQuickPriceEditId(null);
                                  }}
                                />
                                <button
                                  onClick={() => handleQuickPriceSave(item.id)}
                                  className="p-1 bg-[#1A382B] text-white hover:bg-[#122A20] rounded-xs cursor-pointer"
                                  title="Guardar precio"
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  onClick={() => setQuickPriceEditId(null)}
                                  className="p-1 text-[#7A7067] hover:text-black cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => {
                                  setQuickPriceEditId(item.id);
                                  setQuickPriceValue(item.precio);
                                }}
                                className="group/price cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-dashed border-[#D8CFBF] hover:border-[#6E1B24] transition-all"
                                title="Clic para modificar precio rápidamente"
                              >
                                <span className="font-serif-luxury font-bold text-lg text-[#6E1B24]">
                                  ${Number(item.precio).toFixed(2)}
                                </span>
                                <Edit3 size={11} className="text-[#8A8077] opacity-60 group-hover/price:opacity-100 transition-opacity" />
                              </div>
                            )}
                            <span className="text-[9px] uppercase tracking-wider text-[#8A8077] block mt-0.5">MXN</span>
                          </div>
                        </div>

                        <p className="text-xs text-[#6B635E] italic font-light mb-4 line-clamp-2 leading-relaxed">
                          {item.descripcion || 'Sin descripción culinaria.'}
                        </p>
                      </div>

                      {/* Pie de la tarjeta con acciones */}
                      <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${item.disponible ? 'text-[#3E7D5C]' : 'text-[#EF4444]'}`}>
                            {item.disponible ? '● En Carta' : '○ Pausado'}
                          </span>
                          <button
                            onClick={() => handleToggleDishAvailability(item.id, item.disponible)}
                            className="text-[10px] text-[#8A8077] hover:text-[#1C1816] underline cursor-pointer"
                          >
                            {item.disponible ? 'Agotar' : 'Activar'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingDish({ ...item, isNew: false })}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#1A382B] text-white hover:bg-[#122A20] rounded-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Editar nombre, precio, categoría y descripción"
                          >
                            <Edit3 size={11} /> Modificar
                          </button>

                          <button
                            onClick={() => handleDeleteDish(item.id, item.nombre)}
                            className="p-1 text-[#EF4444] hover:bg-red-50 rounded-xs transition-colors cursor-pointer border border-transparent hover:border-red-200"
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

      {/* MODAL PARA CONFIGURAR / AÑADIR NUEVA MESA */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] w-full max-w-md rounded-sm shadow-2xl border border-[#D8CFC2] overflow-hidden">
            <div className="bg-[#1C1613] text-white px-5 py-3.5 flex items-center justify-between border-b border-[#3A2E28]">
              <h3 className="font-serif-luxury text-lg font-bold">
                Configurar Nueva Mesa Física
              </h3>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="text-[#A69B8F] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewTable} className="p-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#635A53] font-bold mb-1">
                  Número o Identificador de Mesa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 11, T7, VIP-1, B3..."
                  value={newTableNum}
                  onChange={(e) => setNewTableNum(e.target.value)}
                  className="w-full bg-white border border-[#DDD5C7] px-3 py-2 text-xs text-[#1C1816] rounded-xs focus:outline-none focus:border-[#B88E3E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#635A53] font-bold mb-1">
                    Zona del Restaurante
                  </label>
                  <select
                    value={newTableZone}
                    onChange={(e) => setNewTableZone(e.target.value)}
                    className="w-full bg-white border border-[#DDD5C7] px-3 py-2 text-xs text-[#1C1816] rounded-xs focus:outline-none focus:border-[#B88E3E] cursor-pointer"
                  >
                    <option value="Terraza">Terraza Panorámica</option>
                    <option value="Salón Principal">Salón Principal</option>
                    <option value="Barra & Cava">Barra & Cava</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#635A53] font-bold mb-1">
                    Capacidad (Personas)
                  </label>
                  <select
                    value={newTableCap}
                    onChange={(e) => setNewTableCap(Number(e.target.value))}
                    className="w-full bg-white border border-[#DDD5C7] px-3 py-2 text-xs text-[#1C1816] rounded-xs focus:outline-none focus:border-[#B88E3E] cursor-pointer font-bold"
                  >
                    {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                      <option key={n} value={n}>{n} personas</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8DFCFC0] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTableModal(false)}
                  className="px-4 py-2 border border-[#DDD5C7] text-xs uppercase tracking-wider text-[#635A53] hover:bg-[#F2ECE1] rounded-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1A382B] hover:bg-[#122A20] text-white text-xs uppercase tracking-wider font-bold rounded-xs cursor-pointer shadow-xs"
                >
                  Guardar Mesa en DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN O CREACIÓN DE PLATILLO Y PRECIO */}
      {editingDish && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#FAF7F2] w-full max-w-lg rounded-sm shadow-2xl border border-[#D8CFC2] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            
            {/* Header del Modal */}
            <div className="bg-[#1C1613] text-white px-5 py-4 flex items-center justify-between border-b border-[#3A2E28]">
              <div className="flex items-center gap-2.5">
                <Utensils size={18} className="text-[#D4B26F]" />
                <div>
                  <h3 className="font-serif-luxury text-lg font-bold tracking-wide">
                    {editingDish.isNew ? 'Registrar Nuevo Platillo en Carta' : 'Modificar Platillo & Precio'}
                  </h3>
                  <p className="text-[10px] text-[#A69B8F] uppercase tracking-wider">
                    {editingDish.isNew ? 'Nuevo item culinario' : `Editando: ${editingDish.nombre}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDish(null)}
                className="p-1.5 text-[#A69B8F] hover:text-white rounded-xs cursor-pointer"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSaveDish} className="p-5 sm:p-6 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#5E554E] mb-1">
                  Nombre del Platillo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pizza Quattro Formaggi D.O.P."
                  value={editingDish.nombre || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, nombre: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#DDD5C7] rounded-xs focus:outline-none focus:border-[#6E1B24] font-medium"
                />
              </div>

              {/* Precio y Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#6E1B24] mb-1 flex items-center gap-1">
                    <DollarSign size={13} className="text-[#6E1B24]" /> Precio de Venta (MXN) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-[#7A7067]">$</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      placeholder="340.00"
                      value={editingDish.precio !== undefined ? editingDish.precio : ''}
                      onChange={(e) => setEditingDish({ ...editingDish, precio: e.target.value })}
                      className="w-full pl-7 pr-3.5 py-2 text-sm font-mono font-bold bg-white border-2 border-[#D8CFBF] focus:border-[#6E1B24] rounded-xs focus:outline-none text-[#1C1816]"
                    />
                  </div>
                  <span className="text-[9px] text-[#7A7067] mt-0.5 block">Sincronizado con carta web e IA</span>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-bold text-[#5E554E] mb-1">
                    Categoría *
                  </label>
                  <select
                    value={editingDish.categoria || 'Pizzas Artesanales'}
                    onChange={(e) => setEditingDish({ ...editingDish, categoria: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-[#DDD5C7] rounded-xs focus:outline-none focus:border-[#6E1B24] cursor-pointer"
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
                <label className="block text-[11px] uppercase tracking-wider font-bold text-[#5E554E] mb-1">
                  Descripción culinaria e Ingredientes
                </label>
                <textarea
                  rows="3"
                  placeholder="Detalle de ingredientes, tiempo de fermentación, preparación al horno de leña..."
                  value={editingDish.descripcion || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#DDD5C7] rounded-xs focus:outline-none focus:border-[#6E1B24] leading-relaxed"
                ></textarea>
              </div>

              {/* Fotografía del Platillo */}
              <div className="bg-[#F6F1EA] p-3.5 rounded-xs border border-[#DDD5C7] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#5E554E] flex items-center gap-1.5">
                    <Camera size={13} className="text-[#6E1B24]" />
                    Fotografía del Platillo
                  </label>
                  {editingDish.imagen_url && (
                    <button
                      type="button"
                      onClick={() => setEditingDish({ ...editingDish, imagen_url: '' })}
                      className="text-[10px] text-red-600 hover:text-red-800 underline cursor-pointer"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>

                {/* Preview de la imagen si está seleccionada */}
                {editingDish.imagen_url ? (
                  <div className="relative rounded-xs overflow-hidden h-36 border border-[#DDD5C7] bg-white group">
                    <img
                      src={editingDish.imagen_url}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 bg-white text-xs font-semibold text-[#1C1816] rounded-xs cursor-pointer hover:bg-gray-100 shadow-sm flex items-center gap-1">
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
                  <div className="border border-dashed border-[#C5BBAA] rounded-xs p-4 text-center bg-white/70">
                    <Camera size={26} className="mx-auto text-[#A89D8E] mb-1.5" />
                    <p className="text-xs text-[#5E554E] font-medium">Sube una fotografía del platillo</p>
                    <p className="text-[10px] text-[#8A8077] mb-3">Desde tu computadora, celular o cámara (máx. 4MB)</p>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1A382B] text-white text-xs font-semibold rounded-xs cursor-pointer hover:bg-[#122A20] shadow-xs">
                      <Upload size={12} /> Seleccionar Archivo / Foto
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
                <div className="space-y-2 pt-1 border-t border-[#E5DCD0]">
                  <div>
                    <span className="text-[10px] font-semibold text-[#7A7067] uppercase tracking-wider block mb-1">
                      O pegar enlace de imagen web (URL):
                    </span>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/foto-pizza.jpg"
                      value={editingDish.imagen_url || ''}
                      onChange={(e) => setEditingDish({ ...editingDish, imagen_url: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#DDD5C7] rounded-xs focus:outline-none focus:border-[#6E1B24]"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-[#7A7067] uppercase tracking-wider block mb-1">
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
                          className={`text-[10px] px-2 py-1 rounded-xs border cursor-pointer transition-colors ${
                            editingDish.imagen_url === preset.url
                              ? 'bg-[#6E1B24] text-white border-[#6E1B24]'
                              : 'bg-white hover:bg-[#EAE3D6] text-[#4A423C] border-[#DDD5C7]'
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
              <div className="flex items-center gap-2 pt-1 bg-[#FAF7F2] p-2.5 border border-[#E8DFCFC0] rounded-xs">
                <input
                  type="checkbox"
                  id="disponibleCheck"
                  checked={editingDish.disponible !== false}
                  onChange={(e) => setEditingDish({ ...editingDish, disponible: e.target.checked })}
                  className="w-4 h-4 text-[#1A382B] rounded-xs cursor-pointer accent-[#1A382B]"
                />
                <label htmlFor="disponibleCheck" className="text-xs text-[#2C2623] cursor-pointer font-medium select-none">
                  Disponible de inmediato en la carta web y comandero POS de mesas
                </label>
              </div>

              {/* Acciones */}
              <div className="pt-4 border-t border-[#EAE3D6] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingDish(null)}
                  className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-[#6B635E] hover:bg-[#F2ECE1] rounded-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingDish}
                  className="px-5 py-2 text-xs uppercase tracking-wider font-bold bg-[#6E1B24] hover:bg-[#58131B] text-white rounded-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save size={13} />
                  {savingDish ? 'Guardando...' : 'Guardar Platillo & Precio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
