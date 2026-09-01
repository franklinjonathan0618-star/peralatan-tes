import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LaporanTimeSheet = () => {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Bulanan Time Sheet</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Halaman laporan bulanan Time Sheet akan ditampilkan di sini.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LaporanTimeSheet;
