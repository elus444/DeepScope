-- DeepScope database schema (Supabase Postgres + pgvector).
--
-- Run this once against a fresh Supabase project (SQL Editor, or via the
-- Supabase MCP's apply_migration) before pointing the backend at it.
--
-- Security model: every table is scoped to auth.uid() via Row Level
-- Security. The backend never holds a service-role key or a direct
-- Postgres password -- it calls PostgREST using each user's own access
-- token, so RLS (not application code) is what actually isolates one
-- user's documents and chats from another's.

create extension if not exists vector with schema extensions;

-- One row per uploaded document.
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  filename text not null,
  file_type text not null,
  character_count integer not null default 0,
  chunk_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- One row per chunk of a document, with its embedding.
-- user_id is denormalized from documents so RLS policies here don't
-- need a join, and so a similarity search can filter by owner directly.
--
-- Embeddings are requested from Gemini at 1536 dims (via
-- output_dimensionality) instead of the model's native 3072 -- pgvector's
-- HNSW index caps out at 2000 dims, and Gemini's embedding model uses
-- Matryoshka representation learning, so truncating to 1536 keeps
-- nearly all retrieval quality while staying indexable.
create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

create index chunks_embedding_idx on public.chunks
  using hnsw (embedding extensions.vector_cosine_ops);
create index chunks_user_id_idx on public.chunks (user_id);
create index chunks_document_id_idx on public.chunks (document_id);

-- A conversation thread, so follow-up questions keep context.
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now()
);
create index chat_sessions_user_id_idx on public.chat_sessions (user_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index chat_messages_session_id_idx on public.chat_messages (session_id);
create index chat_messages_user_id_idx on public.chat_messages (user_id);

-- Row Level Security: every table is scoped to auth.uid() so one
-- user's documents/chats are never visible to another, even if a
-- query bug forgot a WHERE clause. auth.uid() is wrapped in a scalar
-- subquery so Postgres evaluates it once per query instead of once
-- per row (see the Postgres linter's auth_rls_initplan rule).
alter table public.documents enable row level security;
alter table public.chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "own documents" on public.documents
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own chunks" on public.chunks
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own chat sessions" on public.chat_sessions
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own chat messages" on public.chat_messages
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Similarity search RPC: cosine distance over the caller's own chunks
-- (RLS on public.chunks already restricts the scan to auth.uid(), the
-- WHERE clause here is belt-and-suspenders and also lets us filter to
-- one specific document), returning the source filename for citations.
create or replace function public.match_chunks(
  query_embedding extensions.vector(1536),
  match_count int default 5,
  filter_document_id uuid default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  filename text,
  content text,
  similarity float
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    c.id as chunk_id,
    c.document_id,
    d.filename,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.chunks c
  join public.documents d on d.id = c.document_id
  where c.user_id = auth.uid()
    and (filter_document_id is null or c.document_id = filter_document_id)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;
