import React from 'react';
import { Exchange } from '../types/exchange';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface ExchangeSelectorProps {
  exchanges: Exchange[];
  selectedExchanges: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function ExchangeSelector({ exchanges, selectedExchanges, onSelectionChange }: ExchangeSelectorProps) {
  const asiaExchanges = exchanges.filter(ex => ex.region === 'asia');
  const europeExchanges = exchanges.filter(ex => ex.region === 'europe');
  const americasExchanges = exchanges.filter(ex => ex.region === 'americas');

  const regionLabels = {
    asia: '아시아',
    europe: '유럽', 
    americas: '미주'
  };

  const handleExchangeToggle = (exchangeId: string) => {
    const newSelection = selectedExchanges.includes(exchangeId)
      ? selectedExchanges.filter(id => id !== exchangeId)
      : [...selectedExchanges, exchangeId];
    onSelectionChange(newSelection);
  };

  const handleRegionToggle = (regionExchanges: Exchange[]) => {
    const regionIds = regionExchanges.map(ex => ex.id);
    const allSelected = regionIds.every(id => selectedExchanges.includes(id));
    
    if (allSelected) {
      // 해당 지역 모두 해제
      onSelectionChange(selectedExchanges.filter(id => !regionIds.includes(id)));
    } else {
      // 해당 지역 모두 선택
      const newSelection = [...new Set([...selectedExchanges, ...regionIds])];
      onSelectionChange(newSelection);
    }
  };

  const handleSelectAll = () => {
    if (selectedExchanges.length === exchanges.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(exchanges.map(ex => ex.id));
    }
  };

  const renderRegionSection = (regionExchanges: Exchange[], regionKey: keyof typeof regionLabels) => {
    const regionIds = regionExchanges.map(ex => ex.id);
    const selectedCount = regionIds.filter(id => selectedExchanges.includes(id)).length;
    const allSelected = selectedCount === regionIds.length;
    const partialSelected = selectedCount > 0 && selectedCount < regionIds.length;

    return (
      <div key={regionKey} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => handleRegionToggle(regionExchanges)}
              className={partialSelected ? 'data-[state=checked]:bg-orange-500' : ''}
            />
            <span className="font-medium text-sm">{regionLabels[regionKey]}</span>
            <Badge variant="secondary" className="text-xs">
              {selectedCount}/{regionIds.length}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2 ml-6">
          {regionExchanges.map(exchange => (
            <div key={exchange.id} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedExchanges.includes(exchange.id)}
                onCheckedChange={() => handleExchangeToggle(exchange.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{exchange.nameKr}</p>
                <p className="text-xs text-muted-foreground truncate">{exchange.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-4 h-fit">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">거래소 선택</h3>
          <Badge variant="outline">
            {selectedExchanges.length}/{exchanges.length}
          </Badge>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSelectAll}
          className="w-full"
        >
          {selectedExchanges.length === exchanges.length ? '전체 해제' : '전체 선택'}
        </Button>
        
        <Separator />
        
        <div className="space-y-4">
          {renderRegionSection(asiaExchanges, 'asia')}
          <Separator />
          {renderRegionSection(europeExchanges, 'europe')}
          <Separator />
          {renderRegionSection(americasExchanges, 'americas')}
        </div>
      </div>
    </Card>
  );
}