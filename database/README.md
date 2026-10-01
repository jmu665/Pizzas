# Módulo de Base de Datos (Supabase / PostgreSQL)

Este directorio contiene los esquemas, tablas y datos iniciales para la base de datos de **Proyecto Nexo**.

---

## 📄 Archivos disponibles:
- **`schema.sql`**: Script DDL para crear las 5 tablas (`restaurantes`, `menu_items`, `reservas`, `conversaciones`, `mensajes`) e insertar datos de prueba.

---

## 🚀 Pasos para ejecutar en Supabase:

1. Entra a tu proyecto en [supabase.com](https://supabase.com).
2. En el menú lateral izquierdo, haz clic en **SQL Editor** (ícono `>_`).
3. Haz clic en **"New query"**.
4. Abre y copia el contenido completo del archivo [`schema.sql`](file:///Users/jmu664/Documents/Sistemas/Proyecto-nexo/database/schema.sql).
5. Pégalo en el editor y presiona el botón verde **"Run"** (o `Cmd + Enter`).
6. Ve a **Table Editor** en el menú izquierdo: verás tus tablas creadas y los platillos listos.

---

## 🔑 Credenciales necesarias para el Backend:

En Supabase, ve a **Project Settings** (el engrane abajo a la izquierda) $\to$ **Database**:
- **Host:** `db.xxxxxxxxxxxx.supabase.co`
- **Port:** `5432` o `6543` (Pooler)
- **Database name:** `postgres`
- **User:** `postgres`
- **Password:** La contraseña que creaste al crear el proyecto.
- O directamente la **URI de conexión JDBC**: `jdbc:postgresql://db.xxxxxxxx.supabase.co:5432/postgres`
