# Proyecto Nexo: Asistente IA para Restaurantes y Servicios

Plataforma inteligente para la atención automatizada de clientes en restaurantes y negocios de servicios. Integra Inteligencia Artificial con bases de datos operativas para responder dudas del menú/servicios, consultar disponibilidad en tiempo real y registrar reservaciones o pedidos automáticamente mediante **Function Calling**.

---

## 🚀 Resumen del Stack Tecnológico

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Backend / API** | **Java 17+ / Spring Boot 3 (Maven)** | Orquestador central, APIs REST, conexión a BD y Webhooks. |
| **Base de Datos** | **PostgreSQL (Supabase / Local)** | Almacén de menús, mesas, reservaciones e historial de chat. |
| **Motor de IA** | **Google Gemini API / OpenAI API** | Comprensión de lenguaje natural y ejecución de *Tools* (*Function Calling*). |
| **Canales de Contacto** | **Widget Web (React/Vite)** y **WhatsApp Cloud API (Meta)** | Puntos de contacto donde los clientes interactúan. |

---

## 📂 Estructura del Proyecto

```text
Proyecto-nexo/
├── database/                          # Esquemas SQL y tablas para Supabase/PostgreSQL
│   ├── schema.sql                     # Script listo para ejecutar en Supabase
│   └── README.md                      # Guía de conexión e instalación de tablas
├── docs/                              # Documentación técnica y guías de arquitectura
│   ├── ARQUITECTURA_Y_FUNCIONAMIENTO_API.md # Explicación a fondo del flujo de IA y Spring Boot
│   └── MODELO_BASE_DATOS.md          # Diagramas y relaciones de entidades
├── backend/                           # API REST en Java Spring Boot 3 (Maven)
│   └── README.md
└── frontend/                          # Widget Web y Web App (React + Tailwind CSS)
    └── README.md
```

---

## 📖 Documentación Disponible

- Consulta la guía completa de cómo funciona la API por dentro en: [ARQUITECTURA_Y_FUNCIONAMIENTO_API.md](file:///Users/jmu664/Documents/Sistemas/Proyecto-nexo/docs/ARQUITECTURA_Y_FUNCIONAMIENTO_API.md).
- Consulta el esquema de datos sugerido en: [MODELO_BASE_DATOS.md](file:///Users/jmu664/Documents/Sistemas/Proyecto-nexo/docs/MODELO_BASE_DATOS.md).
