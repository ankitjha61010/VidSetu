import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, Plus, Check, ArrowLeft, Calendar, Layers, Share2 } from 'lucide-react';
import { contentService } from '../services/content/ContentService';
import { watchSpaceService } from '../services/watchSpaceService';
import { useAuth } from '../context/AuthContext';
import { useWatchSpace } from '../context/WatchSpaceContext';
import { useToast } from '../context/ToastContext';
import { CastList } from '../components/media/CastList';
import { SeasonEpisodeSelector } from '../components/media/SeasonEpisodeSelector';
import { MediaRow } from '../components/media/MediaRow';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { QRModal } from '../components/common/QRModal';
import { Episode, TVSeries, SeriesDetails } from '../types';

export const SeriesDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const seriesId = Number(id);
  const { user } = useAuth();
  const { currentSpace } = useWatchSpace();
  const { showToast } = useToast();

  const navigate = useNavigate();
  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [related, setRelated] = useState<TVSeries[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/tv-shows');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const details = await contentService.getSeriesDetails(seriesId);
        if (cancelled) return;

        // Restriction check for Kids Space
        if (currentSpace?.isKids) {
          const strictKidGenres = [16, 10751, 10762];
          const isKidSafe = details.genres && details.genres.some((g) => strictKidGenres.includes(g.id));
          if (!isKidSafe) {
            setError('This title is restricted in Kids Space 🔒');
            setIsLoading(false);
            return;
          }
        }

        setSeries(details);
        setSelectedSeason(details.seasons[0]?.seasonNumber ?? 1);

        Promise.all(details.relatedIds.slice(0, 12).map((rid) => contentService.getSeriesDetails(rid).catch(() => null)))
          .then((res) => !cancelled && setRelated(res.filter(Boolean) as TVSeries[]));

        if (currentSpace) {
          const watchlist = await watchSpaceService.listWatchlist(currentSpace.id);
          if (!cancelled) setIsInWatchlist(watchlist.some((w) => w.tmdbId === seriesId && w.mediaType === 'tv'));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load series.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [seriesId, currentSpace]);

  useEffect(() => {
    if (!series) return;
    let cancelled = false;
    setIsLoadingEpisodes(true);
    contentService
      .getEpisodes(seriesId, selectedSeason)
      .then((res) => !cancelled && setEpisodes(res))
      .finally(() => !cancelled && setIsLoadingEpisodes(false));
    return () => {
      cancelled = true;
    };
  }, [series, seriesId, selectedSeason]);

  const toggleWatchlist = async () => {
    if (!currentSpace || !user) {
      showToast('No Watch Space', 'Create or select a Watch Space first.', 'warning');
      return;
    }
    try {
      if (isInWatchlist) {
        await watchSpaceService.removeFromWatchlist(currentSpace.id, seriesId, 'tv');
        setIsInWatchlist(false);
        showToast('Removed from Watchlist', series?.title, 'info');
      } else {
        await watchSpaceService.addToWatchlist(currentSpace.id, seriesId, 'tv', user.id);
        setIsInWatchlist(true);
        showToast('Added to Watchlist', series?.title, 'success');
      }
    } catch (err: any) {
      showToast('Action Failed', err.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingState message="Loading series details..." size="lg" />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="py-12">
        <ErrorState message={error || 'Series not found.'} />
      </div>
    );
  }

  const year = series.releaseDate ? new Date(series.releaseDate).getFullYear() : undefined;

  return (
    <div className="space-y-8">
      <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="relative rounded-3xl overflow-hidden border border-slate-800">
        {series.backdropUrl && (
          <img src={series.backdropUrl} alt={series.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/70 to-[#0a0e17]/30" />

        <div className="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-10">
          {series.posterUrl && (
            <img src={series.posterUrl} alt={series.title} className="w-40 sm:w-56 rounded-2xl shadow-2xl border border-slate-800 flex-shrink-0" />
          )}

          <div className="min-w-0 space-y-4">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{series.title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
              {year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {year}
                </span>
              )}
              {series.numberOfSeasons && (
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> {series.numberOfSeasons} Seasons
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                ★ {series.rating.toFixed(1)}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {series.genres.map((g) => (
                <span key={g.id} className="px-3 py-1 rounded-full text-xs bg-slate-800/80 text-slate-300 border border-slate-700">
                  {g.name}
                </span>
              ))}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{series.overview}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/watch/tv/${series.id}/${selectedSeason}/1`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                Play S{selectedSeason} E1
              </Link>
              <button
                onClick={toggleWatchlist}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
              >
                {isInWatchlist ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>
              <button
                onClick={() => setShowShare(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SeasonEpisodeSelector
        seriesId={series.id}
        seasons={series.seasons}
        selectedSeason={selectedSeason}
        onSelectSeason={setSelectedSeason}
        episodes={episodes}
        isLoadingEpisodes={isLoadingEpisodes}
      />

      <CastList cast={series.cast} />

      <MediaRow title="Related Shows" items={related} />

      <QRModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/tv/${series.id}`}
        title={series.title}
      />
    </div>
  );
};
