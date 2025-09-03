import React, { useState } from 'react';
import { ExchangeStatus } from '../types/exchange';
import { Button } from './ui/button';
import { Settings2, Clock } from 'lucide-react';
import { exchanges } from '../data/exchanges';
import { getRegionalDSTInfo, getCurrentGmtOffset, getDSTInfo } from '../utils/timeUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TimelineViewProps {
  exchangeStatuses: ExchangeStatus[];
  currentTime: Date;
}

export function TimelineView({ exchangeStatuses, currentTime }: TimelineViewProps) {
  // 설정 상태들 (1시간 눈금을 기본값으로 설정)
  const [showSeconds, setShowSeconds] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // 현재 시간을 KST 기준으로 0-24시간 범위의 퍼센트로 계산
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentSecond = currentTime.getSeconds();
  const currentTimePercent = ((currentHour + currentMinute / 60 + currentSecond / 3600) / 24) * 100;
  
  // 첫 번째 거래소 찾기 (시간 라벨 표시용)
  const firstExchangeId = exchangeStatuses.length > 0 ? exchangeStatuses[0].exchange.id : null;

  // 지역별로 거래소 그룹화하고 GMT 오프셋 내림차순으로 정렬
  const asiaExchanges = exchangeStatuses
    .filter(status => status.exchange.region === 'asia')
    .sort((a, b) => b.exchange.gmtOffset - a.exchange.gmtOffset);
  
  const europeExchanges = exchangeStatuses
    .filter(status => status.exchange.region === 'europe')
    .sort((a, b) => b.exchange.gmtOffset - a.exchange.gmtOffset);
  
  const americasExchanges = exchangeStatuses
    .filter(status => status.exchange.region === 'americas')
    .sort((a, b) => b.exchange.gmtOffset - a.exchange.gmtOffset);

  // KST 시간을 기준으로 거래소의 운영시간을 계산하는 함수 (DST 개선된 버전)
  const getKSTTradingHours = (status: ExchangeStatus) => {
    const { exchange } = status;
    
    // DST를 고려한 현재 GMT 오프셋 사용
    const currentGmtOffset = status.currentGmtOffset || exchange.gmtOffset;
    const kstOffset = 9; // KST는 GMT+9
    const timeDiff = kstOffset - currentGmtOffset;
    
    const [openHour, openMin] = exchange.openTime.split(':').map(Number);
    const [closeHour, closeMin] = exchange.closeTime.split(':').map(Number);
    
    // 분 단위로 계산하여 더 정확한 처리
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    const timeDiffMinutes = timeDiff * 60; // 시간 차이를 분으로 변환
    
    // KST 기준으로 변환
    let kstOpenMinutes = openMinutes + timeDiffMinutes;
    let kstCloseMinutes = closeMinutes + timeDiffMinutes;
    
    // 24시간 범위를 벗어나는 경우 조정
    const dayMinutes = 24 * 60;
    if (kstOpenMinutes < 0) kstOpenMinutes += dayMinutes;
    if (kstOpenMinutes >= dayMinutes) kstOpenMinutes -= dayMinutes;
    if (kstCloseMinutes < 0) kstCloseMinutes += dayMinutes;
    if (kstCloseMinutes >= dayMinutes) kstCloseMinutes -= dayMinutes;
    
    // 시간과 분으로 다시 변환
    const kstOpenHour = Math.floor(kstOpenMinutes / 60);
    const kstOpenMin = kstOpenMinutes % 60;
    const kstCloseHour = Math.floor(kstCloseMinutes / 60);
    const kstCloseMin = kstCloseMinutes % 60;
    
    const openPercent = (kstOpenMinutes / dayMinutes) * 100;
    const closePercent = (kstCloseMinutes / dayMinutes) * 100;
    
    let lunchBreakInfo = null;
    if (exchange.lunchBreak) {
      const [lunchStartHour, lunchStartMin] = exchange.lunchBreak.start.split(':').map(Number);
      const [lunchEndHour, lunchEndMin] = exchange.lunchBreak.end.split(':').map(Number);
      
      const lunchStartMinutes = lunchStartHour * 60 + lunchStartMin;
      const lunchEndMinutes = lunchEndHour * 60 + lunchEndMin;
      
      let kstLunchStartMinutes = lunchStartMinutes + timeDiffMinutes;
      let kstLunchEndMinutes = lunchEndMinutes + timeDiffMinutes;
      
      // 24시간 범위 조정
      if (kstLunchStartMinutes < 0) kstLunchStartMinutes += dayMinutes;
      if (kstLunchStartMinutes >= dayMinutes) kstLunchStartMinutes -= dayMinutes;
      if (kstLunchEndMinutes < 0) kstLunchEndMinutes += dayMinutes;
      if (kstLunchEndMinutes >= dayMinutes) kstLunchEndMinutes -= dayMinutes;
      
      const kstLunchStartHour = Math.floor(kstLunchStartMinutes / 60);
      const kstLunchStartMinute = kstLunchStartMinutes % 60;
      const kstLunchEndHour = Math.floor(kstLunchEndMinutes / 60);
      const kstLunchEndMinute = kstLunchEndMinutes % 60;
      
      lunchBreakInfo = {
        startPercent: (kstLunchStartMinutes / dayMinutes) * 100,
        endPercent: (kstLunchEndMinutes / dayMinutes) * 100,
        kstStartTime: `${String(kstLunchStartHour).padStart(2, '0')}:${String(kstLunchStartMinute).padStart(2, '0')}`,
        kstEndTime: `${String(kstLunchEndHour).padStart(2, '0')}:${String(kstLunchEndMinute).padStart(2, '0')}`
      };
    }
    
    return {
      openPercent,
      closePercent,
      lunchBreak: lunchBreakInfo,
      kstOpenTime: `${String(kstOpenHour).padStart(2, '0')}:${String(kstOpenMin).padStart(2, '0')}`,
      kstCloseTime: `${String(kstCloseHour).padStart(2, '0')}:${String(kstCloseMin).padStart(2, '0')}`,
      crossesMidnight: closePercent < openPercent
    };
  };

  // 지역별 그룹 렌더링 함수
  const renderExchangeGroup = (exchanges: ExchangeStatus[], title: string, colorClass: string) => {
    if (exchanges.length === 0) return null;

    return (
      <div className="mb-6">
        <h4 className={`text-sm font-medium mb-3 ${colorClass}`}>
          {title} ({exchanges.length}개)
        </h4>
        <div className="space-y-1">
          {exchanges.map((status) => {
            const { exchange } = status;
            const tradingHours = getKSTTradingHours(status);
            
            return (
              <div key={exchange.id} className="flex items-center py-2 hover:bg-accent/30 rounded-md transition-colors duration-150 border border-border/20">
                {/* 거래소 정보 */}
                <div className="w-44 pr-3 flex items-center">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        status.isLunchBreak 
                          ? 'bg-orange-400 animate-pulse' 
                          : status.isOpen 
                            ? 'bg-green-500' 
                            : 'bg-gray-400'
                      }`}
                      title={
                        status.isLunchBreak 
                          ? '점심휴장 중' 
                          : status.isOpen 
                            ? '개장 중' 
                            : '폐장'
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground">{exchange.id.toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground truncate flex items-center">
                        {exchange.nameKr}
                        {status.isLunchBreak && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 text-orange-500 cursor-help">🍽️</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>점심휴장 중</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {status.isDST && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 text-blue-500 cursor-help">☀️</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-medium">서머타임 적용 중</p>
                                {(() => {
                                  const currentYear = new Date().getFullYear();
                                  const dstInfo = getDSTInfo(exchange, currentYear);
                                  const regionName = exchange.region === 'europe' ? '유럽' : '미주';
                                  const dstPeriod = exchange.region === 'europe' 
                                    ? '3월 마지막 일요일 ~ 10월 마지막 일요일'
                                    : '3월 둘째 일요일 ~ 11월 첫째 일요일';
                                  
                                  return (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      <p>{regionName} 서머타임</p>
                                      <p>{dstPeriod}</p>
                                      {dstInfo && (
                                        <p>종료: {dstInfo.end.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</p>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {status.isDST === false && exchange.dst && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-1 text-gray-500 cursor-help">🌙</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-medium">비서머타임</p>
                                {(() => {
                                  const currentYear = new Date().getFullYear();
                                  const dstInfo = getDSTInfo(exchange, currentYear);
                                  const regionName = exchange.region === 'europe' ? '유럽' : '미주';
                                  const dstPeriod = exchange.region === 'europe' 
                                    ? '3월 마지막 일요일 ~ 10월 마지막 일요일'
                                    : '3월 둘째 일요일 ~ 11월 첫째 일요일';
                                  
                                  return (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      <p>{regionName} 서머타임</p>
                                      <p>{dstPeriod}</p>
                                      {dstInfo && (
                                        <p>시작: {dstInfo.start.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}</p>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 타임라인 막대 */}
                <div className="flex-1 relative h-6 bg-muted/30 border border-border/50 dark:bg-muted/50 dark:border-border/70">
                  {/* 1시간 간격 눈금 (기본값) */}
                  {Array.from({length: 23}, (_, i) => i + 1).map(hour => (
                    <div
                      key={`hourly-${hour}`}
                      className={`absolute w-px ${
                        hour % 6 === 0 
                          ? 'top-0 bottom-0 bg-border/80 dark:bg-border/90' 
                          : hour % 3 === 0 
                            ? 'top-0.5 bottom-0.5 bg-border/60 dark:bg-border/80' 
                            : 'top-1 bottom-1 bg-border/40 dark:bg-border/60'
                      }`}
                      style={{ left: `${(hour / 24) * 100}%` }}
                    />
                  ))}
                  
                  {/* 거래시간 막대 */}
                  {tradingHours.crossesMidnight ? (
                    <>
                      {/* 자정을 넘는 경우: 두 개의 막대로 분할 */}
                      <div
                        className="absolute top-1 bottom-1 bg-green-500 dark:bg-green-400"
                        style={{
                          left: '0%',
                          width: `${tradingHours.closePercent}%`
                        }}
                      />
                      <div
                        className="absolute top-1 bottom-1 bg-green-500 dark:bg-green-400"
                        style={{
                          left: `${tradingHours.openPercent}%`,
                          width: `${100 - tradingHours.openPercent}%`
                        }}
                      />
                    </>
                  ) : (
                    <div
                      className="absolute top-1 bottom-1 bg-green-500 dark:bg-green-400"
                      style={{
                        left: `${tradingHours.openPercent}%`,
                        width: `${tradingHours.closePercent - tradingHours.openPercent}%`
                      }}
                    />
                  )}
                  
                  {/* 점심시간 휴장 (있는 경우) - 거래시간 위에 오버레이 */}
                  {tradingHours.lunchBreak && (
                    <div
                      className="absolute top-1 bottom-1 bg-orange-400/80 border-l border-r border-orange-500/60 dark:bg-orange-400/70 dark:border-orange-400/80"
                      style={{
                        left: `${tradingHours.lunchBreak.startPercent}%`,
                        width: `${tradingHours.lunchBreak.endPercent - tradingHours.lunchBreak.startPercent}%`
                      }}
                      title={`점심휴장: ${tradingHours.lunchBreak.kstStartTime}-${tradingHours.lunchBreak.kstEndTime} (KST)`}
                    />
                  )}
                  
                  {/* 현재 시간 표시선 - 각 막대마다 표시 */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 dark:bg-red-400 z-10 animate-pulse"
                    style={{
                      left: `${currentTimePercent}%`
                    }}
                    title={`현재 시간: ${currentHour}:${String(currentMinute).padStart(2, '0')}:${String(currentSecond).padStart(2, '0')} (${currentTimePercent.toFixed(2)}%)`}
                  />
                  
                  {/* 현재 시간 라벨 - 전체에서 첫 번째 거래소에만 표시 */}
                  {status.exchange.id === firstExchangeId && (
                    <div
                      className="absolute -top-7 text-xs font-medium text-red-600 dark:text-red-400 bg-background border border-red-200 dark:border-red-800 rounded px-2 py-1 whitespace-nowrap z-20 animate-pulse hover:animate-none hover:shadow-md hover:scale-110 transition-all duration-200 cursor-pointer"
                      style={{
                        left: `${currentTimePercent}%`,
                        transform: 'translateX(-50%)'
                      }}
                      title={`현재 시간: ${currentHour}:${String(currentMinute).padStart(2, '0')}:${String(currentSecond).padStart(2, '0')} KST`}
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-red-500 rounded-full animate-ping"></div>
                        {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}
                        {showSeconds && (
                          <span className="opacity-75">:{String(currentSecond).padStart(2, '0')}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 시간 정보 컬럼들 - 개선된 정렬 및 테두리 */}
                <div className="flex items-center gap-3 ml-3 border-l border-border/30 pl-3">
                  {/* KST 시간 */}
                  <div className="w-28 text-xs font-mono text-foreground font-medium text-center flex items-center justify-center h-6 bg-primary/5 border border-border/30 rounded px-2">
                    {tradingHours.kstOpenTime}-{tradingHours.kstCloseTime}
                  </div>
                  
                  {/* 현지시간 */}
                  <div className="w-24 text-xs font-mono text-muted-foreground text-center flex items-center justify-center h-6 bg-muted/20 border border-border/30 rounded px-2">
                    {exchange.openTime}-{exchange.closeTime}
                  </div>
                  
                  {/* GMT 오프셋 (DST 고려) */}
                  <div className="w-16 text-xs font-mono text-muted-foreground text-center flex items-center justify-center h-6 bg-muted/20 border border-border/30 rounded px-2">
                    {status.isDST !== undefined ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`cursor-help ${status.isDST ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                            GMT{(status.currentGmtOffset || exchange.gmtOffset) >= 0 ? '+' : ''}{status.currentGmtOffset || exchange.gmtOffset}
                            {status.isDST && <span className="text-xs">*</span>}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-sm">
                            {status.isDST ? (
                              <>
                                <p className="font-medium">서머타임 적용됨</p>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  <p>기본 GMT{exchange.gmtOffset >= 0 ? '+' : ''}{exchange.gmtOffset} → GMT{(status.currentGmtOffset || exchange.gmtOffset) >= 0 ? '+' : ''}{status.currentGmtOffset || exchange.gmtOffset}</p>
                                  <p>한국시간 기준 +1시간 앞당겨짐</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="font-medium">표준시간 적용</p>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  <p>GMT{exchange.gmtOffset >= 0 ? '+' : ''}{exchange.gmtOffset} (기본값)</p>
                                  <p>서머타임 미적용</p>
                                </div>
                              </>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      `GMT${exchange.gmtOffset >= 0 ? '+' : ''}${exchange.gmtOffset}`
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">거래소 운영시간 타임라인 (KST 기준) - 1시간 눈금</h3>
        
        {/* 타임라인 설정 버튼 */}
        <div className="flex items-center gap-2">
          {showSettings && (
            <div className="flex items-center gap-3 mr-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showSeconds}
                  onChange={(e) => setShowSeconds(e.target.checked)}
                  className="rounded"
                />
                초 표시
              </label>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 범례 - 상단으로 이동 */}
      <div className="mb-6 pb-4 border-b border-border flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 dark:bg-green-400" />
          <span>거래시간</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-400/80 border border-orange-500/60 dark:bg-orange-400/70" />
          <span>점심휴장</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500 dark:bg-red-400 animate-pulse" />
          <span>현재 시간 ({currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} KST)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          <span>개장 중</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
          <span>점심휴장</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
          <span>폐장</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-500">☀️</span>
          <span>서머타임</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">🌙</span>
          <span>비서머타임</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400 font-mono">GMT+1*</span>
          <span>서머타임 적용됨</span>
        </div>
      </div>
      
      {/* 시간 헤더 */}
      <div className="mb-6">
        <div className="flex items-center text-xs">
          {/* 거래소명 컬럼 */}
          <div className="w-44 flex items-center font-medium text-muted-foreground">
            한국 시간
          </div>
          
          {/* 타임라인 컬럼 - 시간 눈금 */}
          <div className="flex-1 relative">
            <div className="flex">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="flex-1 text-center font-mono text-muted-foreground border-l border-border/30 first:border-l-0 text-xs py-1">
                  {i}
                </div>
              ))}
            </div>
          </div>
          
          {/* 시간정보 컬럼들 헤더 */}
          <div className="flex items-center gap-3 ml-3 border-l border-border/30 pl-3">
            <div className="w-28 flex items-center justify-center text-xs font-medium text-muted-foreground">
              KST 시간
            </div>
            <div className="w-24 flex items-center justify-center text-xs font-medium text-muted-foreground">
              현지시간
            </div>
            <div className="w-16 flex items-center justify-center text-xs font-medium text-muted-foreground">
              GMT
            </div>
          </div>
        </div>
      </div>

      {/* 거래소 그룹들 */}
      <div>
        {renderExchangeGroup(asiaExchanges, '아시아 증시', 'text-blue-700 dark:text-blue-400')}
        {renderExchangeGroup(europeExchanges, '유럽 증시', 'text-green-700 dark:text-green-400')}
        {renderExchangeGroup(americasExchanges, '미주 증시', 'text-orange-700 dark:text-orange-400')}
      </div>

    </div>
    </TooltipProvider>
  );
}