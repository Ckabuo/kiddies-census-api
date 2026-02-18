import { Request, Response } from 'express';
import Settings from '../models/Settings';
import { AuthRequest } from '../middleware/auth';

const SETTINGS_KEYS = {
  SERVICES: 'services',
  MOTTO: 'motto',
  LOGO: 'logo',
};

export const getServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await Settings.findOne({ key: SETTINGS_KEYS.SERVICES });
    
    if (!settings) {
      // Return default services if none exist
      const defaultServices = [
        { id: '1', name: '1st Service', time: '7:00 AM' },
        { id: '2', name: '2nd Service', time: '9:00 AM' },
        { id: '3', name: '3rd Service', time: '11:00 AM' },
        { id: '4', name: 'Evening Service', time: '5:00 PM' },
      ];
      res.json(defaultServices);
      return;
    }

    res.json(settings.value);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { services } = req.body;

    if (!Array.isArray(services)) {
      res.status(400).json({ message: 'Services must be an array' });
      return;
    }

    // Validate service structure
    for (const service of services) {
      if (!service.id || !service.name || !service.time) {
        res.status(400).json({ message: 'Each service must have id, name, and time' });
        return;
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { key: SETTINGS_KEYS.SERVICES },
      {
        key: SETTINGS_KEYS.SERVICES,
        value: services,
        updatedBy: req.user!._id,
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Services updated successfully', services: settings.value });
  } catch (error) {
    console.error('Update services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMotto = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await Settings.findOne({ key: SETTINGS_KEYS.MOTTO });
    
    // Return default if not set
    const motto = settings ? settings.value : "Counting God's Army";
    res.json({ motto });
  } catch (error) {
    console.error('Get motto error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const settings = await Settings.findOne({ key });

    if (!settings) {
      res.status(404).json({ message: 'Setting not found' });
      return;
    }

    res.json({ key: settings.key, value: settings.value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMotto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { motto } = req.body;

    if (!motto || typeof motto !== 'string') {
      res.status(400).json({ message: 'Motto is required and must be a string' });
      return;
    }

    const settings = await Settings.findOneAndUpdate(
      { key: SETTINGS_KEYS.MOTTO },
      {
        key: SETTINGS_KEYS.MOTTO,
        value: motto.trim(),
        updatedBy: req.user!._id,
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Motto updated successfully', motto: settings.value });
  } catch (error) {
    console.error('Update motto error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getLogo = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await Settings.findOne({ key: SETTINGS_KEYS.LOGO });
    
    // Return null if not set (frontend will use default)
    const logo = settings ? settings.value : null;
    res.json({ logo });
  } catch (error) {
    console.error('Get logo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { logo } = req.body;

    // If logo is empty string or null, delete the setting
    if (!logo || logo === '') {
      await Settings.findOneAndDelete({ key: SETTINGS_KEYS.LOGO });
      res.json({ message: 'Logo removed successfully', logo: null });
      return;
    }

    if (typeof logo !== 'string') {
      res.status(400).json({ message: 'Logo must be a string (base64 data URL)' });
      return;
    }

    // Validate it's a data URL
    if (!logo.startsWith('data:image/')) {
      res.status(400).json({ message: 'Logo must be a valid image data URL' });
      return;
    }

    const settings = await Settings.findOneAndUpdate(
      { key: SETTINGS_KEYS.LOGO },
      {
        key: SETTINGS_KEYS.LOGO,
        value: logo,
        updatedBy: req.user!._id,
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Logo updated successfully', logo: settings.value });
  } catch (error) {
    console.error('Update logo error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      res.status(400).json({ message: 'Value is required' });
      return;
    }

    const settings = await Settings.findOneAndUpdate(
      { key },
      {
        key,
        value,
        updatedBy: req.user!._id,
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Setting updated successfully', key: settings.key, value: settings.value });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
