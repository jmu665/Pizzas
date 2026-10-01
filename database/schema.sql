-- ==============================================================================
-- PROYECTO NEXO: ESQUEMA DE BASE DE DATOS PARA RESTAURANTES / SERVICIOS
-- Compatible con PostgreSQL y Supabase
-- ==============================================================================

-- 1. Habilitar extensión para UUIDs automáticos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Restaurantes o Negocios
CREATE TABLE IF NOT EXISTS restaurantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    direccion TEXT,
    telefono VARCHAR(30),
    hora_apertura TIME NOT NULL DEFAULT '12:00:00',
    hora_cierre TIME NOT NULL DEFAULT '23:00:00',
    capacidad_maxima INT NOT NULL DEFAULT 50,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Menú / Servicios
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL,
    categoria VARCHAR(80) NOT NULL, -- ej: 'Entradas', 'Platos Fuertes', 'Bebidas', 'Postres'
    disponible BOOLEAN DEFAULT TRUE,
    imagen_url TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Reservaciones
CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    nombre_cliente VARCHAR(120) NOT NULL,
    telefono_cliente VARCHAR(40) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    personas INT NOT NULL CHECK (personas > 0),
    estado VARCHAR(30) DEFAULT 'CONFIRMADA', -- 'PENDIENTE', 'CONFIRMADA', 'CANCELADA'
    codigo_reserva VARCHAR(20) UNIQUE NOT NULL,
    notas TEXT,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla de Conversaciones (Sesiones de Chat)
CREATE TABLE IF NOT EXISTS conversaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurante_id UUID REFERENCES restaurantes(id) ON DELETE CASCADE,
    session_id VARCHAR(120) UNIQUE NOT NULL, -- UUID para web o número de teléfono en WhatsApp
    canal VARCHAR(30) NOT NULL,              -- 'WEB' o 'WHATSAPP'
    creada_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla de Mensajes (Memoria para la IA)
CREATE TABLE IF NOT EXISTS mensajes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversacion_id UUID REFERENCES conversaciones(id) ON DELETE CASCADE,
    remitente VARCHAR(20) NOT NULL,          -- 'USER', 'ASSISTANT', 'SYSTEM'
    contenido TEXT NOT NULL,
    enviado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices recomendados para alta velocidad
CREATE INDEX IF NOT EXISTS idx_menu_categoria ON menu_items(categoria);
CREATE INDEX IF NOT EXISTS idx_reservas_fecha_hora ON reservas(fecha, hora);
CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacion_id, enviado_en ASC);

-- ==============================================================================
-- DATOS INICIALES DE PRUEBA (SEED DATA)
-- ==============================================================================

-- Insertar restaurante demo
INSERT INTO restaurantes (id, nombre, descripcion, direccion, telefono, hora_apertura, hora_cierre, capacidad_maxima)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Nexo Trattoria & Grill',
    'Restaurante italiano y cortes selectos con ambiente acogedor.',
    'Av. Principal #123, Centro',
    '+52 55 1234 5678',
    '13:00:00',
    '23:00:00',
    40
) ON CONFLICT (id) DO NOTHING;

-- Insertar platillos del menú de prueba
INSERT INTO menu_items (restaurante_id, nombre, descripcion, precio, categoria, disponible) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Bruschetta Tradicional', 'Pan rústico tostado con tomate, albahaca fresca y aceite de oliva virgen extra.', 120.00, 'Entradas', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Carpaccio de Res', 'Finas láminas de lomo con parmesano reggiano, alcaparras y reducción balsámica.', 195.00, 'Entradas', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pizza Margherita DOP', 'Masa madre fermentada 48 hrs, salsa de tomate San Marzano, mozzarella fior di latte y albahaca.', 260.00, 'Platos Fuertes', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ribeye al Romero (400g)', 'Corte calidad Prime a la parrilla con mantequilla de hierbas y papas al horno.', 540.00, 'Platos Fuertes', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tiramisú Clásico', 'Bizcocho savoiardi con café espresso, mascarpone italiano y cacao amargo.', 140.00, 'Postres', true),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Limonada de Frutos Rojos', 'Refrescante limonada natural infusionada con frutos del bosque.', 75.00, 'Bebidas', true);
