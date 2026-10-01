const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const password = process.argv[2] || '#P3opuest4202.7@';
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Supabase project: todvvydnyaieakrxrymr
  // Probar conexiones posibles
  const connectionConfigs = [
    {
      name: 'Direct Supabase Connection (port 5432)',
      host: 'db.todvvydnyaieakrxrymr.supabase.co',
      port: 5432,
      user: 'postgres',
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Pooler Connection (us-east-1)',
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 5432,
      user: 'postgres.todvvydnyaieakrxrymr',
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Pooler Connection (us-west-1)',
      host: 'aws-0-us-west-1.pooler.supabase.com',
      port: 5432,
      user: 'postgres.todvvydnyaieakrxrymr',
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Pooler Connection (sa-east-1)',
      host: 'aws-0-sa-east-1.pooler.supabase.com',
      port: 5432,
      user: 'postgres.todvvydnyaieakrxrymr',
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    }
  ];

  let connected = false;

  for (const config of connectionConfigs) {
    console.log(`Intentando conectar a: ${config.name} (${config.host})...`);
    const client = new Client(config);
    try {
      await client.connect();
      console.log(`✅ Conexión exitosa a ${config.name}!`);
      console.log(`Ejecutando schema.sql en Supabase...`);
      await client.query(sql);
      console.log(`🎉 ¡Tablas y datos iniciales creados exitosamente!`);
      
      // Verificar conteo de tablas
      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `);
      console.log(`Tablas verificadas en public:`, res.rows.map(r => r.table_name));

      const menuRes = await client.query(`SELECT count(*) FROM menu_items;`);
      console.log(`Platillos insertados en menu_items:`, menuRes.rows[0].count);

      await client.end();
      connected = true;
      break;
    } catch (err) {
      console.log(`❌ Falló ${config.name}: ${err.message}`);
      try { await client.end(); } catch (e) {}
    }
  }

  if (!connected) {
    console.error('No se pudo conectar con ninguna de las configuraciones probadas.');
    process.exit(1);
  }
}

run();
