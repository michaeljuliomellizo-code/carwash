# 🚗🏍️ Carwash — Sistema Integral de Gestión de Lavaderos

Aplicación **web y móvil (PWA)** para administrar lavaderos de carros y motos, construida con **Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui** en el frontend y **Supabase** (PostgreSQL + Auth + Storage) como backend. Despliegue pensado para **Vercel**.

**Multi-organización**: cada lavadero (organización) vive aislado por Row Level Security — la organización 1 no ve nada de la organización 2.

---

## 📦 Módulos incluidos (20)

| # | Módulo | Qué hace |
|---|--------|----------|
| 1 | **Dashboard** | Ventas del día, carros/motos atendidos, servicios, ingresos por método (efectivo/tarjeta/transferencia/Nequi/Daviplata), comparación vs ayer, meta diaria, pendientes, alertas de inventario y gráfico semanal |
| 2 | **Clientes** | Ficha completa (documento, WhatsApp, email, dirección, observaciones), puntos, total gastado e historial de vehículos |
| 3 | **Vehículos** | Placa, tipo carro/moto, marca, modelo, año, color, kilometraje + último lavado, lavados acumulados y total gastado (automático) |
| 4 | **Órdenes** | Recepción con orden numerada (#0001…), flujo 🟡 Recibido → 🔵 En proceso → 🟢 Terminado → 💰 Pagado → ⚫ Entregado, extras, observaciones, fotos y cobro |
| 5 | **Servicios y tarifas** | Catálogo con precio y duración, diferenciado por tipo de vehículo |
| 6 | **Servicios adicionales** | Aspirado, brillado, encerado, polichado, tratamiento cerámico… para aumentar el ticket |
| 7 | **Empleados** | Roles: 👑 Administrador, 🧭 Supervisor, 💵 Cajero, 🧽 Lavador + % de comisión parametrizable |
| 8 | **Comisiones** | Cálculo automático por servicio completado según el % de cada empleado |
| 9 | **Caja** | Apertura, entradas/salidas por categoría, cierre con arqueo (esperado vs real, diferencia) |
| 10 | **Métodos de pago** | Reporte de cobros por canal + gráfico + gestión del catálogo |
| 11 | **Inventario** | Productos con stock, mínimo, costo y proveedor + alertas de compra 🔴 |
| 12 | **Consumo por servicio** | Receta servicio→producto→cantidad: el descuento de inventario es automático al completar la orden (trigger de BD) |
| 13 | **Fotos del vehículo** | Frontal, trasera, laterales e interior por orden (Supabase Storage) — evidencia contra reclamos |
| 14 | **WhatsApp** | Plantillas con variables ({cliente}, {placa}, {dias}…) y envío directo wa.me + campaña de reactivación |
| 15 | **Fidelización** | Puntos automáticos por pago ($10.000 = 1 punto, configurable), canjes y tarjeta digital |
| 16 | **Membresías** | Planes Básico/Premium/VIP con lavados incluidos o ilimitados + suscripciones por cliente |
| 17 | **Reservas** | Módulo interno + **página pública** (`#/reservar`) donde el cliente agenda sin cuenta y recibe código |
| 18 | **Reportes** | Ventas hoy/semana/mes/año, top servicios, clientes nuevos/recurrentes/inactivos, rendimiento por empleado, rentabilidad (ingresos − costos de insumos) |
| 19 | **Nómina / Periodos** | Periodos de pago (semanal/quincenal/mensual), apertura y cierre, liquidación por empleado y marcación de pagos |
| 20 | **Asistente IA** | ① Reactivación: detecta clientes inactivos y prepara mensaje con oferta ② Predicción de demanda por día de semana (recomienda contrataciones) ③ Predicción de inventario: en cuántos días se agota cada producto y cuánto comprar |

**Extras técnicos**: PWA instalable (manifest + service worker + iconos), Google Analytics 4, modo demo sin configuración, roles aplicados en menú y acciones.

---

## 🚀 Puesta en marcha rápida

### A) Probar sin nada configurado (modo demo)

```bash
bun install        # o npm install
bun run dev        # o npm run dev
```

Abre `http://localhost:3000` y pulsa **"Probar modo demostración"**. Todos los módulos funcionan con datos de ejemplo guardados en tu navegador.

### B) Conectar Supabase (producción real)

1. **Crea el proyecto** en [supabase.com](https://supabase.com) → New project.
2. **Ejecuta el esquema**: abre **SQL Editor → New query**, pega el contenido completo de [`supabase/schema.sql`](supabase/schema.sql) y presiona **Run**. Esto crea:
   - 25 tablas con relaciones y restricciones
   - Triggers de negocio: numeración de órdenes, comisiones automáticas, descuento de inventario por receta, estadísticas de vehículos, puntos de fidelidad
   - Seed automático de catálogos al crear cada organización (servicios, extras, métodos de pago, inventario, membresías, plantillas WhatsApp)
   - Row Level Security por organización + bucket `fotos-vehiculos` en Storage
3. **Crea tu usuario**: Authentication → Users → **Add user** (email + contraseña).
4. **Vincula tu usuario como administrador** (SQL Editor, reemplaza el email):

   ```sql
   insert into public.organizaciones (nombre) values ('Mi Lavadero');

   insert into public.empleados (organizacion_id, auth_user_id, nombre, rol, porcentaje_comision)
   select o.id, u.id, 'Administrador', 'admin', 30
   from public.organizaciones o, auth.users u
   where o.nombre = 'Mi Lavadero' and u.email = 'tu-email@ejemplo.com';
   ```

   > La creación de la organización dispara el seed automático de catálogos.
5. **Variables de entorno**: copia `.env.example` → `.env.local` y completa con los valores de **Project Settings → API**:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=TU-CLAVE-ANONIMA
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX   # opcional
   ```

6. Reinicia el dev server y entra con tu email y contraseña. Si el usuario no tiene organización, la app muestra la pantalla **"Crea tu lavadero"** (onboarding con seed automático).

### C) Subir a Vercel

1. Sube el proyecto a un repositorio de GitHub.
2. En [vercel.com/new](https://vercel.com/new) importa el repositorio.
3. En **Environment Variables** agrega las 3 variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GA_ID`).
4. **Deploy**. Listo — la app quedará en `https://tu-proyecto.vercel.app` con web + móvil + PWA instalable.

> En Supabase → Authentication → URL Configuration, agrega `https://tu-proyecto.vercel.app` a **Redirect URLs** para que el login funcione en producción.

---

## 🧪 Guía de prueba (flujo completo)

1. **Modo demo** → Dashboard con datos del día.
2. **Órdenes → Nueva orden**: elige vehículo, servicio, extras y guarda → se crea `#0016`.
3. Abre la orden → **Iniciar** → **Terminar** → panel de cobro → elige **Nequi** → **Cobrar** → la orden pasa a *Pagado*.
4. Mira **Dashboard**: ventas, métodos de pago y comparación con ayer se actualizaron.
5. **Clientes**: Juan Pérez / Laura Gómez ya tienen puntos y gasto acumulado actualizados.
6. **Comisiones**: si asignaste un lavador, su comisión se generó sola.
7. **Inventario**: el stock de shampoo bajó según la receta del servicio consumido.
8. **Reservas (público)**: botón "Reservar cita" → agenda sin sesión → código de confirmación → aparece en el módulo Reservas.
9. **IA**: clientes inactivos con botón de envío por WhatsApp, predicción de demanda por día y "comprar X litros en Y días".
10. **Caja**: movimientos, cierre y arqueo con diferencia.

---

## 🏗️ Arquitectura

```
CLIENTE (Web / Móvil PWA)
        │
        ▼
   NEXT.JS 16 (App Router, TypeScript, Tailwind, shadcn/ui)
   · Ruteo interno por hash (#/dashboard, #/ordenes, #/reservar…)
   · Capa dual: Supabase real  ⇄  Modo demo (localStorage)
        │
        ▼
   SUPABASE
   · PostgreSQL con RLS por organizacion_id  · Auth (roles en empleados)
   · Storage (bucket fotos-vehiculos)        · Triggers de negocio
   · RPC rpc_dashboard_resumen(fecha)
        │
        ▼
   VERCEL (deploy)  +  GOOGLE ANALYTICS 4
```

**Decisiones clave**

- **RLS estricta**: toda tabla lleva `organizacion_id` y políticas `FOR ALL` contra `obtener_organizacion_actual()` → aislamiento total entre lavaderos a nivel de base de datos.
- **Lógica de dinero en la BD**: comisiones, descuento de inventario, puntos y numeración son **triggers de PostgreSQL** — funcionan igual desde la app, desde SQL o desde otra integración.
- **Modo demo**: si no hay variables de Supabase, la app replica los triggers en el cliente con `localStorage`, ideal para pruebas y capacitación del personal.
- **PWA**: instalable en el celular del lavador/cajero desde el navegador (Agregar a pantalla de inicio).

## 📁 Estructura del proyecto

```
├── src/
│   ├── app/                    # layout (GA, PWA), página raíz
│   ├── lib/
│   │   ├── types.ts            # entidades espejo del esquema
│   │   ├── store.tsx           # provider dual (Supabase/Demo) + lógica de negocio
│   │   ├── supabase.ts         # cliente singleton
│   │   ├── demo-store.ts       # dataset de demostración
│   │   ├── nav.ts              # módulos y permisos por rol
│   │   └── format.ts           # COP, fechas, WhatsApp, imágenes
│   └── components/carwash/
│       ├── Shell.tsx           # login, onboarding, sidebar, router hash
│       ├── CatalogoView.tsx    # CRUD genérico
│       ├── ui-bits.tsx         # KPIs, tablas, diálogos compartidos
│       └── views/              # 21 vistas (20 módulos + reserva pública)
├── supabase/schema.sql         # esquema completo para SQL Editor
├── public/                     # manifest.json, sw.js, iconos PWA
└── .env.example
```

## 🔐 Roles y permisos

| Rol | Acceso |
|-----|--------|
| 👑 Administrador | Todo el sistema, configuración y nómina |
| 🧭 Supervisor | Órdenes, clientes, vehículos, servicios, empleados, inventario, reportes, IA, WhatsApp |
| 💵 Cajero | Órdenes y cobros, caja, métodos de pago, membresías, fidelización, reportes |
| 🧽 Lavador | Dashboard y sus órdenes asignadas (iniciar/terminar servicio) |

El aislamiento por organización es obligatorio en la base de datos; los permisos finos por rol se aplican en la interfaz.
