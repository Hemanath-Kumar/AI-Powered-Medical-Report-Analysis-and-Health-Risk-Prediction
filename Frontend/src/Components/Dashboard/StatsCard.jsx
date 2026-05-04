import React from 'react';

const StatsCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    primary: 'bg-primary text-primary-dark bg-primary/5',
    accent: 'bg-accent text-accent-dark bg-accent/5',
    orange: 'bg-healthify-orange text-white bg-healthify-orange/5',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {trend && (
            <div
              className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
            >
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-lg ${color === 'primary' ? 'bg-primary/10 dark:bg-primary/30' : color === 'accent' ? 'bg-accent/10 dark:bg-accent/30' : 'bg-healthify-orange/10 dark:bg-healthify-orange/30'}`}
        >
          <Icon className={`h-6 w-6 ${color === 'primary' ? 'text-primary dark:text-primary-light' : color === 'accent' ? 'text-accent dark:text-accent-light' : 'text-healthify-orange'}`} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
