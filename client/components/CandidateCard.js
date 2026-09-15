'use client';
import { Check } from 'lucide-react';

export default function CandidateCard({
  candidate,
  isSelected = false,
  onSelect = () => {},
}) {
  const {
    id,
    full_name,
    position_title,
    department_name,
    manifesto_summary,
    symbol_name,
    symbol_image_url,
    photo_url,
  } = candidate;

  return (
    <div
      onClick={() => onSelect(id)}
      className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
        isSelected
          ? 'border-[#00450d] bg-[#f4f4f0] shadow-md ring-2 ring-[#00450d]/20'
          : 'border-[#c0c9bb] bg-white hover:border-[#717a6d] hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between space-x-3">
        {/* Left: Radio Button Circle & Avatar */}
        <div className="flex items-center space-x-3">
          {/* Radio Indicator */}
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
              isSelected
                ? 'border-[#00450d] bg-[#00450d] text-white'
                : 'border-[#717a6d] bg-white'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>

          {/* Candidate Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden border border-[#c0c9bb] bg-[#e9e8e4] shrink-0">
            {photo_url ? (
              <img
                src={photo_url}
                alt={full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[#00450d] text-sm">
                {full_name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Right: Prominent Candidate Symbol Display */}
        <div className="flex flex-col items-center justify-center bg-white border border-[#c0c9bb] rounded-xl px-2.5 py-1.5 shrink-0 shadow-2xs">
          {symbol_image_url ? (
            <img
              src={symbol_image_url}
              alt={symbol_name || 'Symbol'}
              className="w-7 h-7 object-contain"
            />
          ) : (
            <div className="w-7 h-7 rounded bg-[#a0f399] text-[#005312] font-black text-xs flex items-center justify-center">
              ★
            </div>
          )}
          <span className="text-[9px] font-bold text-[#717a6d] uppercase tracking-wider mt-0.5">
            {symbol_name || 'Symbol'}
          </span>
        </div>
      </div>

      {/* Candidate Details */}
      <div className="mt-4 space-y-1">
        <h3 className="text-base font-extrabold text-[#1b1c1a]">{full_name}</h3>
        <p className="text-xs font-semibold text-[#00450d]">{position_title}</p>
        <p className="text-[11px] text-[#717a6d]">{department_name}</p>

        {manifesto_summary && (
          <p className="text-xs text-[#41493e] mt-2 line-clamp-2 leading-relaxed italic bg-white/60 p-2 rounded-lg border border-[#c0c9bb]/40">
            "{manifesto_summary}"
          </p>
        )}
      </div>

      {/* Selection Confirmation Label */}
      <div className="mt-4 pt-3 border-t border-[#c0c9bb]/40 flex items-center justify-between text-xs">
        <span
          className={`font-bold ${
            isSelected ? 'text-[#00450d]' : 'text-[#717a6d]'
          }`}
        >
          {isSelected ? 'Selected' : 'Click to select'}
        </span>
      </div>
    </div>
  );
}
