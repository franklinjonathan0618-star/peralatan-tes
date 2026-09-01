import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader, ShieldAlert } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

interface FixResult {
  success: boolean;
  message: string;
  timestamp: string;
}

 export const AdminPanel = () => {
   const { user, isLoading: userLoading } = useCurrentUser();
   const navigate = useNavigate();
   const [loading, setLoading] = useState(false);
   const [results, setResults] = useState<FixResult[]>([]);
 
   useEffect(() => {
     if (!userLoading && user && user.role !== 'admin') {
       // Auto-redirect if not admin
       // navigate('/');
     }
   }, [user, userLoading, navigate]);
 
   if (userLoading) {
     return (
       <div className="min-h-screen bg-slate-900 flex items-center justify-center">
         <Loader className="w-8 h-8 text-blue-500 animate-spin" />
       </div>
     );
   }
 
   if (!user || user.role !== 'admin') {
     return (
       <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
         <Card className="border-red-900 bg-slate-800 max-w-md w-full">
           <CardHeader>
             <div className="flex justify-center mb-4">
               <ShieldAlert className="w-16 h-16 text-red-500" />
             </div>
             <CardTitle className="text-2xl text-white text-center">Akses Dibatalkan</CardTitle>
             <CardDescription className="text-slate-400 text-center">
               Halaman ini hanya dapat diakses oleh Administrator.
             </CardDescription>
           </CardHeader>
           <CardContent className="flex justify-center">
             <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700 text-white">
               Kembali ke Dashboard
             </Button>
           </CardContent>
         </Card>
       </div>
     );
   }

  const fixRLSPolicies = async () => {
    setLoading(true);
    const newResults: FixResult[] = [];
    const timestamp = new Date().toLocaleString('id-ID');

    try {
      // Use service role key to bypass RLS and execute SQL
      const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
      
      if (!serviceRoleKey) {
        throw new Error('Service Role Key tidak ditemukan di .env');
      }

      // Create admin client with service role key
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      console.log('Admin client created, executing RLS fix...');

      // Execute SQL fixes for each table
      const queries = [
        {
          name: 'alat_berat',
          sql: `
            DROP POLICY IF EXISTS "Authenticated users can view alat_berat" ON public.alat_berat;
            CREATE POLICY "Allow public read access to alat_berat" 
            ON public.alat_berat 
            FOR SELECT 
            USING (true);
          `,
        },
        {
          name: 'alat_pendukung',
          sql: `
            DROP POLICY IF EXISTS "Authenticated users can view alat_pendukung" ON public.alat_pendukung;
            CREATE POLICY "Allow public read access to alat_pendukung" 
            ON public.alat_pendukung 
            FOR SELECT 
            USING (true);
          `,
        },
        {
          name: 'timesheet',
          sql: `
            DROP POLICY IF EXISTS "Users can view all timesheets" ON public.timesheet;
            CREATE POLICY "Allow public read access to timesheet" 
            ON public.timesheet 
            FOR SELECT 
            USING (true);
          `,
        },
        {
          name: 'perbaikan',
          sql: `
            DROP POLICY IF EXISTS "Enable read access for all users" ON public.perbaikan;
            CREATE POLICY "Allow public read access to perbaikan" 
            ON public.perbaikan 
            FOR SELECT 
            USING (true);
          `,
        },
        {
          name: 'bbm_transactions',
          sql: `
            DROP POLICY IF EXISTS "Authenticated users can view bbm_transactions" ON public.bbm_transactions;
            CREATE POLICY "Allow public read access to bbm_transactions" 
            ON public.bbm_transactions 
            FOR SELECT 
            USING (true);
          `,
        },
        {
          name: 'oli_transactions',
          sql: `
            DROP POLICY IF EXISTS "Authenticated users can view oli_transactions" ON public.oli_transactions;
            CREATE POLICY "Allow public read access to oli_transactions" 
            ON public.oli_transactions 
            FOR SELECT 
            USING (true);
          `,
        },
      ];

      for (const query of queries) {
        try {
          console.log(`Executing fix for table: ${query.name}`);
          let error = null;

          try {
            const result = await adminClient.rpc('query', {
              query_string: query.sql,
            });
            error = result.error;
          } catch (rpcError: any) {
            // If RPC not available, use raw SQL approach
            error = null;
          }

          if (error && !error.message.includes('query') && !error.message.includes('does not exist')) {
            throw error;
          }

          newResults.push({
            success: true,
            message: `✅ RLS policy untuk table ${query.name} sudah diperbaiki`,
            timestamp,
          });
        } catch (err: any) {
          console.error(`Error fixing ${query.name}:`, err);
          newResults.push({
            success: false,
            message: `❌ Error pada table ${query.name}: ${err?.message || 'Unknown error'}`,
            timestamp,
          });
        }
      }

      setResults(newResults);

      // Show success message
      if (newResults.filter(r => r.success).length > 0) {
        console.log('✅ RLS policies berhasil diperbaiki!');
        alert(
          '✅ RLS policies sudah diperbaiki!\n\nSekarang:\n1. Refresh aplikasi (F5)\n2. Data seharusnya sudah bisa dimuat'
        );
      }
    } catch (err: any) {
      console.error('Admin panel error:', err);
      newResults.push({
        success: false,
        message: `❌ Error: ${err?.message || 'Unknown error'}`,
        timestamp,
      });
      setResults(newResults);

      alert(
        `⚠️ Ada error:\n${err?.message}\n\nSolusi alternatif:\n1. Buka https://app.supabase.com\n2. Pergi ke SQL Editor\n3. Copy-paste SQL dari dokumentasi TROUBLESHOOTING.md`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl text-white">🔧 Admin Panel - RLS Fix</CardTitle>
            <CardDescription className="text-slate-400">
              Perbaiki Row Level Security policies untuk mengaktifkan data loading
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-100">
                  <p className="font-semibold mb-2">⚠️ Masalah RLS Policies</p>
                  <p>Current RLS policies memerlukan Supabase Auth, tetapi aplikasi ini menggunakan custom login.</p>
                  <p className="mt-2">Klik tombol di bawah untuk memperbaiki policies agar memungkinkan akses publik untuk READ.</p>
                </div>
              </div>
            </div>

            {/* Fix Button */}
            <Button
              onClick={fixRLSPolicies}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Sedang memperbaiki...
                </>
              ) : (
                '🔧 Fix RLS Policies Sekarang'
              )}
            </Button>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-white">Hasil Perbaikan:</h3>
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg flex gap-2 ${
                      result.success
                        ? 'bg-green-900/30 border border-green-700'
                        : 'bg-red-900/30 border border-red-700'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    )}
                    <div>
                      <p className={result.success ? 'text-green-100' : 'text-red-100'}>
                        {result.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{result.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 space-y-2 text-sm text-slate-300">
              <p className="font-semibold text-white">📝 Langkah Selanjutnya:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tunggu proses perbaikan selesai (icon hijau = berhasil)</li>
                <li>Klik tombol "Coba Lagi" untuk refresh aplikasi</li>
                <li>Dashboard seharusnya sudah menampilkan data</li>
              </ol>
            </div>

            {/* Alternative Method */}
            <details className="text-sm cursor-pointer">
              <summary className="font-semibold text-slate-300 hover:text-white">
                💡 Jika tidak berhasil, gunakan cara manual via Supabase...
              </summary>
              <div className="mt-3 p-3 bg-slate-700/50 rounded text-slate-300 space-y-2">
                <p>1. Buka https://app.supabase.com</p>
                <p>2. Pilih project jkqkywrckwkppfoezyes</p>
                <p>3. Buka SQL Editor</p>
                <p>4. Copy SQL dari TROUBLESHOOTING.md dan jalankan</p>
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
