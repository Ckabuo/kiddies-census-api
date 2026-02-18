import { Request, Response } from 'express';
import User from '../models/User';
import Invite from '../models/Invite';
import { generateToken } from '../utils/jwt';
import { sendInviteEmail } from '../utils/email';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        image: user.image,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, firstName, lastName, phoneNumber, password, image } = req.body;

    if (!token || !firstName || !lastName || !phoneNumber || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const invite = await Invite.findOne({ token, isUsed: false });

    if (!invite) {
      res.status(400).json({ message: 'Invalid or expired invitation token' });
      return;
    }

    if (new Date() > invite.expiresAt) {
      res.status(400).json({ message: 'Invitation has expired' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: invite.email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    // Check if this is the first user (make them admin)
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = new User({
      email: invite.email,
      password,
      firstName,
      lastName,
      phoneNumber,
      image,
      role,
    });

    await user.save();

    // Mark invite as used
    invite.isUsed = true;
    await invite.save();

    const jwtToken = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        image: user.image,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendInvite = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      res.status(503).json({
        message: 'Email is not configured. Set EMAIL_USER and EMAIL_PASS on the server.',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    // Check for existing unused invite
    const existingInvite = await Invite.findOne({
      email: email.toLowerCase(),
      isUsed: false,
    });

    let invite;
    if (existingInvite && new Date() < existingInvite.expiresAt) {
      invite = existingInvite;
    } else {
      const token = uuidv4();
      invite = new Invite({
        email: email.toLowerCase(),
        token,
        invitedBy: req.user!._id,
      });
      await invite.save();
    }

    await sendInviteEmail(invite.email, invite.token);

    res.json({ message: 'Invitation sent successfully', inviteId: invite._id });
  } catch (error: any) {
    console.error('Send invite error:', error);
    const isEmailError = error?.code === 'EAUTH' || error?.responseCode || error?.command;
    if (isEmailError || error?.message?.toLowerCase?.().includes('mail')) {
      res.status(503).json({
        message: 'Failed to send invitation email. Check server email configuration (EMAIL_USER, EMAIL_PASS).',
      });
      return;
    }
    res.status(500).json({ message: 'Server error' });
  }
};

export const verifyInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ message: 'Token is required' });
      return;
    }

    const invite = await Invite.findOne({ token, isUsed: false });

    if (!invite) {
      res.status(400).json({ message: 'Invalid invitation token' });
      return;
    }

    if (new Date() > invite.expiresAt) {
      res.status(400).json({ message: 'Invitation has expired' });
      return;
    }

    res.json({ valid: true, email: invite.email });
  } catch (error) {
    console.error('Verify invite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({ isActive: true }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phoneNumber, image } = req.body;
    const user = await User.findById(req.user!._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (image) user.image = image;

    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      image: user.image,
      role: user.role,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
