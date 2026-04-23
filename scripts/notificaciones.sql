-- Eliminar la tabla si existe para evitar conflictos de columnas faltantes
drop table if exists public.notificaciones cascade;

-- Crear tabla de Notificaciones
create table public.notificaciones (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade, -- Nulo si es un aviso para todo un rol
  rol_destino text, -- Ej: 'admin', 'barbero', 'recepcionista'
  titulo text not null,
  mensaje text not null,
  tipo text default 'info', -- 'info', 'success', 'warning'
  leido boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notificaciones enable row level security;

-- Políticas de Seguridad (RLS)

-- 1. Admins pueden ver y actualizar todas las notificaciones
create policy "Admins pueden ver todas las notificaciones"
  on public.notificaciones for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Admins pueden actualizar todas las notificaciones"
  on public.notificaciones for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- 2. Usuarios normales ven sus notificaciones directas (user_id) o las de su rol (rol_destino)
create policy "Usuarios ven sus propias notifs o las de su rol"
  on public.notificaciones for select
  using (
    user_id = auth.uid() or 
    rol_destino = (select role from public.profiles where id = auth.uid())
  );

create policy "Usuarios pueden actualizar sus propias notificaciones"
  on public.notificaciones for update
  using (
    user_id = auth.uid() or 
    rol_destino = (select role from public.profiles where id = auth.uid())
  );

-- 3. Cualquier usuario logueado o el sistema (anónimo al reservar) puede insertar notificaciones
create policy "Cualquiera puede insertar notificaciones"
  on public.notificaciones for insert
  with check (true);
