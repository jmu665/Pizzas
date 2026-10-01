# Backend API (Java Spring Boot 3)

Módulo backend para la API de atención y reservaciones con Inteligencia Artificial.

---

## 🛠 Tecnologías
- **Java 17+**
- **Spring Boot 3.x**
- **Spring Data JPA / Hibernate**
- **PostgreSQL Driver**
- **Lombok**
- **Cliente LLM (OpenAI / Gemini con Function Calling)**

---

## 📦 Estructura de Paquetes Planificada:
- `com.nexo.controller`: Controladores REST para chat y webhooks.
- `com.nexo.service`: Lógica de negocio (orquestador de chat, menú, reservas).
- `com.nexo.ai.tools`: Funciones Java expuestas a la IA como herramientas.
- `com.nexo.model`: Entidades JPA mapeadas con las tablas de Supabase.
- `com.nexo.repository`: Interfaces Spring Data JPA para acceso a datos.
