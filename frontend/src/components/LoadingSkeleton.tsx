import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-12 animate-pulse py-4">
      {/* Hero Banner Skeleton */}
      <div className="w-full h-[650px] bg-gray-200/80 rounded-[32px]" />

      {/* Category Pills Skeleton */}
      <div className="flex items-center gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 w-28 bg-gray-200/80 rounded-full" />
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-64 bg-gray-200/80 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-96 bg-gray-200/80 rounded-[20px] space-y-3 p-4 flex flex-col justify-between">
              <div className="h-56 bg-gray-300/80 rounded-xl w-full" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-300/80 rounded w-1/3" />
                <div className="h-5 bg-gray-300/80 rounded w-3/4" />
                <div className="h-4 bg-gray-300/80 rounded w-1/2" />
              </div>
              <div className="h-10 bg-gray-300/80 rounded-xl w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
