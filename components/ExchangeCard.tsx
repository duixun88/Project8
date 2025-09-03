import { useState } from 'react';
import { ExchangeStatus } from '../types/exchange';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { timeToPixels, getLocalTime, getCurrentKSTTime, getLocalTimePixels } from '../utils/timeUtils';
import { Clock, DollarSign, Calendar, ExternalLink, ArrowLeft } from 'lucide-react';

interface ExchangeCardProps {
  status: ExchangeStatus;
}

export function ExchangeCard({ status }: ExchangeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const { exchange, localTime, isOpen, isLunchBreak, timeToNextEvent } = status;
  
  const openPixels = timeToPixels(exchange.openTime);
  const closePixels = timeToPixels(exchange.closeTime);
  const duration = closePixels - openPixels;
  
  // 현재 현지시간을 픽셀로 변환
  const currentKSTTime = getCurrentKSTTime();
  const currentLocalTime = getLocalTime(exchange, currentKSTTime);
  const currentLocalTimePixels = getLocalTimePixels(currentLocalTime);
  const currentLocalTimePosition = (currentLocalTimePixels / 1000) * 100;
  
  const regionColors = {
    asia: 'bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-800',
    europe: 'bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-800',
    americas: 'bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800'
  };
  
  const regionLabels = {
    asia: '아시아',
    europe: '유럽',
    americas: '미주'
  };

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(exchange.specialInfo.website, '_blank');
  };

  const FrontCard = () => (
    <div className="w-full h-full">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium">{exchange.nameKr}</h3>
            <Badge variant="secondary" className="text-xs">
              {regionLabels[exchange.region]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{exchange.name}</p>
          <p className="text-xs text-muted-foreground">{exchange.country}</p>
        </div>
        <Badge 
          className={`font-medium ${
            isLunchBreak 
              ? 'bg-orange-500 text-white hover:bg-orange-600 border-orange-500 dark:bg-orange-600 dark:hover:bg-orange-700 animate-pulse' 
              : isOpen 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-700' 
                : 'bg-slate-500 text-white hover:bg-slate-600 border-slate-500 dark:bg-slate-600 dark:hover:bg-slate-700'
          }`}
        >
          {isLunchBreak ? "점심휴장" : isOpen ? "개장 중" : "폐장"}
        </Badge>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">현지시간:</span>
          <span className="font-mono">{localTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">거래시간:</span>
          <span className="font-mono">{exchange.openTime} - {exchange.closeTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">GMT:</span>
          <span className="font-mono">{exchange.gmtOffset >= 0 ? '+' : ''}{exchange.gmtOffset}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">다음 일정:</span>
          <span className="text-xs">{timeToNextEvent}</span>
        </div>
      </div>
      
      {/* 24시간 타임라인 */}
      <div className="mt-4">
        <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
          {/* 거래시간 막대 */}
          <div 
            className={`absolute h-full opacity-80 ${
              isLunchBreak 
                ? 'bg-orange-500 dark:bg-orange-600' 
                : isOpen 
                  ? 'bg-emerald-500 dark:bg-emerald-600' 
                  : 'bg-gray-400 dark:bg-gray-500'
            }`}
            style={{
              left: `${(openPixels / 1000) * 100}%`,
              width: `${(duration / 1000) * 100}%`
            }}
          />
          
          {/* 현지시간 표시 (빨간 막대) */}
          <div 
            className="absolute top-0 w-1 h-full bg-red-500 dark:bg-red-400 shadow-lg transition-all duration-500 z-10"
            style={{ 
              left: `${currentLocalTimePosition}%`, 
              transform: 'translateX(-50%)' 
            }}
          />
          
          {/* 현지시간 텍스트 */}
          <div 
            className="absolute -top-5 text-xs font-mono text-red-600 dark:text-red-400 font-medium whitespace-nowrap z-10"
            style={{ 
              left: `${currentLocalTimePosition}%`, 
              transform: 'translateX(-50%)' 
            }}
          >
            {currentLocalTime.toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            })}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center text-white dark:text-gray-200 text-xs font-medium">
            {exchange.openTime} - {exchange.closeTime}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-3 text-center">
        클릭하여 상세정보 보기
      </div>
    </div>
  );

  const BackCard = () => (
    <div className="w-full h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">{exchange.nameKr}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          상세정보
        </Badge>
      </div>
      
      <div className="space-y-4">
        {/* 거래특징 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">거래특징</span>
          </div>
          <div className="space-y-1">
            {exchange.specialInfo.features.map((feature, i) => (
              <div key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-1 h-1 bg-current rounded-full"></span>
                {feature}
              </div>
            ))}
          </div>
        </div>
        
        {/* 거래통화 */}
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium">거래통화:</span>
          <span className="text-sm text-muted-foreground">{exchange.specialInfo.tradingCurrency}</span>
        </div>
        
        {/* 결제주기 */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">결제주기:</span>
          <span className="text-sm text-muted-foreground">{exchange.specialInfo.settlementCycle}</span>
        </div>
        
        {/* 거래소사이트 */}
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">거래소사이트:</span>
          <button
            onClick={handleWebsiteClick}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            공식 웹사이트
          </button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground mt-6 text-center">
        클릭하여 기본정보 보기
      </div>
    </div>
  );

  return (
    <div 
      className="relative w-full h-80 [perspective:1000px] cursor-pointer"
      onClick={handleCardClick}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* 앞면 */}
        <Card className={`absolute inset-0 p-4 [backface-visibility:hidden] ${regionColors[exchange.region]}`}>
          <FrontCard />
        </Card>
        
        {/* 뒷면 */}
        <Card className={`absolute inset-0 p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] ${regionColors[exchange.region]}`}>
          <BackCard />
        </Card>
      </div>
    </div>
  );
}