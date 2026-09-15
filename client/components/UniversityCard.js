import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';

export default function UniversityCard({ university, onSelect }) {
  const logoSrc = university.logo_url
    ? `http://localhost:5000${university.logo_url}`
    : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between group">
      <div>
        <div className="flex items-center space-x-4 mb-4">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={university.university_name}
              className="w-12 h-12 object-contain rounded-md border border-slate-100 p-1"
            />
          ) : (
            <div className="w-12 h-12 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              {university.university_name}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Pattern: {university.registration_number_pattern || 'Standard'}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => onSelect && onSelect(university)}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
        >
          <span>Select Portal</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
