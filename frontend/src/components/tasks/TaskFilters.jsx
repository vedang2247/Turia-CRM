'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClients, fetchTeamMembers } from '../../store/tasksSlice';
import { setFilters } from '../../store/tasksSlice';

const statuses = [
  ['all', 'All statuses'], ['open', 'Open'], ['in_progress', 'In progress'],
  ['waiting', 'Waiting'], ['resolved', 'Resolved'], ['closed', 'Closed'],
];

export function TaskFilters({ onCreate }) {
  const dispatch = useDispatch();
  const { filters, clients, teamMembers, total } = useSelector((state) => state.tasks);
  const [search, setSearch] = useState(filters.search);

  useEffect(() => {
    dispatch(fetchClients());
    dispatch(fetchTeamMembers());
  }, [dispatch]);

  useEffect(() => setSearch(filters.search), [filters.search]);

  function change(key, value) {
    dispatch(setFilters({ [key]: value }));
  }

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white p-4 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Tasks</h2>
          <p className="text-xs text-slate-500">{total} matching tasks</p>
        </div>
        <button type="button" onClick={onCreate} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700">New task</button>
      </div>
      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Search</span>
        <input value={search} onChange={(event) => { setSearch(event.target.value); change('search', event.target.value); }} placeholder="Title, client or code" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-500" />
      </label>
      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</span>
        <select value={filters.status} onChange={(event) => change('status', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="mb-4 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Assignee</span>
        <select value={filters.assigneeId} onChange={(event) => change('assigneeId', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="all">All team members</option>
          {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">Client</span>
        <select value={filters.clientId} onChange={(event) => change('clientId', event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <option value="all">All clients</option>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
        </select>
      </label>
    </aside>
  );
}
