import { Router } from 'express';
import {
  login,
  register,
  sendInvite,
  verifyInvite,
  getProfile,
  updateProfile,
  getAllUsers,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/verify-invite', verifyInvite);
router.post('/invite', authenticate, requireAdmin, sendInvite);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/users', authenticate, requireAdmin, getAllUsers);

export default router;
