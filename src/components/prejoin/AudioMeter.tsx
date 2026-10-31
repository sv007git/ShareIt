import React from 'react';
import { Mic, MicOff } from 'lucide-react';

export const AudioMeter: React.FC<{
  level: number;
  isMuted?: boolean;
  className?: string;
}> = ({ level, isMuted = false, className }) => {
  // 12 visual bars
  const totalBars = 14;
  const activeBars = isMuted ? 0 : Math.round((level / 100) * totalBars);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-surface-900/90 rounded-xl border border-surface-800 ${className || ''}`}>
      {isMuted ? (
        <MicOff className="w-4 h-4 text-accent-rose shrink-0" />
      ) : (
        <Mic className="w-4 h-4 text-brand-400 shrink-0" />
      )}

      <div className="flex items-center gap-0.5 h-3 flex-1">
        {Array.from({ length: totalBars }).map((_, i) => {
          const isActive = i < activeBars;
          const isHigh = i > 10;
          const isMid = i > 6;

          let barColor = 'bg-surface-700';
          if (isActive) {
            if (isHigh) barColor = 'bg-accent-rose';
            else if (isMid) barColor = 'bg-amber-400';
            else barColor = 'bg-emerald-400';
          }

          return (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                isActive ? `${barColor} h-3.5` : 'bg-surface-800 h-1.5'
              }`}
            />
          );
        })}
      </div>

      <span className="text-[10px] font-mono text-surface-400 min-w-7 text-right">
        {isMuted ? 'Muted' : `${level}%`}
      </span>
    </div>
  );
};
