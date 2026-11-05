-- NOTAS COMPARTIDAS - Base de datos Supabase
-- Pega todo esto en Supabase > SQL Editor > New query > Run

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_admin boolean not null default false,
  can_personal boolean not null default false,
  can_trabajo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Sin título',
  code text not null default '',
  body text not null default '',
  category text not null check (category in ('personal','trabajo')),
  files jsonb not null default '[]',
  created_by text, created_at timestamptz not null default now(),
  updated_by text, updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.notes enable row level security;

create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as
$$ select coalesce((select is_admin from profiles where id = auth.uid()), false) $$;

create function public.can_see(cat text) returns boolean
language sql security definer stable set search_path = public as
$$ select coalesce((select is_admin or (cat='personal' and can_personal) or (cat='trabajo' and can_trabajo)
   from profiles where id = auth.uid()), false) $$;

-- Cada persona que se registra recibe un perfil SIN permisos
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as
$$ begin insert into profiles(id, email) values (new.id, new.email); return new; end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Perfiles: cada quien ve el suyo; el admin ve y edita todos
create policy "ver perfil" on public.profiles for select using (id = auth.uid() or is_admin());
create policy "admin edita perfiles" on public.profiles for update using (is_admin()) with check (is_admin());

-- Notas: solo si tienes permiso sobre su categoría (el admin ve todo)
create policy "leer notas" on public.notes for select using (can_see(category));
create policy "crear notas" on public.notes for insert with check (can_see(category));
create policy "editar notas" on public.notes for update using (can_see(category)) with check (can_see(category));
create policy "borrar notas" on public.notes for delete using (can_see(category));

-- Archivos (bucket privado) con el mismo criterio de permisos
insert into storage.buckets (id, name, public) values ('archivos', 'archivos', false) on conflict do nothing;
create policy "archivos segun permiso" on storage.objects for all
  using (bucket_id = 'archivos' and can_see((select category from public.notes where id::text = (storage.foldername(name))[1])))
  with check (bucket_id = 'archivos' and can_see((select category from public.notes where id::text = (storage.foldername(name))[1])));

-- PASO FINAL: después de registrarte en la página con TU correo, ejecuta esto para volverte administrador:
-- update public.profiles set is_admin = true where email = 'TU_CORREO@ejemplo.com';
