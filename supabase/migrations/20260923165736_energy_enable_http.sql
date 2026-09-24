create extension if not exists http with schema extensions;
create schema if not exists energy;
revoke all on schema energy from public, anon, authenticated;
