import { Router } from 'express';
import {
  getServices,
  updateServices,
  getMotto,
  updateMotto,
  getLogo,
  updateLogo,
  getSetting,
  updateSetting,
} from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// Service configuration routes (admin only)
router.get('/services', authenticate, getServices);
router.put('/services', authenticate, requireAdmin, updateServices);

// Motto routes (public get, admin update)
router.get('/motto', getMotto);
router.put('/motto', authenticate, requireAdmin, updateMotto);

// Logo routes (public get, admin update)
router.get('/logo', getLogo);
router.put('/logo', authenticate, requireAdmin, updateLogo);

// Generic settings routes (admin only)
router.get('/:key', authenticate, requireAdmin, getSetting);
router.put('/:key', authenticate, requireAdmin, updateSetting);

export default router;
