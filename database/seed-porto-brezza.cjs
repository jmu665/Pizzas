const { Client } = require('pg');

async function updatePortoBrezza() {
  const client = new Client({
    host: 'db.todvvydnyaieakrxrymr.supabase.co',
    port: 5432,
    user: 'postgres',
    password: '#P3opuest4202.7@',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado a Supabase...');

    // 1. Actualizar restaurante a Porto Brezza
    await client.query(`
      UPDATE restaurantes SET
        nombre = 'Porto Brezza - Ristorante Italiano',
        descripcion = 'Auténtica cocina italiana que enamora con vista al mar y horno de piedra.',
        direccion = 'Plaza Costasur, El Tezal, Los Cabos, B.C.S.',
        telefono = '+52 624 211 6144',
        hora_apertura = '13:00:00',
        hora_cierre = '23:00:00',
        capacidad_maxima = 50
      WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    `);

    // 2. Limpiar menú anterior y cargar el menú real de Porto Brezza
    await client.query(`DELETE FROM menu_items WHERE restaurante_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';`);

    const dishes = [
      // Pizzas Artesanales (Horno de piedra • Fermentación lenta)
      {
        nombre: 'Pizza Porto Brezza (Especialidad)',
        descripcion: 'Jamón serrano, burrata fresca, tomates cherry confitados, pesto genovés y arúgula fresca.',
        precio: 340.00,
        categoria: 'Pizzas Artesanales',
        imagen_url: '/image copy 3.png'
      },
      {
        nombre: 'Pizza Margherita',
        descripcion: 'Salsa de tomate San Marzano, mozzarella fior di latte y hojas de albahaca fresca.',
        precio: 240.00,
        categoria: 'Pizzas Artesanales',
        imagen_url: '/image.png'
      },
      {
        nombre: 'Pizza Pepperoni Premium',
        descripcion: 'Pepperoni artesanal premium horneado a la leña y abundante queso mozzarella.',
        precio: 270.00,
        categoria: 'Pizzas Artesanales',
        imagen_url: '/image.png'
      },
      {
        nombre: 'Pizza Prosciutto e Rúcula',
        descripcion: 'Jamón serrano de reserva, láminas de parmesano reggiano y arúgula fresca de la huerta.',
        precio: 310.00,
        categoria: 'Pizzas Artesanales',
        imagen_url: '/image.png'
      },
      {
        nombre: 'Pizza Quattro Formaggi',
        descripcion: 'Selección de cuatro quesos italianos: Mozzarella, parmesano, gorgonzola cremoso y provolone.',
        precio: 320.00,
        categoria: 'Pizzas Artesanales',
        imagen_url: '/image.png'
      },
      {
        nombre: 'Pizza Vegetariana',
        descripcion: 'Calabaza marinada, champiñones frescos, pimientos asados, cebolla morada y aceitunas negras.',
        precio: 260.00,
        categoria: 'Pizzas Artesanales',
        imagen_url: '/image.png'
      },

      // Focaccias
      {
        nombre: 'Focaccia Porto Brezza Caprese',
        descripcion: 'Masa suave con aceite de oliva virgen extra, mozzarella fresca, jitomate deshidratado y pesto.',
        precio: 180.00,
        categoria: 'Focaccias',
        imagen_url: '/image.png'
      },
      {
        nombre: 'Focaccia Prosciutto & Parmigiano',
        descripcion: 'Focaccia crujiente con jamón serrano, arúgula fresca y lascas de parmesano.',
        precio: 210.00,
        categoria: 'Focaccias',
        imagen_url: '/image.png'
      },
      {
        nombre: 'Focaccia Pollo Mediterráneo',
        descripcion: 'Pechuga de pollo a la parrilla, espinacas baby, mozzarella fundida y toque de pesto.',
        precio: 195.00,
        categoria: 'Focaccias',
        imagen_url: '/image.png'
      },
      {
        nombre: 'Focaccia Clásica al Romero',
        descripcion: 'Masa artesanal con romero silvestre recién cortado, aceite de oliva virgen y sal marina de grano.',
        precio: 140.00,
        categoria: 'Focaccias',
        imagen_url: '/image.png'
      },

      // Pastas & Especialidades
      {
        nombre: 'Fettuccine al Pomodoro con Polpette',
        descripcion: 'Pasta larga al dente con salsa de pomodoro tradicional, albóndigas artesanales de carne y parmesano.',
        precio: 290.00,
        categoria: 'Pastas & Especialidades',
        imagen_url: '/image copy 4.png'
      },
      {
        nombre: 'Carpaccio de Lomo con Alcaparras',
        descripcion: 'Finas láminas de res con reducción balsámica, parmesano reggiano y alcaparras fritas.',
        precio: 230.00,
        categoria: 'Pastas & Especialidades',
        imagen_url: '/image copy 4.png'
      },

      // Postres & Vinos
      {
        nombre: 'Tiramisú Tradizionale',
        descripcion: 'Bizcochos soletilla bañados en café espresso italiano con licor amaretto, crema de mascarpone y cacao.',
        precio: 160.00,
        categoria: 'Postres',
        imagen_url: '/image copy 4.png'
      },
      {
        nombre: 'Vino Tinto Italiano (Copa)',
        descripcion: 'Selección de la casa: Chianti DOCG o Cabernet con notas a frutos rojos y barrica de roble.',
        precio: 180.00,
        categoria: 'Bebidas & Vinos',
        imagen_url: '/image copy 4.png'
      }
    ];

    for (const d of dishes) {
      await client.query(`
        INSERT INTO menu_items (restaurante_id, nombre, descripcion, precio, categoria, disponible, imagen_url)
        VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', $1, $2, $3, $4, true, $5);
      `, [d.nombre, d.descripcion, d.precio, d.categoria, d.imagen_url]);
    }

    console.log(`✅ ¡${dishes.length} platillos reales de Porto Brezza cargados en Supabase!`);
    await client.end();
  } catch (err) {
    console.error('Error al actualizar:', err);
    process.exit(1);
  }
}

updatePortoBrezza();
