import React from 'react';
import { Crown, Shield, User as UserIcon, UserPlus } from 'lucide-react';
import { WatchSpace, WatchSpaceMember } from '../../types';

const ROLE_ICON: Record<WatchSpaceMember['role'], React.ReactNode> = {
  OWNER: <Crown className="w-3.5 h-3.5 text-amber-400" />,
  ADMIN: <Shield className="w-3.5 h-3.5 text-indigo-400" />,
  MEMBER: <UserIcon className="w-3.5 h-3.5 text-slate-400" />,
};

interface MembersTableProps {
  space: WatchSpace;
  members: WatchSpaceMember[];
  onInvite?: () => void;
}

export const MembersTable: React.FC<MembersTableProps> = ({ space, members, onInvite }) => {
  const activeCount = members.filter((m) => m.status === 'ACTIVE').length;
  const atLimit = activeCount >= space.memberLimit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          {activeCount} / {space.memberLimit} members
        </p>
        <button
          onClick={onInvite}
          disabled={atLimit}
          title={atLimit ? `Member limit (${space.memberLimit}) reached for this plan` : 'Invite a member'}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold shadow-md transition-all disabled:cursor-not-allowed"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite Member
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/80 text-left text-xs text-slate-400">
              <th className="px-4 py-3 font-semibold">Member</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {members.map((m) => (
              <tr key={m.userId} className="text-slate-200">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {m.profile?.avatarUrl ? (
                      <img src={m.profile.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="truncate">{m.profile?.name || m.profile?.email || m.userId}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    {ROLE_ICON[m.role]}
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      m.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : m.status === 'INVITED'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{new Date(m.joinedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
