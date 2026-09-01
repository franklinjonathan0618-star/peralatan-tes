
import { useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { CalendarDays, Wrench, Activity, TrendingUp, AlertCircle, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { parseMySQLDate } from '@/utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Import hooks
import { useAlatBerat } from '@/hooks/useAlatBerat';
import { useTimeSheet } from '@/hooks/useTimeSheet';
import { usePerbaikan } from '@/hooks/usePerbaikan';
import { useOliStocks } from '@/hooks/useOliStocks';
import { usePemutihan } from '@/hooks/usePemutihan';

// Import chart components
import BBMChart from '@/components/dashboard/BBMChart';
import RepairStatsChart from '@/components/dashboard/RepairStatsChart';
import { OilChart40 } from '@/components/dashboard/OilChart40';
import { OilChart10 } from '@/components/dashboard/OilChart10';
import { OilChart90 } from '@/components/dashboard/OilChart90';

interface DashboardStats {
  totalAlatBerat: number;
  alatBeroperasi: number;
  alatMaintenance: number;

  alatRusak: number;
  totalPerbaikan: number;
  perbaikanSelesai: number;
  perbaikanProses: number;
  totalTimesheet: number;
  kanibalCount: number;
  terjualCount: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    toast({
      title: "Logout Berhasil",
      description: "Anda telah berhasil logout.",
    });
    navigate('/login');
  };
  const { data: alatBeratData = [], isLoading: isLoadingAlatBerat, error: errorAlatBerat } = useAlatBerat();
  const { data: timesheetData = [], isLoading: isLoadingTimesheet, error: errorTimesheet } = useTimeSheet();
  const { data: perbaikanData = [], isLoading: isLoadingPerbaikan, error: errorPerbaikan } = usePerbaikan();
  const { data: oliStocks = [] } = useOliStocks();
  const { data: pemutihanData = [] } = usePemutihan();

  // Handle loading state
  const isLoading = isLoadingAlatBerat || isLoadingTimesheet || isLoadingPerbaikan;
  
  // Check if all data sources have critical errors (not loading and no data)
  const hasConnectionError = !isLoading && (!alatBeratData?.length && !timesheetData?.length && !perbaikanData?.length) && (errorAlatBerat || errorTimesheet || errorPerbaikan);
  
  // Handle errors
  useEffect(() => {
    if (errorAlatBerat) {
      console.error('AlatBerat Error:', errorAlatBerat);
      toast({
        title: "Error",
        description: errorAlatBerat.message || "Gagal memuat data alat berat",
        variant: "destructive",
      });
    }
    if (errorTimesheet) {
      console.error('Timesheet Error:', errorTimesheet);
      toast({
        title: "Error",
        description: errorTimesheet.message || "Gagal memuat data timesheet",
        variant: "destructive",
      });
    }
    if (errorPerbaikan) {
      console.error('Perbaikan Error:', errorPerbaikan);
      toast({
        title: "Error",
        description: errorPerbaikan.message || "Gagal memuat data perbaikan",
        variant: "destructive",
      });
    }
  }, [errorAlatBerat, errorTimesheet, errorPerbaikan]);

  const stats = useMemo<DashboardStats>(() => {
    const totalAlatBerat = alatBeratData.length;
    const alatBeroperasi = alatBeratData.filter(alat => alat.status?.toLowerCase() === 'standby').length;
    const alatMaintenance = alatBeratData.filter(alat => alat.kondisi?.toLowerCase() === 'maintenance').length;
    const alatRusak = alatBeratData.filter(alat => alat.kondisi?.toLowerCase() === 'rusak').length;
    const totalPerbaikan = perbaikanData.length;
    const perbaikanSelesai = perbaikanData.filter(p => p.status === 'selesai').length;
    const perbaikanProses = perbaikanData.filter(p => p.status === 'dalam_perbaikan').length;
    const totalTimesheet = timesheetData.length;
    const kanibalCount = pemutihanData.filter(p => p.status === 'kanibal').length;
    const terjualCount = pemutihanData.filter(p => p.status === 'terjual').length;

    return {
      totalAlatBerat,
      alatBeroperasi,
      alatMaintenance,
      alatRusak,
      totalPerbaikan,
      perbaikanSelesai,
      perbaikanProses,
      totalTimesheet,
      kanibalCount,
      terjualCount,
    };
  }, [alatBeratData, perbaikanData, timesheetData, pemutihanData]);

  const formatDate = (dateString: string) => {
    try {
      const d = parseMySQLDate(dateString);
      return d ? format(d, 'dd MMMM yyyy') : dateString;
    } catch (error) {
      return dateString;
    }
  };

  const getRecentActivities = (): Array<{type: string; message: string; date: string; status: string}> => {
    const activities: Array<{type: string; message: string; date: string; status: string}> = [];
    
    // Recent timesheet entries
    if (timesheetData) {
      const recentTimesheet = timesheetData.slice(0, 3);
      recentTimesheet.forEach(entry => {
        activities.push({
          type: 'timesheet',
          message: `${entry.namaOperator} mengoperasikan ${entry.namaAlat}`,
          date: entry.tanggal,
          status: 'info'
        });
      });
    }
    
    // Recent repairs
    if (perbaikanData) {
      const recentRepairs = perbaikanData.slice(0, 3);
      recentRepairs.forEach(repair => {
        activities.push({
          type: 'repair',
          message: `Perbaikan ${repair.namaAlat} - ${repair.status}`,
          date: repair.tanggal,
          status: repair.status === 'selesai' ? 'success' : 'warning'
        });
      });
    }
    
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  };

  const getMaintenanceAlerts = (): Array<{alat: string; noLambung: string; status: string}> => {
    if (!alatBeratData) return [];

    const alerts: Array<{alat: string; noLambung: string; status: string}> = [];

    alatBeratData.forEach(alat => {
      const kondisi = alat.kondisi?.toLowerCase();
      if (kondisi === 'maintenance' || kondisi === 'rusak') {
        alerts.push({
          alat: alat.nama_alat,
          noLambung: alat.no_lambung,
          status: kondisi === 'rusak' ? 'Rusak' : 'Maintenance'
        });
      }
    });

    return alerts;
  };

  const recentActivities = getRecentActivities();
  const maintenanceAlerts = getMaintenanceAlerts();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  // Show connection error state
  if (hasConnectionError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Koneksi Tidak Tersedia</CardTitle>
            <CardDescription>
              Gagal menghubungkan ke server. Silakan periksa koneksi internet Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Informasi Dashboard</h2>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline-block">
              {formatDate(new Date().toISOString())}
            </span>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alat Berat</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlatBerat}</div>
            <p className="text-xs text-muted-foreground">
              {stats.alatBeroperasi} beroperasi normal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alatMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              Alat dalam maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rusak</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.alatRusak}</div>
            <p className="text-xs text-muted-foreground">
              Perlu perbaikan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Perbaikan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPerbaikan}</div>
            <p className="text-xs text-muted-foreground">
              {stats.perbaikanSelesai} selesai, {stats.perbaikanProses} proses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pemutihan Alat</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-orange-600">{stats.kanibalCount}</span>
                <span className="text-xs text-muted-foreground">Kanibal</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-red-600">{stats.terjualCount}</span>
                <span className="text-xs text-muted-foreground">Terjual</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Oil Stock Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Oli SAE 40</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {oliStocks.find(s => s.jenis_oli === 'Oli SAE 40')?.jumlah_stock?.toLocaleString('id-ID') || 0} Liter
            </div>
            <p className="text-xs text-muted-foreground">
              Stock saat ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Oli SAE 10</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {oliStocks.find(s => s.jenis_oli === 'Oli SAE 10')?.jumlah_stock?.toLocaleString('id-ID') || 0} Liter
            </div>
            <p className="text-xs text-muted-foreground">
              Stock saat ini
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Oli SAE 90</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {oliStocks.find(s => s.jenis_oli === 'Oli SAE 90')?.jumlah_stock?.toLocaleString('id-ID') || 0} Liter
            </div>
            <p className="text-xs text-muted-foreground">
              Stock saat ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <div className="min-w-0 overflow-hidden">
          <BBMChart />
        </div>
        <div className="min-w-0 overflow-hidden">
          <RepairStatsChart />
        </div>
      </div>
      
      {/* Oil Charts Section - Three charts side by side */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 overflow-hidden">
          <OilChart40 />
        </div>
        <div className="min-w-0 overflow-hidden">
          <OilChart10 />
        </div>
        <div className="min-w-0 overflow-hidden">
          <OilChart90 />
        </div>
      </div>

      {/* Recent Activities and Maintenance Alerts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>
              Aktivitas terbaru dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                    <Badge variant={
                      activity.status === 'success' ? 'default' : 
                      activity.status === 'warning' ? 'secondary' : 'outline'
                    }>
                      {activity.type === 'timesheet' ? 'Timesheet' : 'Perbaikan'}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada aktivitas terbaru</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Peringatan Status Alat</CardTitle>
            <CardDescription>
              Alat yang sedang maintenance atau rusak
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {maintenanceAlerts.length > 0 ? (
                maintenanceAlerts.map((alert, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {alert.alat} ({alert.noLambung})
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {alert.status}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Semua alat dalam kondisi baik</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
};

export default Dashboard;
