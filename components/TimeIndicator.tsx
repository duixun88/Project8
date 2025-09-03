import { getCurrentTimePixels } from '../utils/timeUtils';

interface TimeIndicatorProps {
  currentTime: Date;
}

export function TimeIndicator({ currentTime }: TimeIndicatorProps) {
  const currentPixels = getCurrentTimePixels(currentTime);
  const position = (currentPixels / 1000) * 100;
  
  return (
    <div className="relative w-full h-2 bg-gray-100 dark:bg-gray-700 rounded mb-6">
      <div 
        className="absolute top-0 w-1 h-full bg-red-500 dark:bg-red-400 rounded shadow-lg transition-all duration-500"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      />
      <div 
        className="absolute -top-6 text-xs font-mono text-red-600 dark:text-red-400 font-medium"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {currentTime.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-3">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
    </div>
  );
}