---
Task ID: 1
Agent: main (Z.ai)
Task: Proyecto Carwash — sistema integral de gestión de lavaderos (Next.js 16 + Supabase + Vercel)

Work Log:
- Inicializado entorno fullstack (init-fullstack.sh) e instalado @supabase/supabase-js
- Creada capa de datos: types.ts (25 entidades espejo del esquema), format.ts (COP/fechas/WhatsApp/compresión de imágenes), supabase.ts (cliente singleton), demo-store.ts (dataset demo con persistencia localStorage), store.tsx (provider dual Supabase/Demo con auth, CRUD genérico y lógica de negocio replicada en demo)
- Construido Shell.tsx: login + registro, onboarding de organización, sidebar responsive con 21 módulos, router por hash (#/modulo), roles por menú, header y footer sticky
- Implementados 20 módulos: Dashboard (KPIs, meta, métodos de pago, gráfico 7 días, alertas), Órdenes (flujo de estados, extras, fotos, cobro, WhatsApp), Clientes (ficha+historial), Vehículos, Servicios, Extras, Empleados (roles+%), Comisiones, Caja (apertura/movimientos/arqueo), Métodos de pago (reporte+gráfico), Inventario (alertas+movimientos), Consumos (recetas+costo/margen), WhatsApp (plantillas+campaña), Fidelización (puntos+canjes), Membresías (planes+suscripciones), Reservas (admin+página pública), Reportes (periodos, top servicios, segmentos, rentabilidad), Nómina (periodos+liquidación), IA (reactivación, demanda, inventario), Configuración
- PWA: manifest.json, sw.js, iconos 192/512 generados con sharp (scripts/iconos.js)
- Google Analytics 4 condicional por NEXT_PUBLIC_GA_ID (next/script)
- supabase/schema.sql: esquema completo estático (25 tablas, triggers de negocio, RPC dashboard, RLS por organización, storage)
- README.md con instrucciones Supabase/Vercel + .env.example
- Correcciones durante QA: import ESTADOS_ORDEN, Textarea/Select faltantes, bug guardar() devolvía UUID en éxito (afectaba reserva pública/caja/config), diálogos extraídos a nivel módulo para evitar remount, KPI truncado en móvil
- Verificación Agent Browser: login demo, dashboard con datos, creación de orden #0016, flujo recibido→en_proceso→terminado→pagado, cobro Nequi, actualización automática de dashboard/clientes, reserva pública con código, módulos IA/Caja/Reservas, vista móvil 390px. HTTP 200, lint limpio, sin errores de consola

Stage Summary:
- App completa en /home/z/my-project (Next.js 16 + TS + Tailwind + shadcn/ui + Supabase)
- Esquema BD en supabase/schema.sql (idéntico al entregado al usuario, verificado estático)
- Entregables: README, .env.example, capturas en download/, zip del proyecto en download/carwash-proyecto.zip
- Despliegue: Vercel (3 env vars) + Supabase (ejecutar schema.sql + crear admin)
