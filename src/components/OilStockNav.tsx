import { Droplets } from "lucide-react";

interface OilStockNavProps {
  stockOli40: number;
  stockOli10: number;
  stockOli90: number;
}

export function OilStockNav({ stockOli40, stockOli10, stockOli90 }: OilStockNavProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <Droplets className="h-4 w-4 text-blue-600 mr-1" />
        <div className="text-sm">
          <span className="font-medium">Oli 40:</span>
          <span className="ml-1">{stockOli40}L</span>
        </div>
      </div>
      <div className="flex items-center">
        <Droplets className="h-4 w-4 text-green-600 mr-1" />
        <div className="text-sm">
          <span className="font-medium">Oli 10:</span>
          <span className="ml-1">{stockOli10}L</span>
        </div>
      </div>
      <div className="flex items-center">
        <Droplets className="h-4 w-4 text-purple-600 mr-1" />
        <div className="text-sm">
          <span className="font-medium">Oli 90:</span>
          <span className="ml-1">{stockOli90}L</span>
        </div>
      </div>
    </div>
  );
}
