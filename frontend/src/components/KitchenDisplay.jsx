import React, { useState } from 'react';
import { 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  ChefHat, 
  Wine, 
  Utensils, 
  Bell, 
  Filter, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function KitchenDisplay({ tickets = [], onUpdateTicketStatus }) {
  const [stationFilter, setStationFilter] = useState('TODAS'); // 'TODAS' | 'HORNO' | 'COCINA' | 'BARRA'

  // Filtrar platillos por estación
  const getFilteredItems = (items) => {
    if (stationFilter === 'TODAS') return items;
    return items.filter(item => {
      const cat = (item.categoria || '').toLowerCase();
      if (stationFilter === 'HORNO') {
        return cat.includes('pizza') || cat.includes('focaccia');
      }
      if (stationFilter === 'COCINA') {
        return cat.includes('pasta') || cat.includes('especialidad');
      }
      if (stationFilter === 'BARRA') {
        return cat.includes('bebida') || cat.includes('vino') || cat.includes('postre');
      }
      return true;
    });
  };

  // Contadores
  const pendingCount = tickets.filter(t => t.status === 'PENDIENTE').length;
  const cookingCount = tickets.filter(t => t.status === 'EN_PREPARACION').length;
  const readyCount = tickets.filter(t => t.status === 'LISTO').length;

  return (
    <div className="space-y-6">
      
      {/* Barra Superior del KDS: Estaciones y Métricas */}
      <div className="bg-[#1C1613] text-white p-4 sm:p-5 rounded-xs border border-[#3A2E28] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ChefHat className="text-[#D4B26F]" size={20} />
            <h3 className="font-serif-luxury text-xl font-bold tracking-wide">
              KDS • Pantalla de Producción & Horno
            </h3>
          </div>
          <p className="text-xs text-[#A69B8F]">
            Gestión en tiempo real de tiempos de cocina y salida de platos calientes.
          </p>
        </div>

        {/* Selector de Estación */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'TODAS', label: 'Todas las Estaciones', icon: Utensils },
            { id: 'HORNO', label: 'Horno de Piedra', icon: Flame },
            { id: 'COCINA', label: 'Cocina Caliente', icon: ChefHat },
            { id: 'BARRA', label: 'Barra & Cava', icon: Wine },
          ].map(st => {
            const Icon = st.icon;
            return (
              <button
                key={st.id}
                onClick={() => setStationFilter(st.id)}
                className={`px-3 py-1.5 rounded-xs text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  stationFilter === st.id
                    ? 'bg-[#6E1B24] text-white shadow-xs border border-[#B88E3E]'
                    : 'bg-[#2A211B] text-[#B5A89B] hover:bg-[#382D25] border border-[#3E3128]'
                }`}
              >
                <Icon size={13} className={stationFilter === st.id ? 'text-[#D4B26F]' : ''} />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contadores Rápidos de la Pantalla */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xs border-l-4 border-l-[#EF4444] border border-[#E3DBD0] shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-[#7A7067] font-semibold block">
            Por Iniciar
          </span>
          <span className="font-serif-luxury text-2xl font-bold text-[#EF4444]">
            {pendingCount} tickets
          </span>
        </div>
        <div className="bg-white p-3 rounded-xs border-l-4 border-l-[#F59E0B] border border-[#E3DBD0] shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-[#7A7067] font-semibold block">
            En Preparación / Horno
          </span>
          <span className="font-serif-luxury text-2xl font-bold text-[#D97706]">
            {cookingCount} mesas
          </span>
        </div>
        <div className="bg-white p-3 rounded-xs border-l-4 border-l-[#10B981] border border-[#E3DBD0] shadow-xs">
          <span className="text-[10px] uppercase tracking-wider text-[#7A7067] font-semibold block">
            Listo para Servir
          </span>
          <span className="font-serif-luxury text-2xl font-bold text-[#059669]">
            {readyCount} listos
          </span>
        </div>
      </div>

      {/* Cuadrícula de Tickets de Comanda */}
      {tickets.length === 0 ? (
        <div className="bg-white border border-[#E3DBD0] p-12 text-center rounded-xs">
          <ChefHat size={40} className="mx-auto mb-3 text-[#B88E3E] opacity-40" />
          <h4 className="font-serif-luxury text-xl font-bold text-[#1C1816] mb-1">
            Cocina al Día
          </h4>
          <p className="text-xs text-[#7A7067] max-w-md mx-auto">
            No hay comandas activas pendientes en cocina. Cuando los meseros envíen una orden desde el comandero de mesas, aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tickets.map(ticket => {
            const displayItems = getFilteredItems(ticket.items);
            if (displayItems.length === 0 && stationFilter !== 'TODAS') return null;

            // Colores según estado del ticket
            const statusConfig = {
              PENDIENTE: {
                bg: 'bg-[#FEF2F2]',
                border: 'border-[#EF4444]',
                badge: 'bg-[#EF4444] text-white',
                label: 'Por Iniciar'
              },
              EN_PREPARACION: {
                bg: 'bg-[#FFFBEB]',
                border: 'border-[#F59E0B]',
                badge: 'bg-[#F59E0B] text-white',
                label: 'En Preparación'
              },
              LISTO: {
                bg: 'bg-[#ECFDF5]',
                border: 'border-[#10B981]',
                badge: 'bg-[#10B981] text-white',
                label: 'Listo para Servir'
              }
            }[ticket.status] || {
              bg: 'bg-white',
              border: 'border-[#E3DBD0]',
              badge: 'bg-gray-500 text-white',
              label: ticket.status
            };

            return (
              <div 
                key={ticket.id} 
                className={`rounded-xs border-2 ${statusConfig.border} bg-white shadow-sm flex flex-col justify-between overflow-hidden`}
              >
                {/* Cabecera del Ticket */}
                <div className="bg-[#1C1613] text-white p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#6E1B24] border border-[#B88E3E] flex items-center justify-center font-serif-luxury font-bold text-sm">
                      {ticket.tableNumber}
                    </span>
                    <div>
                      <h4 className="font-serif-luxury font-bold text-base leading-tight">
                        Mesa {ticket.tableNumber}
                      </h4>
                      <span className="text-[9px] uppercase tracking-wider text-[#D4B26F]">
                        {ticket.zone} • {ticket.guests} pax
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-xs ${statusConfig.badge}`}>
                      {statusConfig.label}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-[#A69B8F] mt-1 justify-end font-mono">
                      <Clock size={10} />
                      <span>{ticket.timeAgo || 'Hace 4m'}</span>
                    </div>
                  </div>
                </div>

                {/* Lista de Platillos del Ticket */}
                <div className="p-4 flex-1 space-y-2.5 max-h-[300px] overflow-y-auto bg-[#FDFBF7]">
                  {displayItems.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-2.5 bg-white rounded-xs border border-[#E8DFCFC0] shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-baseline gap-2">
                          <span className="w-5 h-5 rounded-xs bg-[#1C1613] text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {item.cantidad}
                          </span>
                          <span className="text-sm font-bold text-[#1C1816] leading-snug">
                            {item.nombre}
                          </span>
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-xs bg-[#F4EFE6] text-[#6E1B24] border border-[#E0D7C9] shrink-0">
                          {item.tiempo}
                        </span>
                      </div>

                      {item.nota && (
                        <div className="mt-1.5 text-[10px] text-[#B88E3E] font-medium bg-[#FFFBEB] px-2 py-1 rounded-xs border border-[#FDE68A] flex items-center gap-1">
                          <AlertCircle size={11} className="shrink-0 text-[#D97706]" />
                          <span>Instrucción: <strong>{item.nota}</strong></span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Acciones de Estado del Ticket */}
                <div className="p-3 bg-[#FAF7F2] border-t border-[#E8DFCF] flex items-center gap-2">
                  {ticket.status === 'PENDIENTE' && (
                    <button
                      onClick={() => onUpdateTicketStatus(ticket.id, 'EN_PREPARACION')}
                      className="w-full py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs uppercase tracking-wider font-bold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Flame size={13} /> Entrar a Horno / Cocina
                    </button>
                  )}

                  {ticket.status === 'EN_PREPARACION' && (
                    <button
                      onClick={() => onUpdateTicketStatus(ticket.id, 'LISTO')}
                      className="w-full py-2 bg-[#059669] hover:bg-[#047857] text-white text-xs uppercase tracking-wider font-bold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 size={13} /> Listo para Servir
                    </button>
                  )}

                  {ticket.status === 'LISTO' && (
                    <button
                      onClick={() => onUpdateTicketStatus(ticket.id, 'DESPACHADO')}
                      className="w-full py-2 bg-[#475569] hover:bg-[#334155] text-white text-xs uppercase tracking-wider font-semibold rounded-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 size={13} /> Servido en Mesa (Archivar)
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
