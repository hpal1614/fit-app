import React from 'react';
import Card, { CardHeader, CardContent } from './Card';
import type { Class } from '../../types/finalUI';

interface ClassEnrollmentProps {
    classes: Class[];
}

const ClassEnrollment: React.FC<ClassEnrollmentProps> = ({ classes }) => {
  const categoryColors: { [key: string]: string } = {
    'Flexibility': 'bg-purple-500/20 text-purple-300',
    'Cardio': 'bg-orange-500/20 text-orange-300',
    'Strength': 'bg-red-500/20 text-red-300',
  };

  const ActionButton: React.FC<{c: Class}> = ({ c }) => {
    if (c.enrolled) {
        return <button className="w-full sm:w-auto bg-lime-900/80 text-lime-300 font-bold py-2 px-4 rounded-lg text-sm cursor-default">Enrolled</button>
    }
    if (c.spotsLeft === 0) {
        return <button className="w-full sm:w-auto bg-red-900/80 text-red-400 font-bold py-2 px-4 rounded-lg text-sm" disabled>Full</button>
    }
    return <button className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-transform hover:scale-105">Join</button>
  }

  return (
    <Card>
      <CardHeader title="Upcoming Classes" />
      <CardContent>
        <ul className="space-y-4">
            {classes.map(c => (
            <li key={c.id} className="bg-white/5 p-4 rounded-xl flex flex-col sm:flex-row items-center sm:space-x-4 space-y-3 sm:space-y-0">
                <div className="text-center w-16 flex-shrink-0">
                    <p className="font-bold text-lg leading-tight">{c.time.split(' ')[0]}</p>
                    <p className="text-xs text-gray-400">{c.time.split(' ')[1]}</p>
                </div>
                <div className="w-full sm:flex-grow text-center sm:text-left">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-gray-400">w/ {c.instructor}</p>
                </div>
                <div className="w-full sm:w-auto flex-shrink-0">
                    <ActionButton c={c} />
                </div>
            </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ClassEnrollment;
