import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Plus, Check, ArrowLeft, Clock, Calendar, Share2, Languages } from 'lucide-react';
import { contentService } from '../services/content/ContentService';
import { watchSpaceService } from '../services/watchSpaceService';
import { useAuth } from '../context/AuthContext';
import { useWatchSpace } from '../context/WatchSpaceContext';
import { useToast } from '../context/ToastContext';
import { CastList } from '../components/media/CastList';
import { MediaRow } from '../components/media/MediaRow';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { QRModal } from '../components/common/QRModal';
import { Movie, MovieDetails } from '../types';
import { formatRuntime } from '../utils/formatters';

export const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);
  const { user } = useAuth();
  const { currentSpace } = useWatchSpace();
  const { showToast } = useToast();

  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [related, setRelated] = useState<Movie[]>([]);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/movies');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const details = await contentService.getMovieDetails(movieId);
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

        setMovie(details);

        Promise.all(details.relatedIds.slice(0, 12).map((rid) => contentService.getMovieDetails(rid).catch(() => null)))
          .then((res) => !cancelled && setRelated(res.filter(Boolean) as Movie[]));

        if (currentSpace) {
          const watchlist = await watchSpaceService.listWatchlist(currentSpace.id);
          if (!cancelled) setIsInWatchlist(watchlist.some((w) => w.tmdbId === movieId && w.mediaType === 'movie'));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load movie.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [movieId, currentSpace]);

  const toggleWatchlist = async () => {
    if (!currentSpace || !user) {
      showToast('No Watch Space', 'Create or select a Watch Space first.', 'warning');
      return;
    }
    try {
      if (isInWatchlist) {
        await watchSpaceService.removeFromWatchlist(currentSpace.id, movieId, 'movie');
        setIsInWatchlist(false);
        showToast('Removed from Watchlist', movie?.title, 'info');
      } else {
        await watchSpaceService.addToWatchlist(currentSpace.id, movieId, 'movie', user.id);
        setIsInWatchlist(true);
        showToast('Added to Watchlist', movie?.title, 'success');
      }
    } catch (err: any) {
      showToast('Action Failed', err.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24">
        <LoadingState message="Loading movie details..." size="lg" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="py-12">
        <ErrorState message={error || 'Movie not found.'} />
      </div>
    );
  }

  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : undefined;

  return (
    <div className="space-y-8">
      <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="relative rounded-3xl overflow-hidden border border-slate-800">
        {movie.backdropUrl && (
          <img src={movie.backdropUrl} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/70 to-[#0a0e17]/30" />

        <div className="relative flex flex-col sm:flex-row gap-6 p-6 sm:p-10">
          {movie.posterUrl && (
            <img src={movie.posterUrl} alt={movie.title} className="w-40 sm:w-56 rounded-2xl shadow-2xl border border-slate-800 flex-shrink-0" />
          )}

          <div className="min-w-0 space-y-4">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{movie.title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
              {year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {year}
                </span>
              )}
              {movie.runtimeMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {formatRuntime(movie.runtimeMinutes)}
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                ★ {movie.rating.toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Languages className="w-3.5 h-3.5 text-amber-400" /> Hindi / Multi-Audio & Subtitles
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <span key={g.id} className="px-3 py-1 rounded-full text-xs bg-slate-800/80 text-slate-300 border border-slate-700">
                  {g.name}
                </span>
              ))}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">{movie.overview}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={`/watch/movie/${movie.id}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                Play
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

      <CastList cast={movie.cast} />

      <MediaRow title="Related Movies" items={related} />

      <QRModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/movie/${movie.id}`}
        title={movie.title}
      />
    </div>
  );
};
