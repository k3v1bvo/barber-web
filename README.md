# 💈 BarberWeb - CRM & POS System

**BarberWeb** es una plataforma integral de nivel empresarial diseñada específicamente para la gestión operativa y comercial de barberías modernas. Este ecosistema digital centraliza la gestión de clientes, reservas, control de inventario y análisis de negocios, todo con una experiencia de usuario (UX) moderna bajo un diseño oscuro *Amber & Zinc*.

![BarberWeb Banner](https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200&auto=format&fit=crop) *(Imagen ilustrativa)*

---

## ✨ Características Principales (Features)

El sistema cuenta con un control de acceso basado en roles (RBAC), dividiendo sus capacidades según el usuario:

*   **👥 Panel de Clientes (Portal B2C):**
    *   Reservas Inteligentes 24/7 (elección de servicio, barbero y horario).
    *   **Loyalty Circle:** Gamificación de la lealtad de clientes (descuentos o cortes gratis por recurrencia).
    *   Tienda Online (E-commerce) con carrito de compras y recojo en local.
*   **✂️ Panel de Barberos:**
    *   Gestión de su agenda personal diaria.
    *   Ventas rápidas ("Walk-ins") para clientes sin cita previa.
    *   Reloj checador (Control de Asistencia de entrada/salida).
*   **🛎️ Recepción / Caja:**
    *   Control maestro del flujo diario (estados: Pendiente, En Proceso, Finalizado).
    *   Visualización de cierre de caja e ingresos del día en tiempo real.
*   **📊 Dashboard Administrativo (Admin):**
    *   **Business Intelligence:** Métricas de productividad por barbero y servicios más vendidos.
    *   **Inventario Automatizado:** CRUD de productos con alertas de bajo stock.
    *   **Salón de la Fama:** Identificación de clientes VIP basados en número de visitas y gasto histórico.
    *   **Portafolio Pro:** Gestión de galería de trabajos alojada en la nube (URL-based storage) para optimización extrema.

---

## 🛠️ Stack Tecnológico

*   **Frontend:** [Next.js](https://nextjs.org/) (App Router) y React.
*   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) (diseño fully responsive).
*   **Iconos & UI:** `lucide-react` y componentes modulares propios.
*   **Backend & Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security).
*   **Autenticación:** Supabase Auth + Middleware.

---

## 🚀 Instalación y Despliegue Local

Sigue estos pasos para correr el proyecto en tu entorno local:

### 1. Clonar el repositorio
```bash
git clone https://github.com/k3v1bvo/barber-web.git
cd barber-web/barber-pro-web
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz de `barber-pro-web` y agrega tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase
```

### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```
La aplicación estará corriendo en [http://localhost:3000](http://localhost:3000).

---

## 📦 Scripts de Migración (Python)

Si necesitas migrar una base de datos antigua (en Excel) al nuevo sistema, dentro de la carpeta `scripts/` encontrarás herramientas automatizadas desarrolladas en Python:

1.  `generar_plantilla.py`: Crea un Excel vacío con las columnas necesarias.
2.  `migrar_clientes.py`: Lee el Excel, limpia la data y la sube masivamente a la tabla de Supabase sin perder el progreso de "Loyalty Circle" de los clientes.

Para instrucciones detalladas sobre la migración, consulta [scripts/LEEME_MIGRACION.md](./scripts/LEEME_MIGRACION.md).

---

## 🔒 Seguridad

*   **Protección de Rutas:** El archivo `middleware.ts` intercepta todas las peticiones, asegurando que solo usuarios con rol de `admin` entren a `/admin`, `barbero` a `/barbero`, etc.
*   **RLS (Row Level Security):** A nivel de base de datos en Supabase, los usuarios solo tienen permisos de lectura/escritura sobre las filas de datos que les pertenecen.

---

Hecho con 💻 por el equipo de BarberWeb.
