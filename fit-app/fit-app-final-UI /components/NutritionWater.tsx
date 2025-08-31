import React, { useState, useMemo, useEffect, useRef } from 'react';
import { NutritionData } from '../types';
import Card, { CardHeader, CardContent } from './ui/Card';
import { GlassWaterIcon, BottleIcon, FlaskIcon, UndoIcon, PhoneForwardIcon, PlusCircleIcon } from './Icons';

const RealisticWaterDisplay: React.FC<{
  progress: number;
  tilt: { beta: number; gamma: number };
  motionEnabled: boolean;
  isJiggling: boolean;
  animationKey: number;
  onAnimationEnd: () => void;
}> = ({ progress, tilt, motionEnabled, isJiggling, animationKey, onAnimationEnd }) => {
    const size = 110;
    const waterLevel = size - (size * progress) / 100;
    
    const containerStyle: React.CSSProperties = {
        width: size,
        height: size,
        perspective: '500px',
    };

    const waterTransformStyle: React.CSSProperties = {
        transition: 'transform 0.1s ease-out',
        transform: motionEnabled
            ? `rotateX(${tilt.beta}deg) rotateY(${-tilt.gamma}deg)`
            : '',
    };
    
    // Pouring stream droplets
    const droplets = Array.from({ length: 3 }).map((_, i) => (
      <circle
        key={`droplet-${animationKey}-${i}`}
        cx={size / 2}
        cy={size * 0.25}
        r="4"
        fill="#38bdf8"
        style={{
          animation: `pour-droplet 0.5s cubic-bezier(0.4, 0, 1, 1) forwards`,
          animationDelay: `${i * 0.05}s`,
          opacity: 0,
        }}
      />
    ));

    // Splash particles
    const splashParticles = Array.from({ length: 10 }).map((_, i) => (
      <circle
        key={`splash-${animationKey}-${i}`}
        cx={size / 2 + (Math.random() - 0.5) * 20}
        cy={waterLevel + 5}
        r={Math.random() * 3 + 1}
        fill="#38bdf8"
        style={{
          animation: `splash-particle 0.6s ease-out forwards`,
          animationDelay: `${0.3 + Math.random() * 0.1}s`,
          opacity: 0,
        }}
      />
    ));

    // Bubbles generated on impact
    const bubbles = Array.from({length: 15}).map((_, i) => (
        <circle
            key={`bubble-${animationKey}-${i}`}
            cx={size / 2 + (Math.random() - 0.5) * 40}
            cy={waterLevel + 10 + Math.random() * 20}
            r={Math.random() * 2 + 1}
            fill="rgba(56, 189, 248, 0.5)"
            style={{
                animation: `bubble-rise 1.5s ease-out forwards`,
                animationDelay: `${0.4 + Math.random() * 0.5}s`,
                opacity: 0,
            }}
        />
    ));

    return (
        <div className="relative" style={containerStyle}>
            <svg width={size} height={size} className="rounded-full drop-shadow-xl overflow-visible">
                <defs>
                    <clipPath id="circle-clip">
                        <circle cx={size / 2} cy={size / 2} r={size / 2 - 4} />
                    </clipPath>
                    <radialGradient id="background-gradient">
                        <stop offset="60%" stopColor="rgba(15, 23, 42, 0.8)" />
                        <stop offset="100%" stopColor="rgba(30, 41, 59, 1)" />
                    </radialGradient>
                </defs>

                {/* Background */}
                <circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill="url(#background-gradient)" />
                
                {/* Main water body and animations */}
                <g clipPath="url(#circle-clip)" style={{ filter: 'url(#gooey)'}}>
                    <g style={waterTransformStyle}>
                        {/* Static waves */}
                        <g transform={`translate(0, ${waterLevel})`} style={{ transition: 'transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                           <g className={`animate-gentle-slosh ${isJiggling ? 'animate-jiggle' : ''}`} onAnimationEnd={onAnimationEnd}>
                                <path
                                    d={`M -${size*0.25} ${size*0.15} C ${size*0.15} -${size*0.1}, ${size*0.65} ${size*0.4}, ${size*1.25} ${size*0.15} S ${size*1.75} -${size*0.1}, ${size*2.25} ${size*0.15} V ${size} H -${size*0.25} Z`}
                                    fill="rgba(56, 189, 248, 0.8)"
                                    style={{ animation: 'wave 10s linear infinite' }}
                                />
                                <path
                                    d={`M -${size*0.25} ${size*0.1} C ${size*0.25} ${size*0.5}, ${size*0.75} -${size*0.25}, ${size*1.25} ${size*0.1} S ${size*1.85} ${size*0.35}, ${size*2.25} ${size*0.1} V ${size} H -${size*0.25} Z`}
                                    fill="rgba(56, 189, 248, 0.5)"
                                    style={{ animation: 'wave-reverse 12s linear infinite' }}
                                />
                           </g>
                        </g>

                        {/* Animated elements */}
                        {isJiggling && (
                            <>
                                {droplets}
                                {splashParticles}
                                {bubbles}
                            </>
                        )}
                    </g>
                </g>
                
                {/* Border */}
                <circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="4" />
            </svg>
        </div>
    );
};


const NutritionWater: React.FC<{ initialData: NutritionData['water'] }> = ({ initialData }) => {
    const [log, setLog] = useState<number[]>([initialData.current]);
    const [motionPermission, setMotionPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
    const [tilt, setTilt] = useState({ beta: 0, gamma: 0 });
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationKey, setAnimationKey] = useState(0);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customAmount, setCustomAmount] = useState('');

    const currentIntake = useMemo(() => log.reduce((sum, val) => sum + val, 0), [log]);
    const goal = initialData.goal;
    const progressPercentage = goal > 0 ? (currentIntake / goal) * 100 : 0;
    const isGoalReached = currentIntake >= goal;
    
    useEffect(() => {
        if (!('DeviceOrientationEvent' in window)) {
            setMotionPermission('unsupported');
            return;
        }
        const handleOrientation = (event: DeviceOrientationEvent) => {
            const { beta, gamma } = event;
            const maxTilt = 25;
            setTilt({
                beta: Math.max(-maxTilt, Math.min(maxTilt, beta || 0)),
                gamma: Math.max(-maxTilt, Math.min(maxTilt, gamma || 0)),
            });
        };
        if (motionPermission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
        } else {
            setTilt({ beta: 0, gamma: 0 });
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [motionPermission]);


    const handleRequestMotionPermission = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceOrientationEvent as any).requestPermission();
                setMotionPermission(permissionState === 'granted' ? 'granted' : 'denied');
            } catch (error) {
                console.error("Error requesting permission:", error);
                setMotionPermission('denied');
            }
        } else {
            setMotionPermission('granted'); // For browsers that don't require permission
        }
    };

    const handleAddWater = (amount: number) => {
        if (isAnimating || amount <= 0) return;
        setIsAnimating(true);
        setAnimationKey(prev => prev + 1); // Trigger re-render of animation elements
        setLog(prev => [...prev, amount]);
    };

    const handleAnimationEnd = () => {
        setIsAnimating(false);
    };
    
    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(customAmount, 10);
        if (!isNaN(amount) && amount > 0) {
            handleAddWater(amount);
            setCustomAmount('');
            setShowCustomInput(false);
        }
    };

    const handleUndo = () => {
        if (log.length > 1 && !isAnimating) {
            setLog(prev => prev.slice(0, -1));
        }
    };
    
    const ActionButton: React.FC<{icon: React.ReactNode, label: string, amount?: number, onClick: () => void}> = ({ icon, label, amount, onClick }) => (
        <button 
            onClick={onClick}
            disabled={isAnimating}
            className="flex flex-col items-center space-y-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            aria-label={`Add ${label}${amount ? ` (${amount}ml)` : ''}`}
        >
            <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <span className="text-[10px] font-semibold">{label}</span>
            {amount && <span className="text-[10px] text-gray-500">{amount}ml</span>}
        </button>
    );

    return (
        <Card className="relative overflow-hidden">
            <CardHeader title="Hydration">
                {motionPermission === 'prompt' && (
                    <button
                        onClick={handleRequestMotionPermission}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 px-2 py-1 rounded-md transition-colors"
                        aria-label="Enable motion controls for gravity effect"
                    >
                        <PhoneForwardIcon className="w-4 h-4" />
                        Enable Motion
                    </button>
                )}
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-3 gap-3">
                <div 
                    className="relative cursor-pointer rounded-full"
                    onClick={() => handleAddWater(250)}
                    role="button"
                    aria-label="Add a glass of water (250ml)"
                >
                    <RealisticWaterDisplay 
                        progress={Math.min(100, progressPercentage)} 
                        tilt={tilt}
                        motionEnabled={motionPermission === 'granted'}
                        isJiggling={isAnimating}
                        animationKey={animationKey}
                        onAnimationEnd={handleAnimationEnd}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className={`text-2xl font-bold ${isGoalReached ? 'text-lime-300' : 'text-white'} tracking-tight drop-shadow-md transition-colors`}>{currentIntake.toLocaleString()}</span>
                        <span className="text-xs text-gray-300 drop-shadow-md">/ {goal.toLocaleString()} ml</span>
                    </div>
                </div>
                
                <div className="w-full grid grid-cols-4 items-start justify-around">
                    <ActionButton icon={<GlassWaterIcon className="w-4 h-4" />} label="Glass" amount={250} onClick={() => handleAddWater(250)} />
                    <ActionButton icon={<BottleIcon className="w-4 h-4" />} label="Bottle" amount={500} onClick={() => handleAddWater(500)} />
                    <ActionButton icon={<FlaskIcon className="w-4 h-4" />} label="Flask" amount={750} onClick={() => handleAddWater(750)} />
                    <ActionButton icon={<PlusCircleIcon className="w-4 h-4" />} label="Custom" onClick={() => setShowCustomInput(!showCustomInput)} />
                </div>

                {showCustomInput && (
                    <form onSubmit={handleCustomSubmit} className="w-full flex gap-2 pt-2 animate-fade-in">
                        <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="e.g., 200"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                            autoFocus
                        />
                        <button type="submit" className="bg-lime-500 text-black font-bold px-4 rounded-lg text-sm hover:bg-lime-400 transition-colors disabled:opacity-50" disabled={isAnimating}>
                            Add
                        </button>
                    </form>
                )}

                <button
                    onClick={handleUndo}
                    disabled={log.length <= 1 || isAnimating}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                >
                    <UndoIcon className="w-4 h-4" />
                    Undo last
                </button>
            </CardContent>
        </Card>
    );
};

export default NutritionWater;