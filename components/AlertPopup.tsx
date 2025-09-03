import { useState, useEffect } from 'react';
import { AlertPopup as AlertPopupType } from '../types/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, X, Clock } from 'lucide-react';

interface AlertPopupProps {
  alerts: AlertPopupType[];
  onDismiss: (alertId: string) => void;
  onDismissAll: () => void;
}

export function AlertPopup({ alerts, onDismiss, onDismissAll }: AlertPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // 3초마다 다음 알람으로 이동
  useEffect(() => {
    if (alerts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [alerts.length]);

  // 알람이 변경되면 인덱스 리셋
  useEffect(() => {
    setCurrentIndex(0);
  }, [alerts]);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex];
  const eventText = currentAlert.event === 'open' ? '장이 시작됩니다' : '장이 마감됩니다';
  const IconComponent = currentAlert.event === 'open' ? TrendingUp : TrendingDown;
  const eventColor = currentAlert.event === 'open' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <Dialog open={true} onOpenChange={() => onDismissAll()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500 animate-pulse" />
            거래소 알람
          </DialogTitle>
          <DialogDescription>
            {alerts.length === 1 
              ? `${currentAlert.exchangeName}의 ${currentAlert.event === 'open' ? '개장' : '폐장'} 알람입니다.`
              : `${alerts.length}개의 거래소 알람이 있습니다. 자동으로 순환 표시됩니다.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 메인 알람 정보 */}
          <div className="text-center space-y-3 p-6 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-lg">
            <div className={`flex items-center justify-center gap-2 ${eventColor}`}>
              <IconComponent className="h-8 w-8" />
              <div>
                <div className="text-2xl font-bold">{currentAlert.minutes}분</div>
                <div className="text-sm">남음</div>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-bold">{currentAlert.exchangeName}</h3>
              <p className="text-muted-foreground">{eventText}</p>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{new Date(currentAlert.timestamp).toLocaleTimeString('ko-KR')}</span>
            </div>
          </div>
          
          {/* 여러 알람이 있을 때 */}
          {alerts.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">기타 알람</span>
                <Badge variant="secondary">{alerts.length - 1}개 더</Badge>
              </div>
              
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {alerts.filter((_, index) => index !== currentIndex).map((alert, index) => (
                  <div key={alert.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      {alert.event === 'open' ? 
                        <TrendingUp className="h-3 w-3 text-green-500" /> : 
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      }
                      <span>{alert.exchangeName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{alert.minutes}분</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">알람 닫기</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 페이지 인디케이터 */}
              <div className="flex justify-center gap-1">
                {alerts.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex 
                        ? 'bg-orange-500 scale-125' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* 액션 버튼 */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => onDismiss(currentAlert.id)}
            >
              이 알람 닫기
            </Button>
            <Button
              onClick={onDismissAll}
            >
              모든 알람 닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}