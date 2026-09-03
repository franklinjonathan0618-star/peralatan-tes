/**
 * MySQL API Client
 * Meniru interface Supabase agar semua hooks bisa tetap berjalan tanpa perubahan besar.
 * Semua panggilan .from().select(), .insert(), .update(), .delete() di-proxy ke backend Express.
 */

let API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3001";
if (API_URL.endsWith("/")) {
  API_URL = API_URL.slice(0, -1);
}

// Helper: fetch dengan error handling
async function apiFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      data: null,
      error: { message: err.message || "Network error", code: "NETWORK_ERROR" },
    };
  }
}

// QueryBuilder — meniru Supabase chaining API
class QueryBuilder {
  private table: string;
  private _select: string = "*";
  private _order: string | null = null;
  private _ascending: boolean = false;
  private _eq: Record<string, any> = {};
  private _gte: Record<string, any> = {};
  private _lte: Record<string, any> = {};
  private _ilike: Record<string, any> = {};
  private _limit: number | null = null;
  private _maybeSingle: boolean = false;
  private _single: boolean = false;
  private _returnSelect: boolean = false;
  private _method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private _body: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(cols: string = "*") {
    this._select = cols;
    this._returnSelect = true;
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._order = col;
    this._ascending = opts?.ascending !== false;
    return this;
  }

  eq(col: string, val: any) {
    this._eq[col] = val;
    return this;
  }

  gte(col: string, val: any) {
    this._gte[col] = val;
    return this;
  }

  lte(col: string, val: any) {
    this._lte[col] = val;
    return this;
  }

  ilike(col: string, val: any) {
    this._ilike[col] = val;
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  insert(data: any) {
    this._method = "POST";
    this._body = data;
    return this;
  }

  update(data: any) {
    this._method = "PATCH";
    this._body = data;
    return this;
  }

  delete() {
    this._method = "DELETE";
    return this;
  }

  // Eksekusi query — dipanggil saat di-await
  then(resolve: (val: any) => any, reject?: (err: any) => any): Promise<any> {
    return this._execute().then(resolve, reject);
  }

  async _execute(): Promise<{ data: any; error: any }> {
    const baseUrl = `${API_URL}/api/${this.table}`;

    if (this._method === "GET") {
      const params = new URLSearchParams();
      if (this._select && this._select !== "*")
        params.set("select", this._select);
      if (this._order) params.set("order", this._order);
      params.set("ascending", String(this._ascending));

      // Handle project_id sebagai parameter terpisah untuk multi-project support
      if (this._eq["project_id"]) {
        params.set("project_id", String(this._eq["project_id"]));
        // Hapus project_id dari eq agar tidak dikirim ganda
        delete this._eq["project_id"];
      }

      if (Object.keys(this._eq).length > 0) {
        for (const [col, val] of Object.entries(this._eq)) {
          params.append("eq", col);
          params.set(`eq_${col}`, String(val));
        }
        // Kirim eq sebagai JSON
        params.set("eq", JSON.stringify(this._eq));
      }
      if (Object.keys(this._gte).length > 0)
        params.set("gte", JSON.stringify(this._gte));
      if (Object.keys(this._lte).length > 0)
        params.set("lte", JSON.stringify(this._lte));
      if (Object.keys(this._ilike).length > 0)
        params.set("ilike", JSON.stringify(this._ilike));
      if (this._limit) params.set("limit", String(this._limit));
      if (this._maybeSingle) params.set("maybeSingle", "true");
      if (this._single) params.set("single", "true");

      const url = `${baseUrl}?${params.toString()}`;
      const result = await apiFetch(url);

      // Handle single() — jika tidak ada data, return error PGRST116
      if (this._single && result.data === null && !result.error) {
        return {
          data: null,
          error: { message: "No rows found", code: "PGRST116" },
        };
      }
      return result;
    }

    if (this._method === "POST") {
      const params = new URLSearchParams();
      if (this._returnSelect) params.set("select", this._select);
      params.set("single", "true");

      // Jika body tidak memiliki project_id, tambahkan dari localStorage
      if (this._body && !this._body.project_id) {
        const savedProject = localStorage.getItem("activeProject");
        if (savedProject) {
          try {
            const project = JSON.parse(savedProject);
            this._body.project_id = project.id;
          } catch {
            // Ignore error parsing
          }
        }
      }

      const url = `${baseUrl}?${params.toString()}`;
      return apiFetch(url, {
        method: "POST",
        body: JSON.stringify(this._body),
      });
    }

    if (this._method === "PATCH") {
      const params = new URLSearchParams();
      params.set("eq", JSON.stringify(this._eq));
      if (this._returnSelect) params.set("select", "true");
      if (this._single) params.set("single", "true");

      const url = `${baseUrl}?${params.toString()}`;
      return apiFetch(url, {
        method: "PATCH",
        body: JSON.stringify(this._body),
      });
    }

    if (this._method === "DELETE") {
      const params = new URLSearchParams();
      params.set("eq", JSON.stringify(this._eq));
      if (this._returnSelect) params.set("select", "true");
      if (this._single) params.set("single", "true");

      const url = `${baseUrl}?${params.toString()}`;
      return apiFetch(url, { method: "DELETE" });
    }

    return { data: null, error: { message: "Unknown method" } };
  }
}

// Stub channel (untuk useSubscription — tidak perlu realtime dengan MySQL)
class ChannelStub {
  on() {
    return this;
  }
  subscribe(cb?: (status: string) => void) {
    if (cb) setTimeout(() => cb("SUBSCRIBED"), 100);
    return this;
  }
  unsubscribe() {
    return Promise.resolve();
  }
}

// Auth stub — login ditangani via tabel profiles langsung
const authStub = {
  signInWithPassword: async () => ({
    data: null,
    error: new Error("Use profiles table login"),
  }),
  signOut: async () => ({ error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
};

// Client utama
export const apiClient = {
  from: (table: string) => new QueryBuilder(table),
  channel: (_name: string) => new ChannelStub(),
  auth: authStub,
};

// Export sebagai 'supabase' agar semua import lama tetap bekerja tanpa perubahan
export const supabase = apiClient as any;

export default supabase;

// Test koneksi ke backend saat startup
(async () => {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    const data = await res.json();
    if (data.status === "ok") {
      console.log("✅ Backend API terhubung ke MySQL");
    } else {
      console.warn("⚠️ Backend API error:", data);
    }
  } catch (err) {
    console.error(
      "❌ Tidak dapat terhubung ke backend API. Pastikan backend berjalan di",
      API_URL,
    );
  }
})();
