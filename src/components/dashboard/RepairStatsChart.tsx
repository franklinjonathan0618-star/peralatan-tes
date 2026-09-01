import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { usePerbaikan } from '@/hooks/usePerbaikan';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

interface RepairData {
  name: string;
  value: number;
}

const RepairStatsChart = () => {
  const { data: perbaikanData = [], isLoading } = usePerbaikan();

  const repairStats = useMemo<RepairData[]>(() => {
    if (!perbaikanData || perbaikanData.length === 0) {
      return [
        { name: 'Selesai', value: 0 },
        { name: 'Dalam Perbaikan', value: 0 },
        { name: 'Menunggu Sparepart', value: 0 },
      ];
    }

    const stats = {
      selesai: perbaikanData.filter(p => {
        const s = (p.status || '').toLowerCase().trim();
        return s === 'selesai';
      }).length,
      dalamPerbaikan: perbaikanData.filter(p => {
        const s = (p.status || '').toLowerCase().trim();
        return s === 'dalam_perbaikan' || s === 'dalam perbaikan' || s === 'proses';
      }).length,
      menungguSparepart: perbaikanData.filter(p => {
        const s = (p.status || '').toLowerCase().trim();
        return s === 'menunggu_sparepart' || s === 'menunggu sparepart' || s === 'dibatalkan' || s === 'pending';
      }).length,
    };

    return [
      { name: 'Selesai', value: stats.selesai },
      { name: 'Dalam Perbaikan', value: stats.dalamPerbaikan },
      { name: 'Menunggu Sparepart', value: stats.menungguSparepart },
    ];
  }, [perbaikanData]);

  const total = useMemo(() => repairStats.reduce((acc, curr) => acc + curr.value, 0), [repairStats]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Statistik Perbaikan</CardTitle>
          <CardDescription>Status perbaikan alat berat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Memuat data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Jika tidak ada alat dalam perbaikan (total = 0), tampilkan visual 0%
  if (total === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Statistik Perbaikan</CardTitle>
          <CardDescription>Status perbaikan alat berat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="75%">
              <PieChart>
                <Pie
                  data={[{ name: 'Tanpa Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  fill="#e2e8f0"
                  dataKey="value"
                  isAnimationActive={false}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-700">0%</span>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Tidak ada alat<br />dalam perbaikan</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-gray-600 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: COLORS[0] }} />
                <span>Selesai: 0%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: COLORS[1] }} />
                <span>Dalam Perbaikan: 0%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: COLORS[2] }} />
                <span>Menunggu Sparepart: 0%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Statistik Perbaikan</CardTitle>
        <CardDescription>Status perbaikan alat berat</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={repairStats}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => 
                  value > 0 ? `${name}: ${((value / total) * 100).toFixed(0)}%` : ''
                }
              >
                {repairStats.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} alat (${((value / total) * 100).toFixed(0)}%)`, 'Jumlah']} 
              />
              <Legend 
                formatter={(value: string) => {
                  const item = repairStats.find(r => r.name === value);
                  const pct = item && total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
                  return <span className="text-xs text-gray-700 font-medium">{value} ({pct}%)</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepairStatsChart;
