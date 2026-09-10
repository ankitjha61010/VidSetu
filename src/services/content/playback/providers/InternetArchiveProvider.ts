import { PlaybackSource } from '../../../../types';

// Internet Archive playback source, built to satisfy the same PlaybackSource
// contract as every other provider - but intentionally NOT wired into
// PlaybackResolver's default chain. IA hosts a mix of public-domain and
// rights-cleared items alongside material that is not freely redistributable,
// so blindly resolving "this TMDB movie -> some archive.org item" would risk
// serving unlicensed content. Use resolveByIdentifier() only for archive.org
// identifiers a human has manually verified are legally usable (e.g. public
// domain films), never as a generic "search archive.org for this title" source.
export class InternetArchiveProvider {
  async resolveByIdentifier(identifier: string): Promise<PlaybackSource | null> {
    const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
    if (!res.ok) return null;

    const data = await res.json();
    const files: any[] = data.files || [];
    const videoFile = files.find((f) => typeof f.name === 'string' && /\.(mp4|webm|m4v)$/i.test(f.name));
    if (!videoFile) return null;

    return {
      provider: 'INTERNET_ARCHIVE',
      type: 'video',
      url: `https://archive.org/download/${identifier}/${videoFile.name}`,
      contentId: identifier,
    };
  }
}

export const internetArchiveProvider = new InternetArchiveProvider();
