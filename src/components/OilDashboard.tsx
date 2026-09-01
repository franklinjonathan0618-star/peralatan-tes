import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";


interface OilDashboardProps {
  data: {
    tanggal: string;
    pemakaianOli40: number;
    pemakaianOli10: number;
    pemakaianOli90: number;
  }[];
}

export function OilDashboard({ data }: OilDashboardProps) {
  const totalOli40 = data.reduce((sum, item) => sum + item.pemakaianOli40, 0);
  const totalOli10 = data.reduce((sum, item) => sum + item.pemakaianOli10, 0);
  const totalOli90 = data.reduce((sum, item) => sum + item.pemakaianOli90, 0);

  // Get last 7 days data
  const last7Days = data
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 7);

  const getOilTrend = (oilType: 'pemakaianOli40' | 'pemakaianOli10' | 'pemakaianOli90') => {
    if (last7Days.length < 2) return 0;
    const recent = last7Days[0][oilType];
    const previous = last7Days[1][oilType];
    return ((recent - previous) / previous) * 100;
  };

  const getLastUsage = (oilType: 'pemakaianOli40' | 'pemakaianOli10' | 'pemakaianOli90') => {
    return last7Days[0]?.[oilType] || 0;
  };

  const renderTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (trend < 0) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Dashboard Pemakaian Oli</h2>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oli 40</CardTitle>
            <Droplets className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Pemakaian:</span>
                <span className="text-lg font-bold">{totalOli40.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pemakaian Terakhir:</span>
                <span className="text-lg">{getLastUsage('pemakaianOli40')} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trend:</span>
                <div className="flex items-center gap-1">
                  {renderTrendIcon(getOilTrend('pemakaianOli40'))}
                  <span>{Math.abs(getOilTrend('pemakaianOli40')).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oli 10</CardTitle>
            <Droplets className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Pemakaian:</span>
                <span className="text-lg font-bold">{totalOli10.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pemakaian Terakhir:</span>
                <span className="text-lg">{getLastUsage('pemakaianOli10')} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trend:</span>
                <div className="flex items-center gap-1">
                  {renderTrendIcon(getOilTrend('pemakaianOli10'))}
                  <span>{Math.abs(getOilTrend('pemakaianOli10')).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oli 90</CardTitle>
            <Droplets className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Pemakaian:</span>
                <span className="text-lg font-bold">{totalOli90.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pemakaian Terakhir:</span>
                <span className="text-lg">{getLastUsage('pemakaianOli90')} L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Trend:</span>
                <div className="flex items-center gap-1">
                  {renderTrendIcon(getOilTrend('pemakaianOli90'))}
                  <span>{Math.abs(getOilTrend('pemakaianOli90')).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
