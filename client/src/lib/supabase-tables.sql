-- Create messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  user_id uuid references auth.users(id),
  user_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table messages enable row level security;

-- Allow users to view all messages
create policy "Users can view all messages"
  on messages for select
  using (true);

-- Allow users to insert messages
create policy "Users can insert messages"
  on messages for insert
  with check (auth.uid() = user_id);
