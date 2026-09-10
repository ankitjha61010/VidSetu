import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { contentService } from '../services/content/ContentService';
import { playbackResolver } from '../services/content/playback/PlaybackResolver';
import { watchSpaceService } from '../services/watchSpaceService';
import { useAuth } from '../context/AuthContext';
import { useWatchSpace } from '../context/WatchSpaceContext';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { MediaType, MovieDetails, PlaybackSource, SeriesDetails } from '../types';

interface WatchPlayerPageProps {
  mediaType: MediaType;
}

export const WatchPlayerPage: React.FC<WatchPlayerPageProps> = ({ mediaType }) => {
  const { id, season, episode } = useParams<{ id: string; season?: string; episode?: string }>();
  const tmdbId = Number(id);
  const seasonNumber = season ? Number(season) : undefined;
  const episodeNumber = episode ? Number(episode) : undefined;

  const { user } = useAuth();
  const { currentSpace } = useWatchSpace();

  const [title, setTitle] = useState<string>('');
  const [source, setSource] = useState<PlaybackSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let resolvedSource: PlaybackSource | null = null;

        if (mediaType === 'movie') {
          const details: MovieDetails = await contentService.getMovieDetails(tmdbId);
          if (cancelled) return;
          setTitle(details.title);
          resolvedSource = await playbackResolver.resolveMovie(details);
        } else {
          const details: SeriesDetails = await contentService.getSeriesDetails(tmdbId);
          if (cancelled) return;
          const s = seasonNumber ?? details.seasons[0]?.seasonNumber ?? 1;
          const e = episodeNumber ?? 1;
          setTitle(`${details.title} - S${s}E${e}`);
          resolvedSource = await playbackResolver.resolveEpisode(details, {
            seasonNumber: s,
            episodeNumber: e,
            name: '',
            overview: '',
          });
        }

        if (cancelled) return;
        setSource(resolvedSource);

        if (currentSpace && user) {
          watchSpaceService
            .upsertWatchProgress({
              watchSpaceId: currentSpace.id,
              userId: user.id,
              tmdbId,
              mediaType,
              season: seasonNumber,
              episode: episodeNumber,
              progressSeconds: 0,
              durationSeconds: 0,
            })
            .catch((err) => console.error('Failed to record watch history:', err));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load playback.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [mediaType, tmdbId, seasonNumber, episodeNumber, currentSpace, user]);

  const backHref = mediaType === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <Link to={backHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Details
      </Link>

      {isLoading ? (
        <div className="py-24">
          <LoadingState message="Resolving playback source..." size="lg" />
        </div>
      ) : error ? (
        <ErrorState message={error} />
      ) : !source ? (
        <EmptyState
          title="Playback not available yet"
          description="No trailer or licensed source could be found for this title."
          actionHref={backHref}
          actionText="Back to Details"
        />
      ) : (
        <VideoPlayer source={source} title={title} />
      )}
    </div>
  );
};
