import React from 'react';
import { StatMetric } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  metric: StatMetric;
  icon: React.ReactNode;
}

export function StatCard({ metric, icon }: StatCardProps) {
  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'red': return 'bg-red-50 text-red-600 border-red-100';
      case 'green': return 'bg-green-50 text-green-600 border-green-100';
      case 'yellow': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{metric.label}</p>
        <div className="flex items-end gap-2 mt-0.5">
          <h3 className="text-xl font-bold text-slate-800">{metric.value}</h3>
          {metric.change && (
            <span className={`text-[10px] font-medium px-1 py-0.5 rounded flex items-center ${metric.change.startsWith('+') ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
              {metric.change.startsWith('+') ? <TrendingUp size={10} className="mr-0.5"/> : <TrendingDown size={10} className="mr-0.5"/>}
              {metric.change}
            </span>
          )}
        </div>
      </div>
      <div className={`p-2.5 rounded-xl ${getColorClass(metric.color)}`}>
        {icon}
      </div>
    </div>
  );
}