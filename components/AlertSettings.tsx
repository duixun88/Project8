import React, { useState } from 'react';
import { Exchange } from '../types/exchange';
import { AlertSettings as AlertSettingsType } from '../types/alert';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { AlertTriangle, Volume2, VolumeX, TestTube2 } from 'lucide-react';
import { alertSoundManager } from '../utils/alertSounds';

interface AlertSettingsProps {
  exchanges: Exchange[];
  alertSettings: AlertSettingsType[];
  onSettingsChange: (settings: AlertSettingsType[]) => void;
  soundEnabled: boolean;
  onSoundEnabledChange: (enabled: boolean) => void;
}

export function AlertSettings({ 
  exchanges, 
  alertSettings, 
  onSettingsChange, 
  soundEnabled, 
  onSoundEnabledChange 
}: AlertSettingsProps) {
  const [expandedExchange, setExpandedExchange] = useState<string | null>(null);

  const getSettingForExchange = (exchangeId: string): AlertSettingsType => {
    return alertSettings.find(s => s.exchangeId === exchangeId) || {
      exchangeId,
      openAlertEnabled: false,
      closeAlertEnabled: false,
      openAlertMinutes: 3,
      closeAlertMinutes: 3
    };
  };

  const updateSetting = (exchangeId: string, updates: Partial<AlertSettingsType>) => {
    const currentSettings = alertSettings.filter(s => s.exchangeId !== exchangeId);
    const newSetting = { ...getSettingForExchange(exchangeId), ...updates };
    onSettingsChange([...currentSettings, newSetting]);
  };

  const handleTestSound = async (event: 'open' | 'close') => {
    if (event === 'open') {
      await alertSoundManager.playOpenAlert();
    } else {
      await alertSoundManager.playCloseAlert();
    }
  };

  const enabledCount = alertSettings.filter(s => s.openAlertEnabled || s.closeAlertEnabled).length;
  const totalOpenAlerts = alertSettings.filter(s => s.openAlertEnabled).length;
  const totalCloseAlerts = alertSettings.filter(s => s.closeAlertEnabled).length;

  const regionLabels = {
    asia: '아시아',
    europe: '유럽',
    americas: '미주'
  };

  const asiaExchanges = exchanges.filter(ex => ex.region === 'asia');
  const europeExchanges = exchanges.filter(ex => ex.region === 'europe');
  const americasExchanges = exchanges.filter(ex => ex.region === 'americas');

  const renderExchangeSection = (regionExchanges: Exchange[], regionKey: keyof typeof regionLabels) => (
    <div key={regionKey} className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-sm">{regionLabels[regionKey]}</h4>
        <Badge variant="secondary" className="text-xs">
          {regionExchanges.filter(ex => {
            const setting = getSettingForExchange(ex.id);
            return setting.openAlertEnabled || setting.closeAlertEnabled;
          }).length}/{regionExchanges.length}
        </Badge>
      </div>
      
      <div className="space-y-2">
        {regionExchanges.map(exchange => {
          const setting = getSettingForExchange(exchange.id);
          const isExpanded = expandedExchange === exchange.id;
          const hasAnyAlert = setting.openAlertEnabled || setting.closeAlertEnabled;
          
          return (
            <Card key={exchange.id} className={`p-3 ${hasAnyAlert ? 'border-orange-200 dark:border-orange-800' : ''}`}>
              <div className="space-y-3">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedExchange(isExpanded ? null : exchange.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{exchange.nameKr}</span>
                      {hasAnyAlert && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{exchange.country}</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    {isExpanded ? '접기' : '설정'}
                  </Button>
                </div>
                
                {isExpanded && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      {/* 개장 알람 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">개장 알람</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleTestSound('open')}
                              disabled={!soundEnabled}
                            >
                              <TestTube2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <Switch
                            checked={setting.openAlertEnabled}
                            onCheckedChange={(checked) => 
                              updateSetting(exchange.id, { openAlertEnabled: checked })
                            }
                          />
                        </div>
                        
                        {setting.openAlertEnabled && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">알람 시간</span>
                              <span className="font-mono">{setting.openAlertMinutes}분 전</span>
                            </div>
                            <Slider
                              value={[setting.openAlertMinutes]}
                              onValueChange={(value) => 
                                updateSetting(exchange.id, { openAlertMinutes: value[0] })
                              }
                              max={30}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* 폐장 알람 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">폐장 알람</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleTestSound('close')}
                              disabled={!soundEnabled}
                            >
                              <TestTube2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <Switch
                            checked={setting.closeAlertEnabled}
                            onCheckedChange={(checked) => 
                              updateSetting(exchange.id, { closeAlertEnabled: checked })
                            }
                          />
                        </div>
                        
                        {setting.closeAlertEnabled && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">알람 시간</span>
                              <span className="font-mono">{setting.closeAlertMinutes}분 전</span>
                            </div>
                            <Slider
                              value={[setting.closeAlertMinutes]}
                              onValueChange={(value) => 
                                updateSetting(exchange.id, { closeAlertMinutes: value[0] })
                              }
                              max={30}
                              min={1}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className="p-4 h-fit">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">알람 설정</h3>
          <Badge variant="outline">
            {enabledCount}/{exchanges.length}
          </Badge>
        </div>
        
        {/* 전체 통계 */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
            <div className="font-medium text-blue-700 dark:text-blue-400">{totalOpenAlerts}</div>
            <div className="text-xs text-muted-foreground">개장 알람</div>
          </div>
          <div className="text-center p-2 bg-orange-50 dark:bg-orange-950 rounded">
            <div className="font-medium text-orange-700 dark:text-orange-400">{totalCloseAlerts}</div>
            <div className="text-xs text-muted-foreground">폐장 알람</div>
          </div>
        </div>
        
        {/* 사운드 설정 */}
        <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="text-sm font-medium">알람 사운드</span>
          </div>
          <Switch
            checked={soundEnabled}
            onCheckedChange={onSoundEnabledChange}
          />
        </div>
        
        <Separator />
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {renderExchangeSection(asiaExchanges, 'asia')}
          <Separator />
          {renderExchangeSection(europeExchanges, 'europe')}
          <Separator />
          {renderExchangeSection(americasExchanges, 'americas')}
        </div>
      </div>
    </Card>
  );
}