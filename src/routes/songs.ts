import { Router } from 'express';
import { SongController } from '../controllers/SongController';
import { authenticateApiKey } from '../middleware/auth';
import { searchRateLimit, analysisRateLimit, apiKeyBasedRateLimit } from '../middleware/rateLimiting';

const router = Router();
const songController = new SongController();

// Apply API key authentication to all routes
router.use(authenticateApiKey);

// Search songs
router.get('/search', searchRateLimit, (req, res) => songController.searchSongs(req, res));

// Get song by ID
router.get('/:id', apiKeyBasedRateLimit, (req, res) => songController.getSong(req, res));

// Get song analysis
router.get('/:id/analysis', analysisRateLimit, (req, res) => songController.getSongAnalysis(req, res));

// Create new song
router.post('/', apiKeyBasedRateLimit, (req, res) => songController.createSong(req, res));

// Update song
router.put('/:id', apiKeyBasedRateLimit, (req, res) => songController.updateSong(req, res));

// Delete song
router.delete('/:id', apiKeyBasedRateLimit, (req, res) => songController.deleteSong(req, res));

export default router;