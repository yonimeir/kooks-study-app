import React from 'react';
import { Heart } from 'lucide-react';

interface DedicationBannerProps {
  names: string[];
  suffix: string;
}

export const DedicationBanner: React.FC<DedicationBannerProps> = ({ names, suffix }) => {
  if (!names || names.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-study-500/15 to-amber-500/10 border-y border-study-300/40 dark:border-study-800 py-2.5 px-4 text-center transition-colors">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-study-800 dark:text-study-200">
        <span className="font-bold flex items-center gap-1 text-study-700 dark:text-study-300">
          <Heart className="w-3.5 h-3.5 fill-current text-rose-500 inline" />
          הלימוד מוקדש לרפואת:
        </span>
        {names.map((name, index) => (
          <React.Fragment key={index}>
            <span className="font-medium">{name}</span>
            {index < names.length - 1 && <span className="opacity-40">•</span>}
          </React.Fragment>
        ))}
        {suffix && (
          <>
            <span className="opacity-40">•</span>
            <span className="text-study-600 dark:text-study-400">{suffix}</span>
          </>
        )}
      </div>
    </div>
  );
};
