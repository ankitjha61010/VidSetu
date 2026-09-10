import React from 'react';
import { User } from 'lucide-react';
import { CastMember } from '../../types';

export const CastList: React.FC<{ cast: CastMember[] }> = ({ cast }) => {
  if (cast.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-white">Cast</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {cast.map((member) => (
          <div key={member.id} className="flex-shrink-0 w-24 text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
              {member.photoUrl ? (
                <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-600" />
              )}
            </div>
            <p className="text-xs font-semibold text-slate-200 mt-2 truncate" title={member.name}>
              {member.name}
            </p>
            {member.character && (
              <p className="text-[11px] text-slate-500 truncate" title={member.character}>
                {member.character}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
