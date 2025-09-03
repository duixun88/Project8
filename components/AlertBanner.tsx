import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface Alert {
  exchangeId: string;
  exchangeName: string;
  event: 'open' | 'close';
  minutes: number;
}

interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  // 여러 알람이 있을 때 3초마다 순환
  useEffect(() => {
    if (alerts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [alerts.length]);

  // 알람이 변경될 때 인덱스 리셋
  useEffect(() => {
    setCurrentAlertIndex(0);
  }, [alerts]);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[currentAlertIndex];
  const eventText = currentAlert.event === 'open' ? '장이 시작됩니다' : '장이 마감됩니다';
  const IconComponent = currentAlert.event === 'open' ? TrendingUp : TrendingDown;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-600 dark:from-red-700 dark:via-red-600 dark:to-red-700 text-white animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center space-x-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 animate-bounce" />
            <span className="font-bold text-sm tracking-wide">BREAKING NEWS</span>
          </div>
          
          <div className="hidden sm:block w-1 h-6 bg-white/30"></div>
          
          <div className="flex items-center space-x-2 text-center">
            <IconComponent className="h-4 w-4" />
            <span className="font-semibold text-base">
              {currentAlert.minutes}분 뒤 {currentAlert.exchangeName} {eventText}
            </span>
          </div>
          
          {alerts.length > 1 && (
            <>
              <div className="hidden sm:block w-1 h-6 bg-white/30"></div>
              <div className="flex items-center space-x-1">
                {alerts.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentAlertIndex 
                        ? 'bg-white scale-125' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* 모바일에서 추가 정보 */}
        {alerts.length > 1 && (
          <div className="sm:hidden text-center mt-2 text-xs text-white/80">
            {currentAlertIndex + 1} / {alerts.length} 알람
          </div>
        )}
      </div>
      
      {/* 하단 그라데이션 효과 */}
      <div className="h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    </div>
  );
}