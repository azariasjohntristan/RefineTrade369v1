import React from 'react';
import { StatMetric } from '../types';

interface StatCardProps extends StatMetric {
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, delta, deltaType, delay = 0 }) => {
  return (
    <div 
      className="relative col-span-12 md:col-span-6 lg:col-span-3 bg-slate-800 p-6 border border-structural-border overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Decorative Corner Accent */}
      <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />
      
      <div className="text-[0.7rem] uppercase tracking-widest text-slate-500 mb-4 font-semibold">
        {label}
      </div>
      
      <div className="font-mono text-3xl font-medium text-slate-200">
        {value}
      </div>
      
      {delta && (
        <div className={`text-xs mt-2 font-medium ${
          deltaType === 'positive' ? 'text-accent-gain' : 
          deltaType === 'negative' ? 'text-accent-loss' : 'text-slate-500'
        }`}>
          {delta}
        </div>
      )}
    </div>
  );
};

export default StatCard;