import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { colorOf, FRAGRANCE_QUERY_KEY, fragranceColors, logFragrance, useFragranceStatus } from "@/lib/fragrance";

// Unlisted: /off-the-clock/log. Save it to the phone's home screen, enter the
// token once, then log the day's fragrance with one tap. The token is checked
// in the database (public.log_fragrance); the page itself holds no secrets.
const TOKEN_KEY = "rukawa:fragrance-token";

// Search by name or house, accents optional ("hermes" finds Hermès).
const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
};

const FragranceLog = () => {
  const queryClient = useQueryClient();
  const { data } = useFragranceStatus();
  const [token, setToken] = useState(readToken);
  const [name, setName] = useState("");
  const [house, setHouse] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [query, setQuery] = useState("");
  const colors = useMemo(() => fragranceColors(data?.collection ?? []), [data]);

  const shown = useMemo(() => {
    const q = fold(query.trim());
    const all = data?.collection ?? [];
    return q ? all.filter((f) => fold(`${f.name} ${f.house ?? ""}`).includes(q)) : all;
  }, [data, query]);

  useEffect(() => {
    const previous = document.title;
    document.title = "Log fragrance | Rukawa Analytics";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => {
      document.title = previous;
      robots.remove();
    };
  }, []);

  const saveToken = (value: string) => {
    setToken(value);
    try {
      localStorage.setItem(TOKEN_KEY, value);
    } catch {
      // Private mode: the token just won't be remembered.
    }
  };

  const submit = async (fragrance: string, fragranceHouse?: string) => {
    if (!token) {
      setMessage({ ok: false, text: "Enter your token first." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const status = await logFragrance(token, fragrance, fragranceHouse);
      queryClient.setQueryData(FRAGRANCE_QUERY_KEY, status);
      setMessage({ ok: true, text: `Logged for today: ${fragrance}` });
      setName("");
      setHouse("");
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  };

  const wornToday = data?.latest && data.latest.worn_on === data.today ? data.latest.name : null;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-10">
      <h1 className="text-2xl font-semibold text-foreground">Today&apos;s fragrance</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {wornToday ? `Logged: ${wornToday}. Tap another one to change it.` : "Nothing logged yet today."}
      </p>

      <label className="mt-8 block text-sm text-muted-foreground" htmlFor="token">
        Token (saved on this device)
      </label>
      <Input
        id="token"
        type="password"
        autoComplete="off"
        value={token}
        onChange={(e) => saveToken(e.target.value)}
        className="mt-2"
      />

      {data && data.collection.length > 0 && (
        <Input
          type="search"
          placeholder={`Search ${data.collection.length} bottles`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-8"
          aria-label="Search the shelf"
        />
      )}

      {data && data.collection.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {shown.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => submit(f.name)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                  wornToday === f.name ? "border-clash-gold/70 bg-clash-gold/10" : "border-border hover:bg-secondary/50"
                }`}
              >
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: colorOf(colors, f.id) }} />
                <span className="flex-1">
                  <span className="block text-foreground">{f.name}</span>
                  {f.house && <span className="block text-xs text-muted-foreground">{f.house}</span>}
                </span>
                <span className="text-xs text-muted-foreground">{f.worn_total}×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-8 space-y-3 rounded-lg border border-dashed border-border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) submit(name.trim(), house.trim() || undefined);
        }}
      >
        <p className="text-sm font-medium text-foreground">Something new</p>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <Input placeholder="House (optional)" value={house} onChange={(e) => setHouse(e.target.value)} maxLength={80} />
        <Button type="submit" disabled={busy || !name.trim()} className="w-full">
          Log for today
        </Button>
      </form>

      {message && (
        <p role="status" className={`mt-6 text-sm ${message.ok ? "text-clash-gold" : "text-destructive"}`}>
          {message.text}
        </p>
      )}

      <Link to="/off-the-clock" className="mt-10 inline-block text-sm text-muted-foreground hover:text-foreground">
        See it on the page →
      </Link>
    </main>
  );
};

export default FragranceLog;
