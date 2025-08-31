import React from 'react';
import Card, { CardHeader, CardContent } from './ui/Card';
import { GymStatus } from '../types';

interface GymCrowdMeterProps {
    status: GymStatus;
}

const ForecastChart: React.FC<{ data: GymStatus['hourlyForecast'] }> = ({ data }) => {
    const width = 320;
    const height = 60;
    const padding = { top: 10, bottom: 20, left: 0, right: 0 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxOccupancy = 100;

    const points = data.map((hour, index) => {
        const x = (index / (data.length - 1)) * chartWidth + padding.left;
        const y = chartHeight - (hour.occupancy / maxOccupancy) * chartHeight + padding.top;
        return { x, y, data: hour };
    });

    const pathD = "M" + points.map(p => `${p.x},${p.y}`).join(" L ");
    const areaPathD = pathD + ` L ${points[points.length-1].x},${height - padding.bottom} L ${points[0].x},${height - padding.bottom} Z`;
    
    const currentPoint = points.find(p => p.data.isCurrent);
    
    const timeLabels = ['12am', '6am', '12pm', '6pm', '11pm'];

    return (
        <div className="relative w-full">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-label="Hourly gym occupancy forecast graph">
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                
                {/* Area Fill */}
                <path d={areaPathD} fill="url(#areaGradient)" />

                {/* Line */}
                <path d={pathD} fill="none" stroke="var(--color-accent)" strokeWidth="2" />

                {/* Current Time Marker */}
                {currentPoint && (
                    <circle 
                        cx={currentPoint.x} 
                        cy={currentPoint.y} 
                        r="4" 
                        fill="var(--color-background-start)" 
                        stroke="var(--color-accent)" 
                        strokeWidth="2"
                    />
                )}
                
                {/* Time Labels */}
                {timeLabels.map((label, index) => {
                    let dataIndex;
                    if (label === '12am') dataIndex = 0;
                    else if (label === '6am') dataIndex = 6;
                    else if (label === '12pm') dataIndex = 12;
                    else if (label === '6pm') dataIndex = 18;
                    else dataIndex = 23;
                    
                    const x = (dataIndex / (data.length - 1)) * chartWidth + padding.left;
                    return (
                        <text key={label} x={x} y={height} fill="var(--color-text-tertiary)" fontSize="10" textAnchor="middle">
                            {label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};


const GymCrowdMeter: React.FC<GymCrowdMeterProps> = ({ status }) => {
    
    const getStatusInfo = (occupancy: number): { text: string; color: string } => {
        if (occupancy < 40) return { text: 'Quiet', color: 'text-green-400' };
        if (occupancy < 70) return { text: 'Moderate', color: 'text-yellow-400' };
        return { text: 'Busy', color: 'text-red-400' };
    };

    const currentStatusInfo = getStatusInfo(status.occupancy);

    return (
        <Card>
            <CardHeader title="Gym Crowd" />
            <CardContent className="flex flex-col justify-between h-full gap-2 p-3">
                
                {/* Main Status */}
                <div className="text-left">
                    <p className="text-3xl font-bold tracking-tight text-white">{status.occupancy}%</p>
                    <p className={`text-base font-semibold ${currentStatusInfo.color}`}>
                        Currently {currentStatusInfo.text}
                    </p>
                </div>

                {/* Forecast Chart */}
                <div className="flex-grow flex items-center justify-center">
                   <ForecastChart data={status.hourlyForecast} />
                </div>
                
                {/* Footer Info */}
                <div className="text-left border-t border-white/10 pt-2">
                    <p className="text-sm text-gray-400">Peak Times: <span className="font-semibold text-white">{status.peakTimes}</span></p>
                    <p className="text-xs text-gray-500 mt-1">Updated {status.lastUpdated}</p>
                </div>

            </CardContent>
        </Card>
    );
};

export default GymCrowdMeter;