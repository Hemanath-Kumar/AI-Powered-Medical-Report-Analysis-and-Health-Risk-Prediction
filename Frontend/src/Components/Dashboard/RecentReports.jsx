import React from 'react';
import { FileText, Calendar, TrendingUp } from 'lucide-react';

const RecentReports = () => {
  const mockReports = [
    {
      id: '1',
      name: 'Blood Test Results',
      type: 'blood_test',
      date: '2025-01-15',
      status: 'completed',
    },
    {
      id: '2',
      name: 'Mammogram Scan',
      type: 'mammogram',
      date: '2025-01-14',
      status: 'analyzing',
    },
    {
      id: '3',
      name: 'Lipid Panel',
      type: 'blood_test',
      date: '2025-01-13',
      status: 'completed',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'analyzing':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Reports</h3>
        <button className="text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary transition-colors text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {mockReports.map((report) => (
          <div
            key={report.id}
            className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="bg-primary/10 dark:bg-primary/30 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-primary dark:text-primary-light" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{report.name}</h4>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(report.date).toLocaleDateString()}
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    report.status
                  )}`}
                >
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </span>
              </div>
            </div>
            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400">
              <TrendingUp className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentReports;
