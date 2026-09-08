export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  src: string;
  duration: string;
  tag: string;
}

export const VCT_PLAYLIST: MusicTrack[] = [
  {
    id: "track-1",
    title: "Ignition // VCT Cyber Anthem",
    artist: "Esports Soundstage (Safe-to-Stream)",
    src: "/audio/vct_ignition.mp3",
    duration: "2:45",
    tag: "VCT ANTHEM",
  },
  {
    id: "track-2",
    title: "Ascent Chill // Scrim Session",
    artist: "Radianite Chill Beats (Safe-to-Stream)",
    src: "/audio/ascent_chill.ogg",
    duration: "3:12",
    tag: "LO-FI ESPORTS",
  },
  {
    id: "track-3",
    title: "Radianite Drift // Tactical Focus",
    artist: "Valorant Ambient Core (Safe-to-Stream)",
    src: "/audio/radianite_drift.ogg",
    duration: "1:48",
    tag: "AMBIENT CHILL",
  },
  {
    id: "track-4",
    title: "Tournament Clutches // Overtime",
    artist: "VCT Radio Stream (Safe-to-Stream)",
    src: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
    duration: "2:30",
    tag: "HIGH ENERGY",
  },
];
