import React from 'react';
import { Genre, DiscoverFilters } from '../../types';

interface CategoryFilterBarProps {
  genres: Genre[];
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
}

const SORT_OPTIONS: { value: NonNullable<DiscoverFilters['sortBy']>; label: string }[] = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Top Rated' },
  { value: 'primary_release_date.desc', label: 'Newest' },
];

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'en', label: 'Hollywood (English)' },
  { value: 'hi', label: 'Bollywood (Hindi)' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'es', label: 'Spanish' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 15 }, (_, i) => currentYear - i);

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({ genres, filters, onChange }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <select
        value={filters.genreId ?? ''}
        onChange={(e) => onChange({ ...filters, genreId: e.target.value ? Number(e.target.value) : undefined })}
        className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60"
      >
        <option value="">All Genres</option>
        {genres.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      <select
        value={filters.year ?? ''}
        onChange={(e) => onChange({ ...filters, year: e.target.value ? Number(e.target.value) : undefined })}
        className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60"
      >
        <option value="">Any Year</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        value={filters.language ?? ''}
        onChange={(e) => onChange({ ...filters, language: e.target.value || undefined })}
        className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60"
      >
        <option value="">All Industries</option>
        {LANGUAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={filters.sortBy ?? 'popularity.desc'}
        onChange={(e) => onChange({ ...filters, sortBy: e.target.value as DiscoverFilters['sortBy'] })}
        className="px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500/60"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {(filters.genreId || filters.year || filters.language || (filters.sortBy && filters.sortBy !== 'popularity.desc')) && (
        <button
          onClick={() => onChange({ sortBy: 'popularity.desc' })}
          className="px-3 py-2 rounded-xl text-xs sm:text-sm text-indigo-300 hover:text-indigo-200 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};
