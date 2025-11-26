import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div
            className={`bg-gray-200 animate-pulse ${className}`}
            style={{
                animationDuration: '1.5s',
                animationTimingFunction: 'ease-in-out'
            }}
        />
    );
};

export const BeerCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white border-2 border-gray-100 p-5 flex flex-col h-full">
            <div className="flex items-start justify-between gap-4 flex-grow mb-4">
                <div className="flex gap-4 w-full">
                    <Skeleton className="w-14 h-14 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex gap-2 mt-2">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-50 flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
            </div>
        </div>
    );
};
