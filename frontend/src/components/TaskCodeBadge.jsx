'use client';

import Link from 'next/link';

export function TaskCodeBadge({ taskId, code }) {
  return (
    <Link href={`/tasks/${taskId}`} className="font-mono text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded px-2 py-1 hover:bg-violet-100">
      {code || `TSK${String(taskId).padStart(4, '0')}`}
    </Link>
  );
}
