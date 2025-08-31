import React, { useState } from 'react';
import type { AnalyticsData } from '../../types/finalUI';
import { AchievementRarity } from '../../types/finalUI';
import Card, { CardHeader, CardContent } from './Card';
import { getAchievementIcon, CheckCircleIcon, XCircleIcon, BarbellIcon, RunningIcon, DumbbellIcon } from './Icons';

type ActiveTab = 'Goals' | 'Records' | 'Achievements';

const rarityStyles: { [key in AchievementRarity]: { text: string, bg: string, border: string, banner: string } } = {
    [AchievementRarity.Common]: { text: 'text-gray-200', bg: 'bg-gray-700/50', border: 'border-gray-600', banner: 'bg-gray-500' },
    [AchievementRarity.Rare]: { text: 'text-blue-300', bg: 'bg-blue-900/40', border: 'border-blue-700/50', banner: 'bg-blue-600' },
    [AchievementRarity.Epic]: { text: 'text-purple-300', bg: 'bg-purple-900/40', border: 'border-purple-700/50', banner: 'bg-purple-600' },
    [AchievementRarity.Legendary]: { text: 'text-yellow-300', bg: 'bg-yellow-900/40', border: 'border-yellow-700/50', banner: 'bg-yellow-500' },
};

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void; }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 rounded-md font-semibold text-xs sm:text-sm transition-colors duration-200 ${
            active
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
        {label}
    </button>
);

const getRecordIcon = (title: string) => {
    const lowerCaseTitle = title.toLowerCase();
    if (lowerCaseTitle.includes('run')) {
        return <RunningIcon className="w-6 h-6 text-cyan-400" />;
    }
    if (lowerCaseTitle.includes('bench')) {
        return <BarbellIcon className="w-6 h-6 text-red-400" />;
    }
    if (lowerCaseTitle.includes('squat')) {
        return <DumbbellIcon className="w-6 h-6 text-orange-400" />;
    }
    return <DumbbellIcon className="w-6 h-6 text-gray-400" />;
};

const AnalyticsDashboard: React.FC<{ data: AnalyticsData }> = ({ data }) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('Goals');

    const renderContent = () => {
        switch (activeTab) {
            case 'Goals':
                return (
                    <div className="space-y-3 animate-fade-in">
                        {data.weeklyGoals.map(goal => (
                            <div key={goal.title} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                                <span className="font-medium text-gray-200">{goal.title}</span>
                                {goal.completed ? (
                                    <span className="flex items-center gap-2 text-sm font-semibold text-lime-400">
                                        <CheckCircleIcon className="w-5 h-5" /> Complete
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-400">
                                        <XCircleIcon className="w-5 h-5" /> Incomplete
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                );
            case 'Records':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                        {data.personalRecords.map(pr => (
                            <div key={pr.title} className="flex items-center gap-4 bg-white/5 p-4 rounded-lg">
                                {getRecordIcon(pr.title)}
                                <div>
                                    <p className="text-sm text-gray-400">{pr.title}</p>
                                    <p className="font-bold text-lg text-white">{pr.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'Achievements':
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
                        {data.achievements.map(ach => (
                            <div key={ach.id} className={`relative rounded-xl border ${rarityStyles[ach.rarity].border} ${rarityStyles[ach.rarity].bg} p-3 text-center overflow-hidden flex flex-col items-center justify-between transition-opacity ${!ach.unlocked ? 'opacity-50' : ''}`}>
                                <div className={`absolute top-0 left-0 w-full h-1 ${rarityStyles[ach.rarity].banner}`}></div>
                                <div className="flex-grow flex flex-col items-center justify-center py-1">
                                    {getAchievementIcon(ach.icon, `w-7 h-7 ${rarityStyles[ach.rarity].text}`)}
                                    <p className={`text-xs font-semibold mt-2 ${rarityStyles[ach.rarity].text}`}>{ach.title}</p>
                                </div>
                                {!ach.unlocked && ach.progress && (
                                    <div className="w-full mt-2">
                                        <div className="w-full bg-black/30 rounded-full h-1.5">
                                            <div className={rarityStyles[ach.rarity].banner} style={{ width: `${(ach.progress.current / ach.progress.goal) * 100}%`, height: '100%', borderRadius: '9999px' }}></div>
                                        </div>
                                        <p className="text-[10px] font-mono mt-0.5 text-gray-400">{ach.progress.current}/{ach.progress.goal}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            default:
              return null;
        }
    };

    return (
        <Card>
            <CardHeader title="Progress Hub" />
            <CardContent>
                <div className="flex space-x-1 sm:space-x-2 border-b border-white/10 pb-3 mb-4">
                    <TabButton label="Weekly Goals" active={activeTab === 'Goals'} onClick={() => setActiveTab('Goals')} />
                    <TabButton label="Records" active={activeTab === 'Records'} onClick={() => setActiveTab('Records')} />
                    <TabButton label="Achievements" active={activeTab === 'Achievements'} onClick={() => setActiveTab('Achievements')} />
                </div>
                <div>
                    {renderContent()}
                </div>
            </CardContent>
        </Card>
    );
};

export default AnalyticsDashboard;
