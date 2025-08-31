import React, { useState } from 'react';
import Card, { CardHeader, CardContent } from './ui/Card';
import { XIcon } from './Icons';

interface LogFoodModalProps {
  meal: string | null;
  onClose: () => void;
  onLog: (macros: { protein: number; carbs: number; fats: number; }) => void;
}

const LogFoodModal: React.FC<LogFoodModalProps> = ({ meal, onClose, onLog }) => {
    const [protein, setProtein] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fats, setFats] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLog({
            protein: Number(protein) || 0,
            carbs: Number(carbs) || 0,
            fats: Number(fats) || 0,
        });
        onClose();
    };

    const InputField: React.FC<{label: string, value: string, onChange: (val: string) => void}> = ({ label, value, onChange }) => (
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <input 
                type="number" 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="0"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
        </div>
    );

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="log-food-title"
        >
            <div 
                className="w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                <Card className="animate-fade-in-up">
                    <CardHeader title={`Log ${meal}`}>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <InputField label="Protein (g)" value={protein} onChange={setProtein} />
                            <InputField label="Carbs (g)" value={carbs} onChange={setCarbs} />
                            <InputField label="Fats (g)" value={fats} onChange={setFats} />

                            <button type="submit" className="w-full text-center bg-[var(--color-accent)] text-black font-bold py-3 px-4 rounded-lg text-sm transition-transform hover:scale-105">
                                Log Food
                            </button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LogFoodModal;