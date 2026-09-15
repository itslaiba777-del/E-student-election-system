export default function StatusBadge({ status }) {
  const getBadgeStyle = (statusVal) => {
    switch (statusVal?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'verified':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
      case 'upcoming':
      case 'draft':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'closed':
      case 'rejected':
      case 'locked':
      case 'failed':
      case 'suspended':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {status ? status.toUpperCase() : 'UNKNOWN'}
    </span>
  );
}
