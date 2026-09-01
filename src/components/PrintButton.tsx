

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { toast } from "sonner";

interface PrintButtonProps {
  onPrint?: () => void;
  title?: string;
  className?: string;
}

const PrintButton = ({ onPrint, title = "Cetak Data", className }: PrintButtonProps) => {
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
    toast.success("Menyiapkan dokumen untuk dicetak");
  };

  return (
    <Button
      onClick={handlePrint}
      className={`flex items-center gap-2 ${className || ''}`}
      variant="outline"
    >
      <Printer size={18} />
      {title}
    </Button>
  );
};

export default PrintButton;
