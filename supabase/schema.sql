-- =====================================================================
-- CARWASH — Esquema completo de base de datos para Supabase (PostgreSQL)
-- Ejecutar TODO este archivo en: Supabase → SQL Editor → New query → Run
-- Incluye: tablas, funciones, triggers de negocio, RPC, RLS y Storage
-- =====================================================================
create extension if not exists pgcrypto;

-- ============================ 1. TABLAS ============================
create table if not exists public.organizaciones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, nit text, direccion text, telefono text, email text,
  logo_url text, color_primario text default '#0ea5e9',
  moneda text not null default 'COP', activa boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.empleados (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  nombre text not null, documento text, telefono text, email text,
  rol text not null default 'lavador' check (rol in ('admin','supervisor','cajero','lavador')),
  porcentaje_comision numeric(5,2) not null default 30 check (porcentaje_comision between 0 and 100),
  tipo_pago text not null default 'comision' check (tipo_pago in ('comision','fijo','mixto')),
  activo boolean not null default true, fecha_ingreso date not null default current_date,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_empleados_org on public.empleados(organizacion_id);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null, documento text, telefono text, whatsapp text, email text,
  direccion text, observaciones text,
  puntos int not null default 0, total_gastado numeric(14,2) not null default 0,
  ultima_visita timestamptz, activo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_clientes_org on public.clientes(organizacion_id);

create table if not exists public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  placa text not null, tipo text not null check (tipo in ('carro','moto')),
  marca text, modelo text, anio int, color text, kilometraje int, observaciones text,
  ultimo_lavado date, lavados_acumulados int not null default 0,
  total_gastado numeric(14,2) not null default 0, activo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organizacion_id, placa)
);
create index if not exists idx_vehiculos_org on public.vehiculos(organizacion_id);
create index if not exists idx_vehiculos_cliente on public.vehiculos(cliente_id);

create table if not exists public.servicios (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null, descripcion text,
  tipo_vehiculo text not null check (tipo_vehiculo in ('carro','moto','ambos')),
  precio numeric(12,2) not null default 0, duracion_min int default 30,
  activo boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.servicios_adicionales (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null, precio numeric(12,2) not null default 0,
  activo boolean not null default true, created_at timestamptz not null default now()
);

create table if not exists public.ordenes (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  numero int not null,
  cliente_id uuid not null references public.clientes(id),
  vehiculo_id uuid not null references public.vehiculos(id),
  servicio_id uuid not null references public.servicios(id),
  empleado_id uuid references public.empleados(id),
  estado text not null default 'recibido'
    check (estado in ('recibido','en_proceso','terminado','pagado','entregado','cancelado')),
  precio_servicio numeric(12,2) not null default 0,
  total_extras numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  observaciones text, kilometraje int,
  fecha_entrada timestamptz not null default now(),
  fecha_terminado timestamptz, fecha_entregado timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organizacion_id, numero)
);
create index if not exists idx_ordenes_org_fecha on public.ordenes(organizacion_id, fecha_entrada);

create table if not exists public.orden_extras (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  orden_id uuid not null references public.ordenes(id) on delete cascade,
  adicional_id uuid references public.servicios_adicionales(id),
  nombre text not null, precio numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.orden_fotos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  orden_id uuid not null references public.ordenes(id) on delete cascade,
  fase text not null default 'entrada' check (fase in ('entrada','salida')),
  posicion text, url text not null, created_at timestamptz default now()
);

create table if not exists public.metodos_pago (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null,
  tipo text not null check (tipo in ('efectivo','tarjeta','transferencia','nequi','daviplata','otros')),
  activo boolean not null default true
);

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  orden_id uuid not null references public.ordenes(id) on delete cascade,
  metodo_id uuid references public.metodos_pago(id),
  monto numeric(12,2) not null check (monto > 0), referencia text,
  fecha timestamptz not null default now(), created_at timestamptz default now()
);

create table if not exists public.caja_sesiones (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  empleado_id uuid references public.empleados(id),
  fecha date not null default current_date,
  monto_apertura numeric(12,2) not null default 0,
  monto_cierre numeric(12,2), monto_esperado numeric(12,2), diferencia numeric(12,2),
  estado text not null default 'abierta' check (estado in ('abierta','cerrada')),
  observaciones text, abierta_at timestamptz default now(), cerrada_at timestamptz
);

create table if not exists public.caja_movimientos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  sesion_id uuid references public.caja_sesiones(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','salida')),
  categoria text not null default 'otros',
  concepto text not null, monto numeric(12,2) not null,
  metodo text default 'efectivo', referencia text, fecha timestamptz default now()
);

create table if not exists public.inventario_productos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null, unidad text not null default 'ml',
  stock numeric(12,2) not null default 0, stock_minimo numeric(12,2) not null default 0,
  costo_unitario numeric(12,2) default 0, proveedor text, activo boolean default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.inventario_movimientos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  producto_id uuid not null references public.inventario_productos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','salida','ajuste')),
  cantidad numeric(12,2) not null,
  orden_id uuid references public.ordenes(id) on delete set null,
  notas text, fecha timestamptz default now()
);

create table if not exists public.servicio_consumos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  servicio_id uuid not null references public.servicios(id) on delete cascade,
  producto_id uuid not null references public.inventario_productos(id) on delete cascade,
  cantidad numeric(12,2) not null
);

create table if not exists public.periodos_nomina (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null, fecha_inicio date not null, fecha_fin date not null,
  tipo_frecuencia text not null default 'quincenal'
    check (tipo_frecuencia in ('semanal','quincenal','mensual','otro')),
  estado text not null default 'abierto' check (estado in ('abierto','cerrado')),
  total_comisiones numeric(14,2) default 0, created_at timestamptz default now()
);

create table if not exists public.comisiones (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  orden_id uuid not null references public.ordenes(id) on delete cascade,
  empleado_id uuid not null references public.empleados(id),
  periodo_id uuid references public.periodos_nomina(id),
  base numeric(12,2) not null, porcentaje numeric(5,2) not null, monto numeric(12,2) not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','pagada')),
  fecha timestamptz default now(),
  unique (orden_id, empleado_id)
);

create table if not exists public.pagos_nomina (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  periodo_id uuid not null references public.periodos_nomina(id) on delete cascade,
  empleado_id uuid not null references public.empleados(id),
  monto numeric(12,2) not null, metodo text default 'transferencia',
  notas text, fecha timestamptz default now()
);

create table if not exists public.fidelidad_movimientos (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  tipo text not null check (tipo in ('ganado','canjeado','ajuste')),
  puntos int not null, descripcion text,
  orden_id uuid references public.ordenes(id) on delete set null,
  fecha timestamptz default now()
);

create table if not exists public.membresias (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre text not null, precio numeric(12,2) not null,
  lavados_incluidos int, vigencia_dias int not null default 30,
  descripcion text, activo boolean default true
);

create table if not exists public.membresia_suscripciones (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  membresia_id uuid not null references public.membresias(id),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  fecha_inicio date not null default current_date, fecha_fin date not null,
  lavados_usados int not null default 0,
  estado text not null default 'activa' check (estado in ('activa','vencida','cancelada')),
  created_at timestamptz default now()
);

create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  codigo text not null unique default upper(substr(md5(random()::text),1,8)),
  cliente_id uuid references public.clientes(id),
  nombre_visitante text, telefono_visitante text,
  vehiculo_id uuid references public.vehiculos(id),
  servicio_id uuid not null references public.servicios(id),
  fecha date not null, hora time not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','confirmada','completada','cancelada')),
  notas text, created_at timestamptz default now()
);

create table if not exists public.whatsapp_plantillas (
  id uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  codigo text not null check (codigo in ('recepcion','terminado','promocion','fidelizacion')),
  mensaje text not null, activo boolean default true,
  unique (organizacion_id, codigo)
);

create table if not exists public.configuraciones (
  organizacion_id uuid primary key references public.organizaciones(id) on delete cascade,
  meta_diaria numeric(12,2) default 1000000,
  puntos_por_monto numeric(12,2) not null default 10000,
  dias_inactivo_ia int not null default 30,
  whatsapp_pais text default '57',
  extras jsonb
);

-- ==================== 2. FUNCIONES AUXILIARES ====================
create or replace function public.obtener_organizacion_actual() returns uuid
language sql stable security definer set search_path = public as $$
  select organizacion_id from public.empleados
  where auth_user_id = auth.uid() and activo limit 1;
$$;

create or replace function public.tiene_rol(roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.empleados
  where auth_user_id = auth.uid() and activo and rol = any(roles));
$$;

create or replace function public.fn_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ==================== 3. TRIGGERS UPDATED_AT ====================
drop trigger if exists trg_upd_organizaciones on public.organizaciones;
create trigger trg_upd_organizaciones before update on public.organizaciones for each row execute function public.fn_updated_at();
drop trigger if exists trg_upd_empleados on public.empleados;
create trigger trg_upd_empleados before update on public.empleados for each row execute function public.fn_updated_at();
drop trigger if exists trg_upd_clientes on public.clientes;
create trigger trg_upd_clientes before update on public.clientes for each row execute function public.fn_updated_at();
drop trigger if exists trg_upd_vehiculos on public.vehiculos;
create trigger trg_upd_vehiculos before update on public.vehiculos for each row execute function public.fn_updated_at();
drop trigger if exists trg_upd_servicios on public.servicios;
create trigger trg_upd_servicios before update on public.servicios for each row execute function public.fn_updated_at();
drop trigger if exists trg_upd_ordenes on public.ordenes;
create trigger trg_upd_ordenes before update on public.ordenes for each row execute function public.fn_updated_at();
drop trigger if exists trg_upd_inventario on public.inventario_productos;
create trigger trg_upd_inventario before update on public.inventario_productos for each row execute function public.fn_updated_at();

-- ==================== 4. TRIGGERS DE NEGOCIO ====================
-- Número de orden secuencial por organización (#1, #2, ...)
create or replace function public.fn_numero_orden() returns trigger
language plpgsql as $$
declare n int;
begin
  select coalesce(max(numero),0)+1 into n from public.ordenes where organizacion_id = new.organizacion_id;
  new.numero := n; return new;
end $$;
drop trigger if exists trg_numero_orden on public.ordenes;
create trigger trg_numero_orden before insert on public.ordenes
for each row when (new.numero is null) execute function public.fn_numero_orden();

-- Comisión automática al completar la orden (usa el % del empleado)
create or replace function public.fn_comision_orden() returns trigger
language plpgsql as $$
declare pct numeric; base numeric;
begin
  if new.empleado_id is not null and new.estado in ('terminado','pagado','entregado')
     and old.estado not in ('terminado','pagado','entregado') then
    select porcentaje_comision into pct from public.empleados where id = new.empleado_id;
    base := coalesce(new.total,0);
    insert into public.comisiones(organizacion_id, orden_id, empleado_id, base, porcentaje, monto)
    values (new.organizacion_id, new.id, new.empleado_id, base, coalesce(pct,0), base * coalesce(pct,0) / 100)
    on conflict (orden_id, empleado_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists trg_comision_orden on public.ordenes;
create trigger trg_comision_orden after update of estado on public.ordenes
for each row execute function public.fn_comision_orden();

-- Descuento automático de inventario (receta de consumo por servicio)
create or replace function public.fn_consumo_inventario() returns trigger
language plpgsql as $$
declare rec record;
begin
  if new.estado in ('terminado','pagado','entregado')
     and old.estado not in ('terminado','pagado','entregado') then
    for rec in select producto_id, cantidad from public.servicio_consumos
               where servicio_id = new.servicio_id loop
      insert into public.inventario_movimientos(organizacion_id, producto_id, tipo, cantidad, orden_id, notas)
      values (new.organizacion_id, rec.producto_id, 'salida', rec.cantidad, new.id,
              'Consumo automatico - orden #' || new.numero);
      update public.inventario_productos set stock = stock - rec.cantidad where id = rec.producto_id;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists trg_consumo_inventario on public.ordenes;
create trigger trg_consumo_inventario after update of estado on public.ordenes
for each row execute function public.fn_consumo_inventario();

-- Estadísticas del vehículo al pagar
create or replace function public.fn_stats_vehiculo() returns trigger
language plpgsql as $$
begin
  if new.estado = 'pagado' and old.estado <> 'pagado' then
    update public.vehiculos set
      lavados_acumulados = lavados_acumulados + 1,
      ultimo_lavado = current_date,
      total_gastado = total_gastado + coalesce(new.total,0)
    where id = new.vehiculo_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_stats_vehiculo on public.ordenes;
create trigger trg_stats_vehiculo after update of estado on public.ordenes
for each row execute function public.fn_stats_vehiculo();

-- Al registrar un pago: total del cliente, orden → pagado, puntos fidelidad
create or replace function public.fn_pago_efectos() returns trigger
language plpgsql as $$
declare v_cliente uuid; v_pts int; v_factor numeric; v_orden public.ordenes;
begin
  select * into v_orden from public.ordenes where id = new.orden_id;
  v_cliente := v_orden.cliente_id;
  update public.clientes set total_gastado = total_gastado + new.monto, ultima_visita = now()
  where id = v_cliente;
  update public.ordenes set estado = 'pagado'
  where id = new.orden_id and estado in ('recibido','en_proceso','terminado');
  select puntos_por_monto into v_factor from public.configuraciones
  where organizacion_id = new.organizacion_id;
  if v_factor is not null and v_factor > 0 then
    v_pts := floor(new.monto / v_factor);
    if v_pts > 0 then
      insert into public.fidelidad_movimientos(organizacion_id, cliente_id, tipo, puntos, descripcion, orden_id)
      values (new.organizacion_id, v_cliente, 'ganado', v_pts, 'Puntos por pago orden #' || v_orden.numero, new.orden_id);
      update public.clientes set puntos = puntos + v_pts where id = v_cliente;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_pago_efectos on public.pagos;
create trigger trg_pago_efectos after insert on public.pagos
for each row execute function public.fn_pago_efectos();

-- Datos iniciales automáticos al crear una organización (catálogos sembrados)
create or replace function public.fn_seed_organizacion() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.metodos_pago(organizacion_id, nombre, tipo) values
    (new.id,'Efectivo','efectivo'),(new.id,'Tarjeta','tarjeta'),
    (new.id,'Transferencia','transferencia'),(new.id,'Nequi','nequi'),
    (new.id,'Daviplata','daviplata'),(new.id,'Otros','otros');
  insert into public.servicios(organizacion_id,nombre,tipo_vehiculo,precio,duracion_min) values
    (new.id,'Lavado basico','carro',15000,30),(new.id,'Lavado completo','carro',25000,45),
    (new.id,'Lavado premium','carro',40000,60),(new.id,'Lavado + aspirado','carro',30000,50),
    (new.id,'Desinfeccion','carro',20000,40),(new.id,'Lavado basico','moto',8000,20),
    (new.id,'Lavado premium','moto',15000,30),(new.id,'Desengrase','moto',12000,25);
  insert into public.servicios_adicionales(organizacion_id,nombre,precio) values
    (new.id,'Aspirado',8000),(new.id,'Brillado',10000),(new.id,'Encerado',15000),
    (new.id,'Polichado',25000),(new.id,'Desmanchado',20000),(new.id,'Limpieza de tapiceria',30000),
    (new.id,'Limpieza de motor',20000),(new.id,'Restauracion de plasticos',12000),
    (new.id,'Restauracion de farolas',15000),(new.id,'Tratamiento ceramico',80000);
  insert into public.inventario_productos(organizacion_id,nombre,unidad,stock,stock_minimo,costo_unitario) values
    (new.id,'Shampoo','ml',5000,10000,15),(new.id,'Cera','ml',2000,3000,40),
    (new.id,'Desengrasante','ml',3000,5000,25),(new.id,'Silicona','ml',1000,2000,35),
    (new.id,'Ambientador','unidad',10,20,3000),(new.id,'Panos','unidad',20,30,2000),
    (new.id,'Esponjas','unidad',15,25,1500),(new.id,'Guantes','unidad',5,10,4000);
  insert into public.servicio_consumos(organizacion_id, servicio_id, producto_id, cantidad)
  select new.id, s.id, p.id, 100
  from public.servicios s, public.inventario_productos p
  where s.organizacion_id = new.id and s.nombre = 'Lavado basico' and s.tipo_vehiculo = 'carro'
    and p.organizacion_id = new.id and p.nombre = 'Shampoo';
  insert into public.membresias(organizacion_id,nombre,precio,lavados_incluidos,vigencia_dias,descripcion) values
    (new.id,'Basico',50000,4,30,'4 lavados al mes'),
    (new.id,'Premium',90000,8,30,'8 lavados al mes'),
    (new.id,'VIP',150000,null,30,'Lavados ilimitados');
  insert into public.whatsapp_plantillas(organizacion_id,codigo,mensaje) values
    (new.id,'recepcion','Hola {cliente} 👋 Recibimos tu {vehiculo} ({placa}). Te avisaremos cuando esté listo. — {organizacion}'),
    (new.id,'terminado','🚗 ¡{cliente}, tu {vehiculo} ({placa}) ya está listo para recoger! — {organizacion}'),
    (new.id,'promocion','Hola {cliente} 👋 Hace {dias} días no vemos tu vehículo. Esta semana tienes 15% de descuento en lavado premium. — {organizacion}'),
    (new.id,'fidelizacion','🎉 ¡{cliente}, completaste {lavados} lavados! Tu próximo lavado tiene descuento. — {organizacion}');
  insert into public.configuraciones(organizacion_id) values (new.id);
  return new;
end $$;
drop trigger if exists trg_seed_organizacion on public.organizaciones;
create trigger trg_seed_organizacion after insert on public.organizaciones
for each row execute function public.fn_seed_organizacion();

-- ==================== 5. RPC PARA DASHBOARD ====================
create or replace function public.rpc_dashboard_resumen(p_fecha date default current_date)
returns json language plpgsql stable security definer set search_path = public as $$
declare org uuid := public.obtener_organizacion_actual(); r json;
begin
  if org is null then return null; end if;
  select json_build_object(
    'carros', count(*) filter (where v.tipo='carro'),
    'motos', count(*) filter (where v.tipo='moto'),
    'servicios', count(*),
    'ventas', coalesce(sum(o.total),0),
    'pendientes', count(*) filter (where o.estado in ('recibido','en_proceso')),
    'terminados', count(*) filter (where o.estado in ('terminado','pagado','entregado')),
    'efectivo', coalesce(sum(p.monto) filter (where m.tipo='efectivo'),0),
    'tarjeta', coalesce(sum(p.monto) filter (where m.tipo='tarjeta'),0),
    'transferencias', coalesce(sum(p.monto) filter (where m.tipo in ('transferencia','nequi','daviplata')),0),
    'otros', coalesce(sum(p.monto) filter (where m.tipo='otros'),0)
  ) into r
  from public.ordenes o
  join public.vehiculos v on v.id = o.vehiculo_id
  left join public.pagos p on p.orden_id = o.id
  left join public.metodos_pago m on m.id = p.metodo_id
  where o.organizacion_id = org and o.fecha_entrada::date = p_fecha;
  return coalesce(r, json_build_object('carros',0,'motos',0,'servicios',0,'ventas',0,
    'pendientes',0,'terminados',0,'efectivo',0,'tarjeta',0,'transferencias',0,'otros',0));
end $$;
grant execute on function public.rpc_dashboard_resumen(date) to authenticated;

-- ==================== 6. ROW LEVEL SECURITY ====================
alter table public.organizaciones enable row level security;
alter table public.empleados enable row level security;
alter table public.clientes enable row level security;
alter table public.vehiculos enable row level security;
alter table public.servicios enable row level security;
alter table public.servicios_adicionales enable row level security;
alter table public.ordenes enable row level security;
alter table public.orden_extras enable row level security;
alter table public.orden_fotos enable row level security;
alter table public.metodos_pago enable row level security;
alter table public.pagos enable row level security;
alter table public.caja_sesiones enable row level security;
alter table public.caja_movimientos enable row level security;
alter table public.inventario_productos enable row level security;
alter table public.inventario_movimientos enable row level security;
alter table public.servicio_consumos enable row level security;
alter table public.periodos_nomina enable row level security;
alter table public.comisiones enable row level security;
alter table public.pagos_nomina enable row level security;
alter table public.fidelidad_movimientos enable row level security;
alter table public.membresias enable row level security;
alter table public.membresia_suscripciones enable row level security;
alter table public.reservas enable row level security;
alter table public.whatsapp_plantillas enable row level security;
alter table public.configuraciones enable row level security;

-- Organizaciones (con bootstrap para el primer admin)
drop policy if exists select_organizaciones on public.organizaciones;
create policy select_organizaciones on public.organizaciones
  for select to authenticated
  using (id = public.obtener_organizacion_actual());
drop policy if exists insert_organizaciones on public.organizaciones;
create policy insert_organizaciones on public.organizaciones
  for insert to authenticated
  with check (public.obtener_organizacion_actual() is null);
drop policy if exists update_organizaciones on public.organizaciones;
create policy update_organizaciones on public.organizaciones
  for update to authenticated
  using (id = public.obtener_organizacion_actual() and public.tiene_rol(array['admin','supervisor']))
  with check (id = public.obtener_organizacion_actual());
drop policy if exists delete_organizaciones on public.organizaciones;
create policy delete_organizaciones on public.organizaciones
  for delete to authenticated
  using (id = public.obtener_organizacion_actual() and public.tiene_rol(array['admin']));

-- Empleados (gestión admin/supervisor + auto-registro bootstrap)
drop policy if exists select_empleados on public.empleados;
create policy select_empleados on public.empleados
  for select to authenticated
  using (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists insert_empleados on public.empleados;
create policy insert_empleados on public.empleados
  for insert to authenticated
  with check ((organizacion_id = public.obtener_organizacion_actual() and public.tiene_rol(array['admin','supervisor']))
           or (auth_user_id = auth.uid() and public.obtener_organizacion_actual() is null));
drop policy if exists update_empleados on public.empleados;
create policy update_empleados on public.empleados
  for update to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists delete_empleados on public.empleados;
create policy delete_empleados on public.empleados
  for delete to authenticated
  using (organizacion_id = public.obtener_organizacion_actual() and public.tiene_rol(array['admin']));

-- Resto de tablas: aislamiento total por organización (FOR ALL)
drop policy if exists all_clientes on public.clientes;
create policy all_clientes on public.clientes for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_vehiculos on public.vehiculos;
create policy all_vehiculos on public.vehiculos for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_servicios on public.servicios;
create policy all_servicios on public.servicios for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_adicionales on public.servicios_adicionales;
create policy all_adicionales on public.servicios_adicionales for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_ordenes on public.ordenes;
create policy all_ordenes on public.ordenes for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_orden_extras on public.orden_extras;
create policy all_orden_extras on public.orden_extras for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_orden_fotos on public.orden_fotos;
create policy all_orden_fotos on public.orden_fotos for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_metodos_pago on public.metodos_pago;
create policy all_metodos_pago on public.metodos_pago for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_pagos on public.pagos;
create policy all_pagos on public.pagos for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_caja_sesiones on public.caja_sesiones;
create policy all_caja_sesiones on public.caja_sesiones for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_caja_movimientos on public.caja_movimientos;
create policy all_caja_movimientos on public.caja_movimientos for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_inv_productos on public.inventario_productos;
create policy all_inv_productos on public.inventario_productos for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_inv_movimientos on public.inventario_movimientos;
create policy all_inv_movimientos on public.inventario_movimientos for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_consumos on public.servicio_consumos;
create policy all_consumos on public.servicio_consumos for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_periodos on public.periodos_nomina;
create policy all_periodos on public.periodos_nomina for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_comisiones on public.comisiones;
create policy all_comisiones on public.comisiones for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_pagos_nomina on public.pagos_nomina;
create policy all_pagos_nomina on public.pagos_nomina for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_fidelidad on public.fidelidad_movimientos;
create policy all_fidelidad on public.fidelidad_movimientos for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_membresias on public.membresias;
create policy all_membresias on public.membresias for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_suscripciones on public.membresia_suscripciones;
create policy all_suscripciones on public.membresia_suscripciones for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_reservas on public.reservas;
create policy all_reservas on public.reservas for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_whatsapp on public.whatsapp_plantillas;
create policy all_whatsapp on public.whatsapp_plantillas for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());
drop policy if exists all_config on public.configuraciones;
create policy all_config on public.configuraciones for all to authenticated
  using (organizacion_id = public.obtener_organizacion_actual())
  with check (organizacion_id = public.obtener_organizacion_actual());

-- ==================== 7. STORAGE DE FOTOS ====================
insert into storage.buckets (id, name, public)
values ('fotos-vehiculos','fotos-vehiculos', true)
on conflict (id) do nothing;
drop policy if exists "fotos_lectura" on storage.objects;
create policy "fotos_lectura" on storage.objects
  for select using (bucket_id = 'fotos-vehiculos');
drop policy if exists "fotos_subir" on storage.objects;
create policy "fotos_subir" on storage.objects
  for insert to authenticated with check (bucket_id = 'fotos-vehiculos');
drop policy if exists "fotos_borrar" on storage.objects;
create policy "fotos_borrar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos-vehiculos' and public.tiene_rol(array['admin','supervisor','cajero']));

-- =====================================================================
-- FIN — Tras ejecutar: crea tu usuario en Authentication y vincúlalo:
--   insert into public.organizaciones (nombre) values ('Mi Lavadero');
--   insert into public.empleados (organizacion_id, auth_user_id, nombre, rol, porcentaje_comision)
--   select o.id, u.id, 'Administrador', 'admin', 30
--   from public.organizaciones o, auth.users u
--   where o.nombre = 'Mi Lavadero' and u.email = 'tu-email@ejemplo.com';
-- =====================================================================
