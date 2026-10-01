import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Calendar, 
  Users, 
  MessageSquare, 
  X, 
  Send, 
  Check, 
  ArrowRight,
  Wine,
  Flame,
  ChevronDown,
  Compass,
  ExternalLink,
  Lock,
  Utensils
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import AdminDashboard from './components/AdminDashboard';

const InstagramIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

export default function App() {
  const [viewMode, setViewMode] = useState('client'); // 'client' | 'admin'
  const [activeCategory, setActiveCategory] = useState('Pizzas');
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Concierge Privado (Chat)
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'concierge',
      text: 'Benvenuto a Porto Brezza. Soy su Concierge gastronómico. Con gusto puedo orientarle sobre las especialidades de nuestro horno de piedra o asistirle con su reservación en nuestra terraza en Plaza Costasur.'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Formulario de Reserva
  const [reservation, setReservation] = useState({
    nombre: '',
    telefono: '',
    fecha: new Date().toISOString().split('T')[0],
    hora: '20:00',
    personas: 2,
    zona: 'Terraza al Atardecer',
    notas: ''
  });
  const [bookingResult, setBookingResult] = useState(null);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setViewMode('admin');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  // Auto-scroll fluido al recibir o enviar mensajes en el Concierge IA
  useEffect(() => {
    if (isConciergeOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isConciergeOpen]);

  useEffect(() => {
    async function fetchMenu() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .order('precio', { ascending: true });

        if (!error && data && data.length > 0) {
          setMenuItems(data);
        } else {
          setMenuItems(defaultMenu);
        }
      } catch (err) {
        setMenuItems(defaultMenu);
      } finally {
        setLoadingMenu(false);
      }
    }
    fetchMenu();
  }, []);

  const menuCategories = [
    { id: 'Pizzas', label: 'Pizzas Artesanales', tag: 'Horno de Piedra' },
    { id: 'Focaccias', label: 'Focaccias', tag: 'Masa Madre' },
    { id: 'Pastas', label: 'Pastas & Especialidades', tag: 'Tradición' },
    { id: 'Dolci', label: 'Postres & Vinos', tag: 'Selección' },
  ];

  const currentDishes = menuItems.filter(item => {
    if (activeCategory === 'Pizzas') return item.categoria?.includes('Pizza');
    if (activeCategory === 'Focaccias') return item.categoria?.includes('Focaccia');
    if (activeCategory === 'Pastas') return item.categoria?.includes('Pasta') || item.categoria?.includes('Especialidad');
    if (activeCategory === 'Dolci') return item.categoria?.includes('Postre') || item.categoria?.includes('Bebida') || item.categoria?.includes('Vino');
    return true;
  });

  const handleConciergeSend = (customText) => {
    const text = customText || inputMessage;
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Auto-scroll inmediato al enviar mensaje
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Normalizar texto quitando acentos y signos diacríticos
    const norm = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    setTimeout(() => {
      let reply = '';
      let actionType = null; // 'reserva' | 'carta' | 'whatsapp'

      // 1. Preguntas sobre Pizzas
      if (norm.includes('pizza')) {
        const pizzas = menuItems.filter(i => (i.categoria || '').toLowerCase().includes('pizza'));
        if (norm.includes('porto brezza') || norm.includes('especial') || norm.includes('burrata')) {
          reply = 'Nuestra creación insignia es la Pizza Porto Brezza ($340 MXN): elaborada en horno de piedra con masa de 48 hrs de fermentación, jamón serrano madurado, burrata fresca entera al centro, tomates cherry confitados, pesto artesanal genovés y arúgula tierna.';
        } else if (norm.includes('margherita') || norm.includes('margarita')) {
          reply = 'La Pizza Margherita D.O.P. ($240 MXN) es nuestra joya tradicional: salsa de tomates San Marzano seleccionados, auténtica mozzarella fior di latte y hojas frescas de albahaca.';
        } else if (norm.includes('serrano') || norm.includes('prosciutto') || norm.includes('rucula')) {
          reply = 'La Pizza Prosciutto e Rúcula ($310 MXN) combina finas lonchas de jamón curado de reserva, láminas de parmesano reggiano de guarda y hojas frescas de arúgula sobre nuestra base crocante.';
        } else if (pizzas.length > 0) {
          const lista = pizzas.slice(0, 4).map(p => `• ${p.nombre} ($${p.precio} MXN): ${p.descripcion}`).join('\n\n');
          reply = `Nuestras pizzas artesanales se preparan en horno de piedra a más de 400°C con masa madre de fermentación lenta (48 hrs):\n\n${lista}\n\n¿Le gustaría reservar una mesa o consultar alguna recomendación especial?`;
          actionType = 'carta';
        } else {
          reply = 'Nuestras pizzas artesanales son horneadas a la leña y piedra viva a más de 400°C. Destacan la Pizza Porto Brezza con burrata fresca ($340 MXN) y la Margherita D.O.P. ($240 MXN).';
          actionType = 'carta';
        }
      } 
      // 2. Pastas y Especialidades
      else if (norm.includes('pasta') || norm.includes('fettuccine') || norm.includes('spaghetti') || norm.includes('carbonara') || norm.includes('lasagna')) {
        reply = 'Nuestras pastas artesanales se cocinan al dente con recetas tradicionales italianas. Servimos especialidades como el Fettuccine al Pesto Genovés con piñones tostados ($280 MXN) y Spaghetti al Pomodoro fresco y albahaca. ¿Desea maridarlo con alguno de nuestros vinos italianos?';
        actionType = 'carta';
      }
      // 3. Focaccias
      else if (norm.includes('focaccia') || norm.includes('pan')) {
        reply = 'Nuestras focaccias de masa madre reposada se hornean con aceite de oliva extravirgen. Ofrecemos la Focaccia Clásica al Romero Silvestre con sal marina en escamas ($180 MXN) y la Focaccia Caprese con mozzarella fresca y tomate confitado ($220 MXN).';
        actionType = 'carta';
      }
      // 4. Postres / Dolci / Tiramisú
      else if (norm.includes('postre') || norm.includes('dolci') || norm.includes('tiramisu') || norm.includes('dulce') || norm.includes('cafe')) {
        reply = 'Para el cierre perfecto servimos el auténtico Tiramisù Tradizionale ($190 MXN), preparado con queso mascarpone italiano, café espresso de grano y cacao amargo, además de nuestra clásica Panna Cotta con coulis de frutos silvestres ($170 MXN).';
        actionType = 'carta';
      }
      // 5. Vinos / Cava / Maridaje / Cócteles / Bebidas
      else if (norm.includes('vino') || norm.includes('maridaje') || norm.includes('copa') || norm.includes('cava') || norm.includes('coctel') || norm.includes('cerveza') || norm.includes('aperol') || norm.includes('trago')) {
        reply = 'Nuestra cava reúne selectas etiquetas de la Toscana, Friuli y Piamonte (Chianti Classico, Pinot Grigio, Prosecco), además de vinos premium del Valle de Guadalupe. También preparamos coctelería clásica italiana como Aperol Spritz, Negroni y Limoncello artesanal.';
      }
      // 6. Especialidad / Recomendación / Qué pedir
      else if (norm.includes('recomiend') || norm.includes('especialidad') || norm.includes('favorito') || norm.includes('mejor') || norm.includes('sugier')) {
        reply = 'Nuestra recomendación estrella es comenzar con una Focaccia Caprese al centro, continuar con la Pizza Porto Brezza con burrata fresca al horno de piedra ($340 MXN) maridada con una copa de Chianti Classico, y culminar con nuestro Tiramisù casero.';
      }
      // 7. Horarios / Apertura / Cierre
      else if (norm.includes('hora') || norm.includes('abren') || norm.includes('cierran') || norm.includes('dias') || norm.includes('turno') || norm.includes('abierto')) {
        reply = 'Porto Brezza abre diariamente de lunes a domingo de 13:00 a 23:00 hrs en Plaza Costasur. El horario predilecto para disfrutar del atardecer en terraza es entre 18:30 y 19:30 hrs.';
        actionType = 'reserva';
      }
      // 8. Ubicación / Dónde están / Dirección / Terraza
      else if (norm.includes('donde') || norm.includes('ubicacion') || norm.includes('direccion') || norm.includes('llegar') || norm.includes('mapa') || norm.includes('plaza') || norm.includes('costasur') || norm.includes('cabos')) {
        reply = 'Nos ubicamos en Plaza Costasur, El Tezal, Los Cabos, B.C.S. Nuestra terraza ofrece una vista privilegiada al atardecer sobre las lomas del corredor turístico, con estacionamiento cómodo y privado.';
      }
      // 9. Reservaciones / Mesas / Atardecer
      else if (norm.includes('reserva') || norm.includes('mesa') || norm.includes('apartar') || norm.includes('comensal') || norm.includes('disponib') || norm.includes('persona')) {
        reply = 'Con el mayor gusto podemos asegurar su mesa. Puede completar el formulario de reservaciones en esta página (sección "Reserve su Experiencia") o escribirnos a nuestro WhatsApp directo (+52 624 211 6144). ¿Para cuántas personas y a qué hora planea su visita?';
        actionType = 'reserva';
      }
      // 10. Opciones Vegetarianas / Veganas / Sin carne
      else if (norm.includes('vegetariana') || norm.includes('vegano') || norm.includes('sin carne') || norm.includes('saludable')) {
        reply = 'Ofrecemos exquisitas alternativas vegetarianas: la Pizza Margherita D.O.P., la Pizza de Vegetales Asados al horno de piedra, la Focaccia Caprese con mozzarella fresca y la Focaccia Clásica al Romero perfumada al aceite de oliva extravirgen.';
        actionType = 'carta';
      }
      // 11. Alergias / Gluten / Masa
      else if (norm.includes('gluten') || norm.includes('alergia') || norm.includes('intoleran') || norm.includes('lactosa')) {
        reply = 'Nuestras masas de pizza y focaccia tienen más de 48 horas de fermentación lenta natural, lo que las hace extraordinariamente ligeras y de fácil digestión. Si tiene alguna alergia severa o intolerancia, nuestro equipo culinario puede adaptar los ingredientes con previo aviso.';
      }
      // 12. Estacionamiento / Valet
      else if (norm.includes('estacionamiento') || norm.includes('parking') || norm.includes('carro') || norm.includes('coche') || norm.includes('valet')) {
        reply = 'Sí, Plaza Costasur cuenta con amplio estacionamiento iluminado, seguro y de fácil acceso directamente frente al restaurante para la comodidad de todos nuestros clientes.';
      }
      // 13. Métodos de Pago / Costos / Precios / Tarjetas / Efectivo
      else if (norm.includes('pago') || norm.includes('tarjeta') || norm.includes('efectivo') || norm.includes('dolar') || norm.includes('precio') || norm.includes('costo') || norm.includes('cuanto') || norm.includes('vale')) {
        reply = 'Aceptamos todas las tarjetas de crédito y débito (Visa, Mastercard, American Express), así como efectivo en pesos mexicanos (MXN) y dólares (USD). Los platillos principales oscilan entre $180 y $340 MXN.';
      }
      // 14. Código de vestir
      else if (norm.includes('vestir') || norm.includes('ropa') || norm.includes('dress code') || norm.includes('etiqueta')) {
        reply = 'Nuestro código es Smart Casual / Informal Elegante. Queremos que se sienta cómodo y disfrute del aire marino y la gastronomía italiana con distinción relajada.';
      }
      // 15. Niños y Familia
      else if (norm.includes('nino') || norm.includes('bebe') || norm.includes('hijo') || norm.includes('familia')) {
        reply = '¡Bienvenidos en familia! Contamos con un ambiente acogedor y platillos ideales para los más pequeños, como pastas al burro o al pomodoro y pizzas Margherita recién horneadas.';
      }
      // 16. Mascotas / Pet Friendly
      else if (norm.includes('perro') || norm.includes('mascota') || norm.includes('pet')) {
        reply = 'Nuestra área de terraza exterior en Plaza Costasur es pet-friendly para mascotas educadas con correa, para que disfrute de la brisa con toda la familia.';
      }
      // 17. Contacto / Teléfono / WhatsApp
      else if (norm.includes('telefono') || norm.includes('whatsapp') || norm.includes('llamar') || norm.includes('contacto') || norm.includes('celular')) {
        reply = 'Puede comunicarse directamente a nuestra línea telefónica y WhatsApp: +52 624 211 6144. Será un placer atenderle.';
        actionType = 'whatsapp';
      }
      // 18. Saludos / Benvenuto
      else if (norm.includes('hola') || norm.includes('buenas') || norm.includes('buenos dias') || norm.includes('buena tarde') || norm.includes('saludos') || norm.includes('ciao')) {
        reply = '¡Benvenuto a Porto Brezza! Es un honor saludarle. Soy su Concierge gastronómico. ¿Desea conocer nuestras especialidades al horno de piedra, consultar maridajes de vino o reservar una mesa en nuestra terraza al atardecer?';
      }
      // Fallback amigable y guiado
      else {
        reply = 'Con gusto le asisto. En Porto Brezza cuidamos cada detalle de la auténtica cocina italiana. ¿Desea consultar las opciones de nuestra carta de pizzas al horno de piedra, opciones vegetarianas, maridajes de vino o reservar su mesa para hoy?';
      }

      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          sender: 'concierge', 
          text: reply,
          action: actionType
        }
      ]);
      setIsTyping(false);
      
      // Auto-scroll garantizado tras recibir respuesta
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 600);
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setBookingResult({ status: 'loading' });

    try {
      // Intentar API backend primero
      const res = await fetch('http://localhost:8080/api/v1/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCliente: reservation.nombre,
          telefonoCliente: reservation.telefono,
          fecha: reservation.fecha,
          hora: reservation.hora + ':00',
          personas: parseInt(reservation.personas),
          notas: `${reservation.zona} - ${reservation.notas}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBookingResult({
          status: 'success',
          code: data.codigoReserva,
          message: data.mensajeConfirmacion || 'Su reservación ha quedado confirmada.'
        });
        return;
      }
    } catch (e) {
      // Fallback a Supabase
    }

    try {
      const code = 'PB-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      await supabase.from('reservas').insert([
        {
          restaurante_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          nombre_cliente: reservation.nombre,
          telefono_cliente: reservation.telefono,
          fecha: reservation.fecha,
          hora: reservation.hora + ':00',
          personas: parseInt(reservation.personas),
          codigo_reserva: code,
          notas: `${reservation.zona} - ${reservation.notas}`,
          estado: 'CONFIRMADA'
        }
      ]);

      setBookingResult({
        status: 'success',
        code: code,
        message: 'Su reservación ha quedado debidamente registrada en nuestro libro de mesa.'
      });
    } catch (err) {
      setBookingResult({
        status: 'error',
        message: 'No fue posible completar la reserva en línea. Por favor llámenos al 624 211 6144.'
      });
    }
  };

  if (viewMode === 'admin') {
    return <AdminDashboard onExit={() => { setViewMode('client'); window.location.hash = ''; }} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#221E1C] flex flex-col font-sans-clean selection:bg-[#6E1B24] selection:text-white">
      
      {/* 1. Línea Tricolor Italiana Sutil */}
      <div className="italian-tricolor-line"></div>

      {/* 2. Barra Superior Discreta con Espaciado Cómodo */}
      <div className="border-b border-[#EAE3D6] bg-[#F4EFE6] text-[10px] sm:text-[11px] py-1.5 sm:py-2 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 text-[#5E554E] tracking-wider uppercase">
          <div className="flex items-center gap-2 sm:gap-6 truncate">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <MapPin size={11} className="text-[#B88E3E] shrink-0" /> 
              <span className="hidden sm:inline">Plaza Costasur, El Tezal • </span>Los Cabos, B.C.S.
            </span>
            <span className="hidden md:inline text-[#D8CFC2]">|</span>
            <span className="hidden md:flex items-center gap-1.5">
              <Clock size={11} className="text-[#B88E3E]" /> 13:00 a 23:00 hrs
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a 
              href="https://wa.me/526242116144" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1 text-[#1A382B] hover:text-[#6E1B24] transition-colors font-medium whitespace-nowrap text-[10px] sm:text-[11px]"
            >
              <Phone size={11} className="text-[#1A382B]" /> 
              <span>624 211 6144</span>
            </a>
            <span className="text-[#D8CFC2]">|</span>
            <button
              onClick={() => setViewMode('admin')}
              className="text-[#8A8077] hover:text-[#6E1B24] text-[9px] sm:text-[10px] tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1 font-semibold"
              title="Acceso Propietario / Admin"
            >
              <Lock size={10} className="text-[#B88E3E]" />
              <span className="sm:hidden">Admin</span>
              <span className="hidden sm:inline">Acceso Propietario</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Navegación Principal y Logotipo con Aire y Elegancia */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFCFC0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-4">
          
          {/* Enlaces Izquierda (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs tracking-[0.2em] uppercase font-medium text-[#463E38]">
            <a href="#carta" className="hover:text-[#6E1B24] transition-colors">La Carta</a>
            <a href="#terraza" className="hover:text-[#6E1B24] transition-colors">La Terraza</a>
            <a href="#historia" className="hover:text-[#6E1B24] transition-colors">Nuestra Esencia</a>
          </nav>

          {/* Logo con Espacio Cómodo */}
          <div className="flex items-center">
            <a href="#" className="flex items-center gap-2.5 sm:gap-3 group">
              <img 
                src="/Gemini_Generated_Image_78a1e378a1e378a1.jpg" 
                alt="Porto Brezza" 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-[#B88E3E]/60 shadow-sm shrink-0"
              />
              <div className="text-left">
                <div className="font-serif-luxury text-xl sm:text-3xl font-bold tracking-[0.06em] leading-none text-[#1C1816] whitespace-nowrap">
                  <span className="text-[#1A382B]">PORTO</span> <span className="text-[#6E1B24]">BREZZA</span>
                </div>
                <span className="block text-[8px] sm:text-[9px] tracking-[0.25em] text-[#B88E3E] uppercase font-semibold mt-1 whitespace-nowrap">
                  Ristorante Italiano
                </span>
              </div>
            </a>
          </div>

          {/* Botón Reservar Estilizado y Proporcionado */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="#reservar"
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-sm bg-[#6E1B24] hover:bg-[#58131B] text-white text-[10px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold transition-all shadow-sm whitespace-nowrap cursor-pointer"
            >
              <span className="sm:hidden">Reservar</span>
              <span className="hidden sm:inline">Reservar Mesa</span>
            </a>
          </div>
        </div>
      </header>

      {/* 4. Hero Section: Elegancia Mediterránea */}
      <section className="relative min-h-[580px] flex items-center justify-center overflow-hidden">
        {/* Imagen de Fondo: Terraza al Atardecer */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/image copy 2.png" 
            alt="Terraza al atardecer Porto Brezza" 
            className="w-full h-full object-cover object-center filter brightness-[0.45]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1816] via-transparent to-black/30"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white py-16">
          <div className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-[#D4B26F] mb-4 font-light">
            <span className="w-8 h-[1px] bg-[#D4B26F]/60"></span>
            Sapori d'Italia con vista al mar
            <span className="w-8 h-[1px] bg-[#D4B26F]/60"></span>
          </div>

          <h1 className="font-serif-luxury text-4xl sm:text-6xl md:text-7xl font-normal leading-[1.08] tracking-tight mb-6 text-[#FAF7F2]">
            Cocina italiana que enamora.
          </h1>

          <p className="max-w-xl mx-auto text-sm sm:text-base text-[#DCD4C7] font-light leading-relaxed mb-8">
            Pizzas al horno de piedra, masas de fermentación pausada e ingredientes de origen protegida bajo el cielo dorado de Los Cabos.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#carta"
              className="px-7 py-3.5 bg-[#FAF7F2] hover:bg-white text-[#1C1816] text-[11px] tracking-[0.25em] uppercase font-semibold transition-all shadow-md"
            >
              Explorar La Carta
            </a>
            <a
              href="#reservar"
              className="px-7 py-3.5 border border-[#FAF7F2]/60 hover:border-white text-[#FAF7F2] hover:bg-white/10 text-[11px] tracking-[0.25em] uppercase font-medium transition-all"
            >
              Asegurar su Mesa
            </a>
          </div>
        </div>
      </section>

      {/* 5. Nuestra Esencia: Horno & Tradición */}
      <section id="historia" className="py-20 px-6 border-b border-[#E8DFCFC0]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#B88E3E] font-semibold block mb-2">
              L'Antica Tradizione
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1C1816] leading-tight mb-6">
              El secreto del fuego, el tiempo y la harina.
            </h2>
            <p className="text-xs sm:text-sm text-[#5E554E] leading-relaxed mb-4 font-light">
              En Porto Brezza respetamos los tiempos sagrados de la panadería italiana. Cada masa reposa durante más de 48 horas para obtener una ligereza y textura inigualables, aireada en los bordes y crujiente en la base.
            </p>
            <p className="text-xs sm:text-sm text-[#5E554E] leading-relaxed mb-6 font-light">
              Horneadas a la leña y piedra viva a más de 400°C con mozzarella fior di latte, jitomates San Marzano y aceites de oliva extravirgen seleccionados.
            </p>

            <div className="pt-4 border-t border-[#EAE3D6] flex items-center gap-8 text-xs text-[#463E38]">
              <div>
                <span className="font-serif-luxury text-2xl text-[#6E1B24] font-semibold block">48 hrs</span>
                <span className="text-[10px] uppercase tracking-wider text-[#8A8077]">Fermentación lenta</span>
              </div>
              <div className="w-[1px] h-8 bg-[#EAE3D6]"></div>
              <div>
                <span className="font-serif-luxury text-2xl text-[#1A382B] font-semibold block">420°C</span>
                <span className="text-[10px] uppercase tracking-wider text-[#8A8077]">Horno de piedra</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-sm overflow-hidden shadow-2xl border-4 border-white">
              <img 
                src="/image copy 3.png" 
                alt="Pizza Porto Brezza con Burrata" 
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-[#FAF7F2] p-5 border border-[#B88E3E]/40 shadow-lg max-w-[240px] hidden sm:block">
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#B88E3E] font-semibold block mb-1">
                Piatto Speciale
              </span>
              <p className="font-serif-luxury text-lg text-[#1C1816] leading-snug">
                Pizza Porto Brezza con burrata fresca y jamón serrano.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. La Carta: Menú Editorial Estilo Restaurante Clásico */}
      <section id="carta" className="py-20 px-6 bg-[#F5F0E6]">
        <div className="max-w-4xl mx-auto">
          
          {/* Encabezado Editorial */}
          <div className="text-center mb-14">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#B88E3E] font-semibold block mb-2">
              Menu Degustazione
            </span>
            <h2 className="font-serif-luxury text-4xl sm:text-5xl text-[#1C1816] font-normal tracking-wide">
              La Carta
            </h2>
            <div className="w-16 h-[1px] bg-[#B88E3E] mx-auto my-4"></div>
            <p className="text-xs text-[#6B635E] max-w-md mx-auto italic">
              Precios en Moneda Nacional (MXN). Todos nuestros platillos se preparan al momento.
            </p>
          </div>

          {/* Navegación de Categorías */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-12">
            {menuCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2 text-xs tracking-[0.18em] uppercase transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#1A382B] text-white shadow-sm'
                    : 'bg-white/60 hover:bg-white text-[#5E554E] border border-[#E0D8C8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Lista de Platillos Estilo Carta Impresa */}
          <div className="bg-[#FAF7F2] p-8 sm:p-12 border border-[#E3D8C5] shadow-xl paper-shadow">
            {loadingMenu ? (
              <p className="text-center text-xs text-[#8A8077] py-12">Consultando la carta con cocina...</p>
            ) : (
              <div className="space-y-8 divide-y divide-[#EDE5D6]">
                {currentDishes.map((item, idx) => {
                  const isSpecialty = item.nombre.toLowerCase().includes('porto brezza');
                  return (
                    <div key={item.id || idx} className={`${idx !== 0 ? 'pt-8' : ''} group flex flex-col sm:flex-row gap-4 sm:gap-6 items-start justify-between`}>
                      <div className="flex-1 w-full">
                        <div className="flex items-baseline justify-between gap-4 mb-1.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif-luxury text-xl sm:text-2xl text-[#1C1816] font-medium tracking-wide group-hover:text-[#6E1B24] transition-colors">
                              {item.nombre}
                            </h3>
                            {isSpecialty && (
                              <span className="text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 bg-[#6E1B24] text-white font-semibold rounded-xs">
                                Specialità
                              </span>
                            )}
                          </div>
                          <div className="flex-1 border-b border-dotted border-[#D8CFC0] mx-2 hidden sm:block"></div>
                          <span className="font-serif-luxury text-lg sm:text-xl font-semibold text-[#6E1B24] whitespace-nowrap">
                            ${Number(item.precio).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-[13px] text-[#6B635E] font-light leading-relaxed max-w-2xl italic">
                          {item.descripcion}
                        </p>
                      </div>

                      {/* Imagen elegante del platillo si existe */}
                      {item.imagen_url && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xs overflow-hidden border border-[#D8CFC0] shadow-xs bg-[#F4EFE6] order-first sm:order-last">
                          <img
                            src={item.imagen_url}
                            alt={item.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setIsConciergeOpen(true);
                handleConciergeSend('¿Qué maridaje de vino me sugieren para la pizza especial Porto Brezza?');
              }}
              className="text-xs text-[#6E1B24] hover:text-[#1A382B] underline tracking-widest uppercase font-medium transition-colors"
            >
              ¿Desea consultar sugerencias de maridaje con nuestro Concierge? &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 7. La Terraza al Atardecer */}
      <section id="terraza" className="py-20 px-6 border-b border-[#E8DFCFC0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#B88E3E] font-semibold block mb-2">
              Vista Panoramica
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1C1816]">
              La Terraza de Plaza Costasur
            </h2>
            <p className="text-xs text-[#6B635E] mt-3 font-light leading-relaxed">
              El atardecer en Los Cabos se contempla mejor con una copa de Chianti y el aroma del pan recién horneado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-sm overflow-hidden shadow-md bg-white border border-[#EAE3D6]">
              <img src="/image copy 2.png" alt="Terraza con sombrillas rojas" className="w-full h-64 object-cover" />
              <div className="p-5">
                <span className="text-[10px] uppercase tracking-widest text-[#B88E3E] block mb-1">Ambiente Exterior</span>
                <h4 className="font-serif-luxury text-lg text-[#1C1816]">Mesas al Aire Libre</h4>
                <p className="text-xs text-[#6B635E] font-light mt-1">
                  Sombrillas clásicas rojas y luces cálidas para veladas íntimas o de celebración.
                </p>
              </div>
            </div>

            <div className="rounded-sm overflow-hidden shadow-md bg-white border border-[#EAE3D6]">
              <img src="/image copy 4.png" alt="Pastas y Vinos" className="w-full h-64 object-cover" />
              <div className="p-5">
                <span className="text-[10px] uppercase tracking-widest text-[#B88E3E] block mb-1">Cava & Pastas</span>
                <h4 className="font-serif-luxury text-lg text-[#1C1816]">Fettuccine & Vinos</h4>
                <p className="text-xs text-[#6B635E] font-light mt-1">
                  Salsas cocinadas a fuego lento y selección de uvas italianas y de Baja California.
                </p>
              </div>
            </div>

            <div className="rounded-sm overflow-hidden shadow-md bg-white border border-[#EAE3D6]">
              <img src="/image copy.png" alt="Mesa servida con vino" className="w-full h-64 object-cover" />
              <div className="p-5">
                <span className="text-[10px] uppercase tracking-widest text-[#B88E3E] block mb-1">Hospitalidad</span>
                <h4 className="font-serif-luxury text-lg text-[#1C1816]">Atención Personal</h4>
                <p className="text-xs text-[#6B635E] font-light mt-1">
                  Servicio cálido y atento pensado para que cada visita sea un recuerdo memorable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Reservaciones en Línea */}
      <section id="reservar" className="py-20 px-6 bg-[#FAF7F2]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#B88E3E] font-semibold block mb-2">
              Prenotazione
            </span>
            <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#1C1816]">
              Reserve su Experiencia
            </h2>
            <p className="text-xs text-[#6B635E] mt-2 font-light">
              Le sugerimos reservar con anticipación para asegurar mesa en terraza durante el atardecer.
            </p>
          </div>

          <div className="bg-white p-8 sm:p-12 border border-[#E5DBC8] shadow-lg">
            {bookingResult?.status === 'success' ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#1A382B]/10 text-[#1A382B] flex items-center justify-center mx-auto border border-[#1A382B]/30">
                  <Check size={24} />
                </div>
                <h3 className="font-serif-luxury text-2xl text-[#1C1816]">
                  Grazie Mille
                </h3>
                <p className="text-xs text-[#5E554E] max-w-md mx-auto leading-relaxed">
                  {bookingResult.message}
                </p>
                <div className="py-3 px-6 bg-[#FAF7F2] border border-[#B88E3E]/40 inline-block">
                  <span className="text-[9px] uppercase tracking-widest text-[#8A8077] block">Código de Reservación</span>
                  <span className="font-serif-luxury text-2xl font-bold text-[#6E1B24] tracking-wider">{bookingResult.code}</span>
                </div>
                <div>
                  <a
                    href={`https://wa.me/526242116144?text=Buenas%20noches,%20deseo%20confirmar%20mi%20reserva%20${bookingResult.code}%20a%20nombre%20de%20${reservation.nombre}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-4 text-xs text-[#1A382B] underline tracking-wider uppercase font-semibold"
                  >
                    Confirmar por WhatsApp con el restaurante &rarr;
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5E554E] font-medium mb-1.5">
                      Nombre y Apellido
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Sofia Loren"
                      value={reservation.nombre}
                      onChange={(e) => setReservation({...reservation, nombre: e.target.value})}
                      className="w-full bg-[#FAF7F2] border border-[#D8CFBF] px-3.5 py-2.5 text-xs text-[#1C1816] focus:outline-none focus:border-[#6E1B24]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5E554E] font-medium mb-1.5">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+52 624 000 0000"
                      value={reservation.telefono}
                      onChange={(e) => setReservation({...reservation, telefono: e.target.value})}
                      className="w-full bg-[#FAF7F2] border border-[#D8CFBF] px-3.5 py-2.5 text-xs text-[#1C1816] focus:outline-none focus:border-[#6E1B24]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5E554E] font-medium mb-1.5">
                      Fecha
                    </label>
                    <input
                      type="date"
                      required
                      value={reservation.fecha}
                      onChange={(e) => setReservation({...reservation, fecha: e.target.value})}
                      className="w-full bg-[#FAF7F2] border border-[#D8CFBF] px-3 py-2 text-xs text-[#1C1816] focus:outline-none focus:border-[#6E1B24]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5E554E] font-medium mb-1.5">
                      Horario
                    </label>
                    <select
                      value={reservation.hora}
                      onChange={(e) => setReservation({...reservation, hora: e.target.value})}
                      className="w-full bg-[#FAF7F2] border border-[#D8CFBF] px-3 py-2 text-xs text-[#1C1816] focus:outline-none focus:border-[#6E1B24]"
                    >
                      <option value="13:00">13:00 hrs</option>
                      <option value="14:00">14:00 hrs</option>
                      <option value="15:00">15:00 hrs</option>
                      <option value="18:30">18:30 hrs (Atardecer)</option>
                      <option value="19:30">19:30 hrs</option>
                      <option value="20:30">20:30 hrs (Cena)</option>
                      <option value="21:30">21:30 hrs</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#5E554E] font-medium mb-1.5">
                      Comensales
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={reservation.personas}
                      onChange={(e) => setReservation({...reservation, personas: e.target.value})}
                      className="w-full bg-[#FAF7F2] border border-[#D8CFBF] px-3 py-2 text-xs text-[#1C1816] focus:outline-none focus:border-[#6E1B24]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#5E554E] font-medium mb-1.5">
                    Preferencia de Mesa o Motivo Especial
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Terraza exterior, celebración de aniversario, cumpleaños..."
                    value={reservation.notas}
                    onChange={(e) => setReservation({...reservation, notas: e.target.value})}
                    className="w-full bg-[#FAF7F2] border border-[#D8CFBF] px-3.5 py-2.5 text-xs text-[#1C1816] focus:outline-none focus:border-[#6E1B24]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#6E1B24] hover:bg-[#58131B] text-white text-[11px] tracking-[0.25em] uppercase font-semibold transition-all shadow cursor-pointer"
                >
                  Confirmar Solicitud de Reserva
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 9. Pie de Página de Gran Lujo Italiano */}
      <footer className="bg-[#14100E] text-[#D8CFBF] border-t border-[#B88E3E]/30 relative overflow-hidden">
        
        {/* Banner Superior de Invitación */}
        <div className="border-b border-[#2A221E] py-12 px-6 bg-[#181310]">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <span className="text-[10px] uppercase tracking-[0.35em] text-[#D4B26F] font-semibold block mb-1">
                Una Serata Indimenticabile
              </span>
              <h3 className="font-serif-luxury text-2xl sm:text-3xl text-white">
                ¿Planea una ocasión especial o cena al atardecer?
              </h3>
              <p className="text-xs text-[#9E9284] font-light mt-1">
                Asegure su mesa en la terraza de Plaza Costasur o comuníquese directamente con nuestra anfitriona.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#reservar"
                className="px-6 py-3 bg-[#6E1B24] hover:bg-[#58131B] text-white text-[11px] tracking-[0.2em] uppercase font-semibold transition-all shadow-md"
              >
                Reservar en Línea
              </a>
              <a
                href="https://wa.me/526242116144?text=Hola%20Porto%20Brezza,%20deseo%20hacer%20una%20consulta%20de%20mesa"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 border border-[#B88E3E]/60 hover:border-[#D4B26F] text-[#D4B26F] hover:text-white text-[11px] tracking-[0.2em] uppercase font-medium transition-all inline-flex items-center gap-2"
              >
                <Phone size={13} /> WhatsApp Directo
              </a>
            </div>
          </div>
        </div>

        {/* Columnas Principales del Footer */}
        <div className="max-w-6xl mx-auto py-16 px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-xs">
          
          {/* Columna 1: Identidad y Emblema */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/Gemini_Generated_Image_78a1e378a1e378a1.jpg" 
                alt="Porto Brezza" 
                className="w-14 h-14 rounded-full object-cover border border-[#B88E3E] shadow-md"
              />
              <div>
                <div className="font-serif-luxury text-xl font-bold tracking-wider leading-tight text-white">
                  <span className="text-[#3E7D5C]">PORTO</span> <span className="text-[#B83240]">BREZZA</span>
                </div>
                <span className="text-[9px] tracking-[0.3em] uppercase text-[#D4B26F] font-semibold block">
                  Ristorante Italiano
                </span>
              </div>
            </div>

            <p className="text-xs text-[#9E9284] leading-relaxed font-light">
              Auténtica cocina italiana que enamora. Horno de piedra viva, fermentación lenta y vista a los atardeceres de Los Cabos.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#201815] border border-[#3A2E28] hover:border-[#D4B26F] text-[#D4B26F] flex items-center justify-center transition-colors"
                title="Síguenos en Instagram"
              >
                <InstagramIcon size={16} />
              </a>
              <a
                href="https://wa.me/526242116144"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-[#201815] border border-[#3A2E28] hover:border-[#25D366] text-[#25D366] flex items-center justify-center transition-colors"
                title="Escríbenos por WhatsApp"
              >
                <Phone size={15} />
              </a>
              <a
                href="#reservar"
                className="w-9 h-9 rounded-full bg-[#201815] border border-[#3A2E28] hover:border-[#B83240] text-[#B83240] flex items-center justify-center transition-colors"
                title="Libro de Mesa"
              >
                <Calendar size={15} />
              </a>
            </div>
          </div>

          {/* Columna 2: La Carta */}
          <div>
            <h4 className="font-serif-luxury text-base text-white font-medium tracking-wider mb-4 pb-2 border-b border-[#2A221E]">
              Nuestra Carta
            </h4>
            <ul className="space-y-2.5 text-[#9E9284] font-light text-xs">
              <li>
                <a href="#carta" onClick={() => setActiveCategory('Pizzas')} className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Pizzas Artesanales al Horno</span>
                  <span className="text-[10px] text-[#6E1B24]">✦</span>
                </a>
              </li>
              <li>
                <a href="#carta" onClick={() => setActiveCategory('Focaccias')} className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Focaccias Tradicionales</span>
                  <span className="text-[10px] text-[#6E1B24]">✦</span>
                </a>
              </li>
              <li>
                <a href="#carta" onClick={() => setActiveCategory('Pastas')} className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Pastas al Pomodoro & Carnes</span>
                  <span className="text-[10px] text-[#6E1B24]">✦</span>
                </a>
              </li>
              <li>
                <a href="#carta" onClick={() => setActiveCategory('Dolci')} className="hover:text-white transition-colors flex items-center justify-between">
                  <span>Tiramisú & Vinos Italianos</span>
                  <span className="text-[10px] text-[#6E1B24]">✦</span>
                </a>
              </li>
              <li>
                <a href="#carta" className="text-[#D4B26F] hover:underline pt-1 inline-block">
                  Pizza Porto Brezza (Burrata & Serrano)
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Ubicación y Accesos */}
          <div>
            <h4 className="font-serif-luxury text-base text-white font-medium tracking-wider mb-4 pb-2 border-b border-[#2A221E]">
              Ubicación & Llegada
            </h4>
            <div className="space-y-3 text-[#9E9284] font-light">
              <p className="flex items-start gap-2">
                <MapPin size={15} className="text-[#D4B26F] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#FAF7F2] block font-medium">Plaza Costasur</strong>
                  El Tezal, Corredor Turístico<br />
                  Los Cabos, Baja California Sur
                </span>
              </p>
              <p className="text-[11px] text-[#7A6F62] italic">
                Estacionamiento privado disponible en la plaza comercial.
              </p>
              <a
                href="https://maps.google.com/?q=Plaza+Costasur+El+Tezal+Los+Cabos"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#D4B26F] hover:text-white transition-colors font-medium pt-1"
              >
                <Compass size={13} /> Ver en Google Maps &rarr;
              </a>
            </div>
          </div>

          {/* Columna 4: Horarios & Atención */}
          <div>
            <h4 className="font-serif-luxury text-base text-white font-medium tracking-wider mb-4 pb-2 border-b border-[#2A221E]">
              Horarios de Servicio
            </h4>
            <div className="space-y-3 text-[#9E9284] font-light">
              <div className="bg-[#1C1613] p-3 border border-[#2D231E]">
                <div className="flex items-center justify-between text-white font-medium mb-1">
                  <span>Lunes a Domingo</span>
                  <span className="text-[#25D366] text-[10px] font-semibold uppercase">Abierto</span>
                </div>
                <p className="text-xs text-[#D4B26F]">13:00 hrs — 23:00 hrs</p>
              </div>

              <p className="text-[11px] text-[#7A6F62] leading-relaxed">
                <strong className="text-[#D8CFBF] font-normal block">Atardecer en Terraza (Sunset Seating):</strong>
                Recomendamos reservar a partir de las 18:00 hrs para contemplar la caída del sol.
              </p>

              <div className="pt-2">
                <span className="text-[10px] uppercase tracking-wider text-[#7A6F62] block">Línea Telefónica Directa:</span>
                <a href="tel:6242116144" className="text-sm font-serif-luxury text-white hover:text-[#D4B26F] transition-colors font-semibold">
                  +52 624 211 6144
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Separador Tricolor Italiano */}
        <div className="italian-tricolor-line opacity-60"></div>

        {/* Sub-Footer / Copyright */}
        <div className="max-w-6xl mx-auto py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-[#6E6356] tracking-wider uppercase text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© {new Date().getFullYear()} Porto Brezza Ristorante Italiano.</span>
            <span className="text-[#3A2E28] hidden sm:inline">•</span>
            <span>Todos los derechos reservados.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6">
            <span>Plaza Costasur • Los Cabos, B.C.S.</span>
            <span className="text-[#3A2E28] hidden sm:inline">•</span>
            <button 
              onClick={() => setViewMode('admin')} 
              className="hover:text-[#D4B26F] transition-colors cursor-pointer underline sm:no-underline font-semibold"
            >
              Panel Propietario
            </button>
          </div>
        </div>

      </footer>

      {/* 10. CONCIERGE PRIVADO (CHATBOT REFINADO Y 100% RESPONSIVO) */}
      {!isConciergeOpen ? (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <button
            onClick={() => setIsConciergeOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-full bg-[#1A382B] hover:bg-[#122A20] text-[#FAF7F2] shadow-2xl border border-[#B88E3E]/60 transition-all hover:scale-[1.03] cursor-pointer group"
            title="Abrir Concierge Gastronómico"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse shrink-0"></span>
            <span className="text-[10px] sm:text-[11px] tracking-[0.18em] uppercase font-semibold">
              <span className="sm:hidden">Concierge IA</span>
              <span className="hidden sm:inline">Concierge Gastronómico</span>
            </span>
          </button>
        </div>
      ) : (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:h-[600px] sm:max-h-[88vh] bg-[#FAF7F2] border-0 sm:border border-[#DCD2C0] shadow-2xl flex flex-col sm:rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
          
          {/* Cabecera del Concierge */}
          <div className="p-3.5 sm:p-4 bg-[#1A382B] text-white flex items-center justify-between border-b border-[#254F3D] shrink-0">
            <div className="flex items-center gap-3">
              <img 
                src="/Gemini_Generated_Image_78a1e378a1e378a1.jpg" 
                alt="Porto Brezza" 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#B88E3E] shrink-0 shadow-xs" 
              />
              <div>
                <h4 className="font-serif-luxury text-base sm:text-lg font-semibold tracking-wide leading-tight">
                  Porto Brezza Concierge
                </h4>
                <span className="text-[9px] tracking-widest uppercase text-[#D4B26F] flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></span> Asistencia Gastronómica IA
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsConciergeOpen(false)}
              className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer rounded-xs flex items-center gap-1 text-xs"
              title="Cerrar chat"
            >
              <span className="sm:hidden text-[11px] uppercase tracking-wider text-[#D4B26F] mr-0.5 font-semibold">Cerrar</span>
              <X size={20} />
            </button>
          </div>

          {/* Conversación con Auto-scroll */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 bg-[#FAF7F2] text-xs">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] sm:max-w-[85%] p-3 sm:p-3.5 leading-relaxed break-words text-sm sm:text-xs ${
                    m.sender === 'user'
                      ? 'bg-[#6E1B24] text-white rounded-sm shadow-xs'
                      : 'bg-white text-[#2C2623] border border-[#E5DCCF] rounded-sm shadow-xs font-light'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>
                  {m.action === 'reserva' && (
                    <div className="mt-2.5 pt-2 border-t border-[#EAE3D6]/70">
                      <a
                        href="#reservar"
                        onClick={() => setIsConciergeOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#6E1B24] hover:bg-[#58131B] text-white text-[10px] sm:text-[11px] font-medium tracking-wider uppercase rounded-xs transition-colors shadow-xs"
                      >
                        <Calendar size={12} /> Reservar Mesa en Línea &rarr;
                      </a>
                    </div>
                  )}
                  {m.action === 'carta' && (
                    <div className="mt-2.5 pt-2 border-t border-[#EAE3D6]/70">
                      <a
                        href="#carta"
                        onClick={() => setIsConciergeOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A382B] hover:bg-[#122A20] text-white text-[10px] sm:text-[11px] font-medium tracking-wider uppercase rounded-xs transition-colors shadow-xs"
                      >
                        <Utensils size={12} /> Explorar Toda La Carta &rarr;
                      </a>
                    </div>
                  )}
                  {m.action === 'whatsapp' && (
                    <div className="mt-2.5 pt-2 border-t border-[#EAE3D6]/70">
                      <a
                        href="https://wa.me/526242116144"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A382B] hover:bg-[#122A20] text-[#86EFAC] text-[10px] sm:text-[11px] font-medium tracking-wider uppercase rounded-xs transition-colors border border-[#86EFAC]/40"
                      >
                        <Phone size={12} /> WhatsApp Directo &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-3.5 py-2.5 border border-[#E5DCCF] rounded-sm text-xs text-[#8A8077] italic flex items-center gap-2 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88E3E] animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88E3E] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B88E3E] animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-[11px]">El Concierge está respondiendo...</span>
                </div>
              </div>
            )}
            {/* Ancla para auto-scroll */}
            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas Desplazables */}
          <div className="px-3 py-2 bg-[#F2ECE1] border-t border-[#E5DCCF] flex gap-1.5 overflow-x-auto text-[10px] sm:text-[11px] no-scrollbar flex-nowrap shrink-0">
            <button
              onClick={() => handleConciergeSend('¿Qué pizzas artesanales preparan?')}
              className="whitespace-nowrap shrink-0 px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#463E38] border border-[#DCD2C0] transition-colors cursor-pointer rounded-xs"
            >
              🍕 Pizzas
            </button>
            <button
              onClick={() => handleConciergeSend('¿Qué ingredientes lleva la pizza especial Porto Brezza?')}
              className="whitespace-nowrap shrink-0 px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#463E38] border border-[#DCD2C0] transition-colors cursor-pointer rounded-xs"
            >
              ⭐ Especialidad
            </button>
            <button
              onClick={() => handleConciergeSend('¿Qué opciones vegetarianas tienen?')}
              className="whitespace-nowrap shrink-0 px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#463E38] border border-[#DCD2C0] transition-colors cursor-pointer rounded-xs"
            >
              🌿 Vegetarianas
            </button>
            <button
              onClick={() => handleConciergeSend('¿Qué vinos sugieren para maridaje?')}
              className="whitespace-nowrap shrink-0 px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#463E38] border border-[#DCD2C0] transition-colors cursor-pointer rounded-xs"
            >
              🍷 Maridaje de Vinos
            </button>
            <button
              onClick={() => handleConciergeSend('¿Dónde están ubicados exactamente y sus horarios?')}
              className="whitespace-nowrap shrink-0 px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#463E38] border border-[#DCD2C0] transition-colors cursor-pointer rounded-xs"
            >
              📍 Ubicación & Horarios
            </button>
            <button
              onClick={() => handleConciergeSend('¿Cómo puedo reservar una mesa en la terraza para hoy?')}
              className="whitespace-nowrap shrink-0 px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#463E38] border border-[#DCD2C0] transition-colors cursor-pointer rounded-xs"
            >
              📅 Reservar Mesa
            </button>
            <button
              onClick={() => handleConciergeSend('¿Qué métodos de pago aceptan?')}
              className="whitespace-nowrap shrink-0 px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#463E38] border border-[#DCD2C0] transition-colors cursor-pointer rounded-xs"
            >
              💳 Formas de Pago
            </button>
          </div>

          {/* Input con prevención de zoom en móviles (text-base en móvil) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConciergeSend();
            }}
            className="p-2.5 sm:p-3 bg-white border-t border-[#E5DCCF] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Escriba su consulta gastronómica aquí..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-[#FAF7F2] border border-[#DCD2C0] px-3.5 py-2.5 sm:py-2 text-base sm:text-xs text-[#221E1C] placeholder-[#8A8077] focus:outline-none focus:border-[#6E1B24] rounded-xs"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="p-2.5 sm:px-3.5 sm:py-2 bg-[#6E1B24] text-white disabled:opacity-40 transition-opacity cursor-pointer rounded-xs shrink-0 flex items-center justify-center shadow-xs"
              title="Enviar consulta"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

// Respaldo de Platillos Reales de Porto Brezza
const defaultMenu = [
  {
    nombre: 'Pizza Porto Brezza (Specialità)',
    descripcion: 'Jamón serrano de reserva, burrata fresca al centro, tomates cherry confitados, pesto genovés y arúgula.',
    precio: 340,
    categoria: 'Pizzas Artesanales'
  },
  {
    nombre: 'Pizza Margherita D.O.P.',
    descripcion: 'Salsa de tomate San Marzano, mozzarella fior di latte y hojas frescas de albahaca.',
    precio: 240,
    categoria: 'Pizzas Artesanales'
  },
  {
    nombre: 'Pizza Prosciutto e Rúcula',
    descripcion: 'Jamón serrano, láminas de parmesano reggiano madurado y arúgula tierna.',
    precio: 310,
    categoria: 'Pizzas Artesanales'
  },
  {
    nombre: 'Pizza Quattro Formaggi',
    descripcion: 'Selección italiana de mozzarella, parmesano reggiano, gorgonzola cremoso y provolone ahumado.',
    precio: 320,
    categoria: 'Pizzas Artesanales'
  },
  {
    nombre: 'Focaccia Caprese',
    descripcion: 'Masa artesanal con aceite de oliva extravirgen, mozzarella fresca, jitomate y pesto.',
    precio: 180,
    categoria: 'Focaccias'
  },
  {
    nombre: 'Focaccia Clásica al Romero',
    descripcion: 'Romero silvestre fresco, aceite de oliva virgen extra y sal marina de grano.',
    precio: 140,
    categoria: 'Focaccias'
  },
  {
    nombre: 'Fettuccine al Pomodoro con Polpette',
    descripcion: 'Pasta al dente con albóndigas artesanales, salsa pomodoro tradicional y queso parmesano.',
    precio: 290,
    categoria: 'Pastas & Especialidades'
  },
  {
    nombre: 'Tiramisú Tradizionale',
    descripcion: 'Bizcocho soletilla con espresso italiano, amaretto, mascarpone y cacao amargo.',
    precio: 160,
    categoria: 'Postres'
  },
  {
    nombre: 'Vino Tinto de la Casa',
    descripcion: 'Copa de Chianti DOCG con notas a frutos rojos maduros y roble tostado.',
    precio: 180,
    categoria: 'Postres & Vinos'
  }
];
