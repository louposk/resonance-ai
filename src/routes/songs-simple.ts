import { Router, Request, Response } from 'express';
import { generalRateLimit } from '../middleware/rateLimiting';

const router = Router();

// Simulated song database for demo purposes
const mockSongs = [
  {
    id: '1',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    album: 'Thriller',
    releaseYear: 1983,
    spotifyId: 'mock-spotify-id-1',
    youtubeId: 'mock-youtube-id-1'
  },
  {
    id: '2',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    releaseYear: 1975,
    spotifyId: 'mock-spotify-id-2',
    youtubeId: 'mock-youtube-id-2'
  },
  {
    id: '3',
    title: 'Hotel California',
    artist: 'Eagles',
    album: 'Hotel California',
    releaseYear: 1976,
    spotifyId: 'mock-spotify-id-3',
    youtubeId: 'mock-youtube-id-3'
  },
  {
    id: '4',
    title: 'Imagine',
    artist: 'John Lennon',
    album: 'Imagine',
    releaseYear: 1971,
    spotifyId: 'mock-spotify-id-4',
    youtubeId: 'mock-youtube-id-4'
  }
];

const mockAnalyses = {
  '1': {
    meaning: "Billie Jean is about a woman who claims the narrator is the father of her child, though he denies it. The song explores themes of false accusations, media scrutiny, and the dark side of fame. Michael Jackson created a character study about paranoia and the challenges of celebrity life.",
    writingProcess: "Written and composed by Michael Jackson, the song was inspired by obsessive fans and groupies who would make false claims. Jackson spent considerable time perfecting the distinctive bass line and drum machine pattern. Quincy Jones initially had reservations about the song but it became one of the album's biggest hits.",
    trivia: "The song spent 7 weeks at #1 on the Billboard Hot 100. The iconic music video featured Jackson's first moonwalk on national television. The bass line was created using a Moog synthesizer. The song was almost left off the Thriller album. It has been covered by countless artists and is considered one of the greatest songs of all time.",
    themes: ["fame", "paranoia", "false accusations", "media pressure", "celebrity life", "relationships"]
  },
  '2': {
    meaning: "Bohemian Rhapsody tells the story of a young man who confesses to murder, faces trial, and ultimately accepts his fate. The operatic structure mirrors the emotional journey from confession through despair to acceptance. It's both a literal narrative and a metaphor for facing consequences of one's actions.",
    writingProcess: "Written entirely by Freddie Mercury, the song took years to develop. Mercury wrote it on piano, creating the complex multi-part structure. The band spent weeks in the studio layering vocals and creating the operatic middle section. It was revolutionary for its genre-blending approach.",
    trivia: "At 5 minutes 55 seconds, it was considered too long for radio play initially. The music video is often credited as one of the first true music videos. Over 180 vocal overdubs were used. It topped charts worldwide and experienced a resurgence after the movie 'Wayne's World' in 1992.",
    themes: ["guilt", "redemption", "life and death", "operatic drama", "artistic expression", "consequences"]
  },
  '3': {
    meaning: "Hotel California is an allegory about hedonism, excess, and the dark side of the American Dream. The hotel represents a luxurious prison where guests can check in but never truly leave. It critiques 1970s California culture and the music industry's excesses.",
    writingProcess: "Don Felder created the iconic guitar riff, while Don Henley and Glenn Frey wrote the lyrics. The song evolved over months, with the band crafting the mysterious narrative and complex guitar arrangements. The recording process was meticulous, with multiple guitar overdubs.",
    trivia: "The song won a Grammy Award for Record of the Year. The guitar solo features dueling guitars by Don Felder and Joe Walsh. Many theories exist about the song's meaning, from drug addiction to Satanism, though the band has clarified it's about excess and the music industry.",
    themes: ["excess", "American Dream", "imprisonment", "luxury", "temptation", "California culture"]
  },
  '4': {
    meaning: "Imagine is a plea for peace, unity, and human understanding. Lennon asks listeners to envision a world without divisions of religion, nationality, or possessions. It's both utopian idealism and a practical call for empathy and shared humanity.",
    writingProcess: "Written by John Lennon with input from Yoko Ono, the song was composed on piano. Lennon wanted to create the most commercial song possible with a radical message. The simple melody contrasts with the complex philosophical ideas in the lyrics.",
    trivia: "Rolling Stone named it the third greatest song of all time. It was recorded at Lennon's home studio. The song has been covered by hundreds of artists and is often performed at peace rallies and memorials. Central Park's Strawberry Fields memorial features the song's title.",
    themes: ["peace", "unity", "idealism", "spirituality", "humanism", "social change"]
  }
};

// Apply rate limiting
router.use(generalRateLimit);

// Search songs (no authentication required for demo)
router.get('/search', (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }

    // Simple search in mock data
    const searchResults = mockSongs.filter(song =>
      song.title.toLowerCase().includes(query.toLowerCase()) ||
      song.artist.toLowerCase().includes(query.toLowerCase()) ||
      song.album?.toLowerCase().includes(query.toLowerCase())
    );

    // If no results, return the first song as a demo
    const results = searchResults.length > 0 ? searchResults : [mockSongs[0]];

    res.json({
      success: true,
      query,
      results: results.map(song => ({
        ...song,
        hasAnalysis: mockAnalyses[song.id as keyof typeof mockAnalyses] ? true : false
      })),
      count: results.length,
      demo: true,
      message: 'Demo mode - showing sample results'
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Get song by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const song = mockSongs.find(s => s.id === id);

    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }

    res.json({
      success: true,
      song,
      hasAnalysis: mockAnalyses[id as keyof typeof mockAnalyses] ? true : false,
      demo: true
    });

  } catch (error) {
    console.error('Get song error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve song'
    });
  }
});

// Get song analysis
router.get('/:id/analysis', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const song = mockSongs.find(s => s.id === id);
    const analysis = mockAnalyses[id as keyof typeof mockAnalyses];

    if (!song) {
      return res.status(404).json({
        success: false,
        error: 'Song not found'
      });
    }

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not available for this song',
        song
      });
    }

    res.json({
      success: true,
      song,
      analysis,
      demo: true,
      message: 'Demo mode - showing sample AI analysis'
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analysis'
    });
  }
});

// Demo endpoint to list all available songs
router.get('/demo/available', (req: Request, res: Response) => {
  res.json({
    success: true,
    availableSongs: mockSongs.map(song => ({
      ...song,
      hasAnalysis: mockAnalyses[song.id as keyof typeof mockAnalyses] ? true : false,
      searchExample: `/api/songs/search?q=${encodeURIComponent(song.title)}`,
      analysisExample: `/api/songs/${song.id}/analysis`
    })),
    demo: true,
    message: 'These are the available demo songs with AI analysis'
  });
});

export default router;