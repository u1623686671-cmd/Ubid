
import { TreePine } from "lucide-react";
import { cn } from "@/lib/utils";

type PlateDisplayProps = {
  plateNumber: string;
  className?: string;
  size?: 'small' | 'medium';
};

export const LebanesePlateDisplay = ({ plateNumber, className, size = 'medium' }: PlateDisplayProps) => {
  const parts = plateNumber.split(/\s+/);
  const letter = parts[0] || '';
  const numbers = parts.length > 1 ? parts.slice(1).join(' ') : '';
  const fullText = `${letter}${numbers ? ` ${numbers}` : ''}`;
  const isLong = fullText.length > 6;

  return (
    // The main container. w-full makes it responsive to its parent.
    // font-mono is applied to all text within.
    <div className={cn("font-mono w-full", className)}>
        {/* This div creates the plate structure with border and shadow.
            It's a flex column to stack the header and body.
            The aspect-ratio ensures it looks like a plate. */}
        <div className="w-full rounded-md border-[3px] border-black shadow-md mx-auto flex flex-col bg-white" style={{ aspectRatio: '520 / 160' }}>
            
            {/* Header part of the plate */}
            <div className="bg-blue-600 text-white flex items-center justify-between shrink-0 px-2 py-0.5 rounded-t-sm">
                <span className="font-bold text-[10px]">LBN</span>
                <TreePine className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>

            {/* Body part of the plate containing the SVG for the number */}
            <div className="flex items-center justify-center flex-grow p-1 overflow-hidden">
              {/* SVG scales to fill its container. viewBox defines the coordinate system. */}
              <svg viewBox="0 0 520 135" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                  <text
                      x="50%"
                      y="50%"
                      dominantBaseline="middle"
                      textAnchor="middle"
                      fill="black"
                      className="font-extrabold"
                      style={{ fontSize: '120px' }}
                      textLength={isLong ? "500" : undefined}
                      lengthAdjust={isLong ? "spacingAndGlyphs" : undefined}
                  >
                      {fullText}
                  </text>
              </svg>
            </div>
        </div>
    </div>
  );
};
