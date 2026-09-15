import StatusBadge from './StatusBadge';
import { User, Mail, GraduationCap, Calendar } from 'lucide-react';

export default function StudentCard({ student, onStatusChange }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{student.registration_number}</h4>
              <p className="text-xs text-slate-500 font-mono">CNIC: {student.cnic}</p>
            </div>
          </div>
          <StatusBadge status={student.status} />
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
          <p className="flex items-center space-x-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{student.email}</span>
          </p>
          <p className="flex items-center space-x-2">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {student.department_name} ({student.faculty_name})
            </span>
          </p>
          <p className="flex items-center space-x-2 text-[11px] text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Registered: {new Date(student.created_at).toLocaleDateString()}</span>
          </p>
        </div>
      </div>

      {onStatusChange && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
          {student.status !== 'active' && (
            <button
              onClick={() => onStatusChange(student.id, 'active')}
              className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1.5 rounded-md transition-colors"
            >
              Approve / Activate
            </button>
          )}
          {student.status !== 'locked' && (
            <button
              onClick={() => onStatusChange(student.id, 'locked')}
              className="flex-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-medium py-1.5 rounded-md border border-red-200 transition-colors"
            >
              Lock Access
            </button>
          )}
        </div>
      )}
    </div>
  );
}
