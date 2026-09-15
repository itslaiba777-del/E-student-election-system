'use client';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function Timer({ targetDate, onExpire, label = 'Voting Time Remaining' }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTime = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds, expired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.expired) {
    return (
      <div className="bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5">
        <Clock className="w-4 h-4" />
        <span>Voting Window Closed</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white px-4 py-2 rounded-xl border border-slate-800 inline-flex items-center space-x-3 shadow-sm">
      <div className="flex items-center space-x-1.5 text-blue-400 text-xs font-medium">
        <Clock className="w-4 h-4 animate-pulse" />
        <span>{label}:</span>
      </div>
      <div className="font-mono font-bold text-sm tracking-wider flex items-center space-x-1">
        <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-300">
          {String(timeLeft.hours).padStart(2, '0')}h
        </span>
        <span>:</span>
        <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-300">
          {String(timeLeft.minutes).padStart(2, '0')}m
        </span>
        <span>:</span>
        <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400">
          {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
}
