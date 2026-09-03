import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FisikAlatHelpTooltipProps {
  iconClassName?: string;
}

export function FisikAlatHelpTooltip({
  iconClassName = "h-3.5 w-3.5",
}: FisikAlatHelpTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={0}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Penjelasan kategori fisik alat"
            className="inline-flex shrink-0 items-center justify-center rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setOpen((prev) => !prev);
            }}
          >
            <HelpCircle className={cn("cursor-help", iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-[120] w-[min(22rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] overflow-visible whitespace-normal break-words px-3 py-2.5 text-left shadow-lg"
        >
          <div className="space-y-2">
            <p className="text-sm font-semibold leading-snug">
              Kategori Penilaian Umum:
            </p>
            <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
              <li>
                <span className="font-medium">80% – 100%:</span> Kondisi sangat baik / prima (masih layak operasional tinggi)
              </li>
              <li>
                <span className="font-medium">50% – 79%:</span> Kondisi baik / butuh perawatan ringan (minor repair)
              </li>
              <li>
                <span className="font-medium">20% – 49%:</span> Kondisi rusak / butuh perbaikan besar atau penggantian suku cadang utama (Overhaul)
              </li>
              <li>
                <span className="font-medium">0% – 19%:</span> Kondisi habis / rusak total (Breakdown / Scrap), biaya perbaikan lebih mahal daripada beli baru
              </li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
