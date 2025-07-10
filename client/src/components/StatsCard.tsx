import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  gradient: string;
  progress?: number;
}

export function StatsCard({ title, value, subtitle, icon, gradient, progress }: StatsCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subtitle && (
              <p className="text-sm text-green-600 dark:text-green-400">{subtitle}</p>
            )}
            {progress !== undefined && (
              <Progress value={progress} className="mt-2" />
            )}
          </div>
          <div className={`w-12 h-12 ${gradient} rounded-lg flex items-center justify-center`}>
            <i className={`${icon} text-white`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { StatsCard };
export default StatsCard;