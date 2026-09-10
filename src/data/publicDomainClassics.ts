// Hand-curated, manually verified list of films whose US copyright has genuinely
// lapsed (well-documented public domain cases - not a general "search archive.org"
// heuristic). Each entry was checked individually: TMDB id for real metadata, and an
// Internet Archive identifier confirmed to host an actual playable video file.
//
// Add to this list ONLY after manually verifying both the public-domain status of the
// title and that the archive.org item actually has a video file - never assume.
export interface PublicDomainClassic {
  tmdbId: number;
  archiveIdentifier: string;
}

export const PUBLIC_DOMAIN_CLASSICS: PublicDomainClassic[] = [
  { tmdbId: 653, archiveIdentifier: 'Nosferatu1922_201611' }, // Nosferatu (1922)
  { tmdbId: 234, archiveIdentifier: 'the.-cabinet.-of.-dr.-caligari.-1080p' }, // The Cabinet of Dr. Caligari (1920)
  { tmdbId: 3085, archiveIdentifier: 'his_girl_friday' }, // His Girl Friday (1940)
  { tmdbId: 10331, archiveIdentifier: 'NightOfTheLivingDead720p1968' }, // Night of the Living Dead (1968)
  { tmdbId: 4808, archiveIdentifier: 'charade-1963-cary-grant-audrey-hepburn-walter-matthau-1080p-reup' }, // Charade (1963)
  { tmdbId: 775, archiveIdentifier: 'a-trip-to-the-moon-1902-2025-12-24-13-05-0' }, // A Trip to the Moon (1902)
];

export function findArchiveIdentifier(tmdbId: number): string | null {
  return PUBLIC_DOMAIN_CLASSICS.find((c) => c.tmdbId === tmdbId)?.archiveIdentifier ?? null;
}
