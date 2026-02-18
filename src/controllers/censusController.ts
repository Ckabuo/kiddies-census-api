import { Response } from 'express';
import Census from '../models/Census';
import { AuthRequest } from '../middleware/auth';

export const createCensus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, service, serviceId, serviceName, serviceTime, ageBrackets, teachers, offering, tithe } = req.body;

    if (!date || !service || !ageBrackets || !teachers) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (!Array.isArray(ageBrackets) || ageBrackets.length === 0) {
      res.status(400).json({ message: 'At least one age bracket is required' });
      return;
    }

    if (!Array.isArray(teachers) || teachers.length === 0) {
      res.status(400).json({ message: 'At least one teacher is required' });
      return;
    }

    const census = new Census({
      date: new Date(date),
      service,
      serviceId,
      serviceName,
      serviceTime,
      ageBrackets,
      teachers,
      offering: offering || 0,
      tithe: tithe || 0,
      createdBy: req.user!._id,
    });

    await census.save();

    res.status(201).json(census);
  } catch (error) {
    console.error('Create census error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCensusByDate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date) {
      res.status(400).json({ message: 'Date is required' });
      return;
    }

    const startDate = new Date(date as string);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date as string);
    endDate.setHours(23, 59, 59, 999);

    const censuses = await Census.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ service: 1 });

    res.json(censuses);
  } catch (error) {
    console.error('Get census by date error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCensusDates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dates = await Census.distinct('date');
    const formattedDates = dates.map((date) => ({
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }));

    res.json(formattedDates.sort((a, b) => b.date.localeCompare(a.date)));
  } catch (error) {
    console.error('Get census dates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCensusReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ message: 'Start date and end date are required' });
      return;
    }

    const start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const censuses = await Census.find({
      date: { $gte: start, $lte: end },
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ date: 1, service: 1 });

    // Calculate statistics
    const totalKids = censuses.reduce((sum, census) => {
      return sum + census.ageBrackets.reduce((s, bracket) => s + bracket.count, 0);
    }, 0);

    const services = [...new Set(censuses.map((c) => c.service))];
    const dates = [...new Set(censuses.map((c) => c.date.toISOString().split('T')[0]))];

    const report = {
      startDate: startDate,
      endDate: endDate,
      totalKids,
      totalRecords: censuses.length,
      services,
      dates,
      data: censuses,
      summary: {
        byService: services.map((service) => {
          const serviceCensuses = censuses.filter((c) => c.service === service);
          const serviceTotal = serviceCensuses.reduce((sum, census) => {
            return sum + census.ageBrackets.reduce((s, bracket) => s + bracket.count, 0);
          }, 0);
          return { service, total: serviceTotal, count: serviceCensuses.length };
        }),
        byDate: dates.map((date) => {
          const dateCensuses = censuses.filter(
            (c) => c.date.toISOString().split('T')[0] === date
          );
          const dateTotal = dateCensuses.reduce((sum, census) => {
            return sum + census.ageBrackets.reduce((s, bracket) => s + bracket.count, 0);
          }, 0);
          return { date, total: dateTotal, count: dateCensuses.length };
        }),
      },
    };

    res.json(report);
  } catch (error) {
    console.error('Get census report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Today's census
    const todayCensuses = await Census.find({
      date: { $gte: today, $lte: endOfToday },
    });

    const todayTotal = todayCensuses.reduce((sum, census) => {
      return sum + census.ageBrackets.reduce((s, bracket) => s + bracket.count, 0);
    }, 0);

    // This week's census
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(endOfToday);

    const weekCensuses = await Census.find({
      date: { $gte: weekStart, $lte: weekEnd },
    });

    const weekTotal = weekCensuses.reduce((sum, census) => {
      return sum + census.ageBrackets.reduce((s, bracket) => s + bracket.count, 0);
    }, 0);

    // This month's census
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const monthCensuses = await Census.find({
      date: { $gte: monthStart, $lte: monthEnd },
    });

    const monthTotal = monthCensuses.reduce((sum, census) => {
      return sum + census.ageBrackets.reduce((s, bracket) => s + bracket.count, 0);
    }, 0);

    // Total census count
    const totalCensuses = await Census.countDocuments();

    res.json({
      today: {
        total: todayTotal,
        records: todayCensuses.length,
      },
      week: {
        total: weekTotal,
        records: weekCensuses.length,
      },
      month: {
        total: monthTotal,
        records: monthCensuses.length,
      },
      totalRecords: totalCensuses,
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
