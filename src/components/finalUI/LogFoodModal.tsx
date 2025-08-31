import React, { useState } from 'react';

interface LogFoodModalProps {
  meal: string | null;
  onClose: () => void;
  onLog: (macros: { protein: number; carbs: number; fats: number }) => void;
}

const numberFromInput = (value: string): number => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const LogFoodModal: React.FC<LogFoodModalProps> = ({ meal, onClose, onLog }) => {
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fats, setFats] = useState('0');

  const addPreset = (p: number, c: number, f: number) => {
    setProtein(String(numberFromInput(protein) + p));
    setCarbs(String(numberFromInput(carbs) + c));
    setFats(String(numberFromInput(fats) + f));
  };

  const handleSave = () => {
    onLog({
      protein: numberFromInput(protein),
      carbs: numberFromInput(carbs),
      fats: numberFromInput(fats)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Log Food {meal ? `• ${meal}` : ''}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Protein (g)</label>
            <input
              inputMode="decimal"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Carbs (g)</label>
            <input
              inputMode="decimal"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Fats (g)</label>
            <input
              inputMode="decimal"
              value={fats}
              onChange={(e) => setFats(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => addPreset(25, 0, 0)} className="px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 text-sm">+25g Protein</button>
            <button onClick={() => addPreset(0, 30, 0)} className="px-3 py-2 rounded-lg bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-sm">+30g Carbs</button>
            <button onClick={() => addPreset(0, 0, 10)} className="px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-sm">+10g Fats</button>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
};

export default LogFoodModal;


