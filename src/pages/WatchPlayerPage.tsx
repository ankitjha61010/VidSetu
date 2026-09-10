import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { contentService } from '../services/content/ContentService';
import { playbackResolver } from '../services/content/playback/PlaybackResolver';
import { watchSpaceService } from '../services/watchSpaceService';
import { useAuth } from '../context/AuthContext';
import { useWatchSpace } from '../context/WatchSpaceContext';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { SeasonEpisodeSelector } from '../components/media/SeasonEpisodeSelector';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { Episode, MediaType, MovieDetails, PlaybackSource, SeriesDetails } from '../types';

interface WatchPlayerPageProps {
  mediaType: MediaType;
}

export const WatchPlayerPage: React.FC<WatchPlayerPageProps> = ({ mediaType }) => {
  const navigate = useNavigate();
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

  // TV Series episode list state
  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(seasonNumber ?? 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  const hasRecordedProgress = React.useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const watchKey = `${mediaType}-${tmdbId}-${seasonNumber ?? 1}-${episodeNumber ?? 1}`;

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
          setSeries(details);
          const s = seasonNumber ?? details.seasons[0]?.seasonNumber ?? 1;
          setSelectedSeason(s);
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

        if (currentSpace && user && hasRecordedProgress.current !== watchKey) {
          hasRecordedProgress.current = watchKey;
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

  useEffect(() => {
    if (mediaType !== 'tv' || !series) return;
    let cancelled = false;
    setIsLoadingEpisodes(true);
    contentService
      .getEpisodes(tmdbId, selectedSeason)
      .then((res) => !cancelled && setEpisodes(res))
      .finally(() => !cancelled && setIsLoadingEpisodes(false));
    return () => {
      cancelled = true;
    };
  }, [mediaType, tmdbId, series, selectedSeason]);

  const backHref = mediaType === 'movie' ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;

  const handleBackToDetails = () => {
    navigate(backHref, { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={handleBackToDetails}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Details
      </button>

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
        <div className="space-y-8">
          <VideoPlayer source={source} title={title} />

          {mediaType === 'tv' && series && (
            <div className="pt-6 border-t border-slate-800">
              <SeasonEpisodeSelector
                seriesId={tmdbId}
                seasons={series.seasons}
                selectedSeason={selectedSeason}
                onSelectSeason={setSelectedSeason}
                episodes={episodes}
                isLoadingEpisodes={isLoadingEpisodes}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
