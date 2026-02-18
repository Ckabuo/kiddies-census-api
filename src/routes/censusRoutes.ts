import { Router } from 'express';
import {
  createCensus,
  getCensusByDate,
  getCensusDates,
  getCensusReport,
  getDashboardStats,
} from '../controllers/censusController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticate, getDashboardStats);
router.post('/', authenticate, createCensus);
router.get('/dates', authenticate, getCensusDates);
router.get('/date', authenticate, getCensusByDate);
router.get('/report', authenticate, getCensusReport);

export default router;
