-- Create a table for user profiles and library data
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  saved_tracks jsonb default '[]'::jsonb,
  saved_playlists jsonb default '[]'::jsonb,
  saved_artists jsonb default '[]'::jsonb,
  user_playlists jsonb default '[]'::jsonb,
  play_history jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Create policies
create policy "Users can view own profile" 
  on profiles for select 
  using ( auth.uid() = id );

create policy "Users can update own profile" 
  on profiles for update 
  using ( auth.uid() = id );

-- Create a trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
