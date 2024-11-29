const Employee = require('../models/Employee');
const Shift = require('../models/Shift');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateEmployeeId } = require('../utils/idGenerator');

class EmployeeService {
  // Employee Management
  async createEmployee(employeeData, password) {
    const session = await Employee.startSession();
    session.startTransaction();

    try {
      // Create user account
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create([{
        email: employeeData.email,
        password: hashedPassword,
        role: employeeData.role
      }], { session });

      // Create employee profile
      const employee = await Employee.create([{
        ...employeeData,
        user: user[0]._id,
        employeeId: await generateEmployeeId()
      }], { session });

      await session.commitTransaction();
      return employee[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateEmployee(employeeId, updates) {
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    return employee;
  }

  async getEmployee(employeeId) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }
    return employee;
  }

  async getAllEmployees(filters = {}) {
    return Employee.find(filters).sort({ lastName: 1, firstName: 1 });
  }

  async deactivateEmployee(employeeId) {
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { status: 'INACTIVE' },
      { new: true }
    );
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    return employee;
  }

  // Shift Management
  async scheduleShift(shiftData) {
    const employee = await Employee.findById(shiftData.employee);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check for overlapping shifts
    const overlapping = await Shift.findOne({
      employee: shiftData.employee,
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
      $or: [
        {
          'schedule.start': {
            $lte: shiftData.schedule.end,
            $gte: shiftData.schedule.start
          }
        },
        {
          'schedule.end': {
            $lte: shiftData.schedule.end,
            $gte: shiftData.schedule.start
          }
        }
      ]
    });

    if (overlapping) {
      throw new Error('Shift overlaps with existing schedule');
    }

    return Shift.create(shiftData);
  }

  async updateShift(shiftId, updates) {
    const shift = await Shift.findByIdAndUpdate(
      shiftId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!shift) {
      throw new Error('Shift not found');
    }
    
    return shift;
  }

  async getEmployeeShifts(employeeId, startDate, endDate) {
    return Shift.find({
      employee: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });
  }

  async getCurrentShifts() {
    return Shift.findCurrentShifts();
  }

  async getUpcomingShifts(days = 7) {
    return Shift.findUpcomingShifts(days);
  }

  // Time Tracking
  async clockIn(shiftId) {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }
    
    await shift.clockIn();
    return shift;
  }

  async clockOut(shiftId) {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }
    
    await shift.clockOut();
    return shift;
  }

  async startBreak(shiftId, breakType) {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }
    
    await shift.startBreak(breakType);
    return shift;
  }

  async endBreak(shiftId) {
    const shift = await Shift.findById(shiftId);
    if (!shift) {
      throw new Error('Shift not found');
    }
    
    await shift.endBreak();
    return shift;
  }

  // Performance Metrics
  async updatePerformanceMetrics(employeeId, metrics) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    await employee.updatePerformanceMetrics(metrics);
    return employee;
  }

  async recordSale(employeeId, shiftId, amount) {
    const [employee, shift] = await Promise.all([
      Employee.findById(employeeId),
      Shift.findById(shiftId)
    ]);

    if (!employee || !shift) {
      throw new Error('Employee or shift not found');
    }

    await Promise.all([
      employee.recordSale(amount),
      shift.recordSale(amount)
    ]);

    return { employee, shift };
  }

  async addCustomerFeedback(employeeId, rating, comment) {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    await employee.addCustomerFeedback(rating, comment);
    return employee;
  }

  // Analytics
  async getEmployeePerformance(employeeId, startDate, endDate) {
    const shifts = await Shift.find({
      employee: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'COMPLETED'
    });

    const totalSales = shifts.reduce((sum, shift) => sum + shift.sales.total, 0);
    const totalTransactions = shifts.reduce((sum, shift) => sum + shift.sales.transactions, 0);
    const totalHours = shifts.reduce((sum, shift) => sum + shift.actualDuration, 0);

    return {
      totalSales,
      totalTransactions,
      totalHours,
      averageTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      salesPerHour: totalHours > 0 ? totalSales / totalHours : 0,
      transactionsPerHour: totalHours > 0 ? totalTransactions / totalHours : 0
    };
  }

  async getDepartmentPerformance(department, startDate, endDate) {
    const employees = await Employee.find({ department, status: 'ACTIVE' });
    const employeeIds = employees.map(emp => emp._id);

    const shifts = await Shift.find({
      employee: { $in: employeeIds },
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'COMPLETED'
    });

    const totalSales = shifts.reduce((sum, shift) => sum + shift.sales.total, 0);
    const totalTransactions = shifts.reduce((sum, shift) => sum + shift.sales.transactions, 0);
    const totalHours = shifts.reduce((sum, shift) => sum + shift.actualDuration, 0);

    return {
      department,
      employeeCount: employees.length,
      totalSales,
      totalTransactions,
      totalHours,
      averageTicket: totalTransactions > 0 ? totalSales / totalTransactions : 0,
      salesPerHour: totalHours > 0 ? totalSales / totalHours : 0,
      transactionsPerHour: totalHours > 0 ? totalTransactions / totalHours : 0,
      salesPerEmployee: employees.length > 0 ? totalSales / employees.length : 0
    };
  }
}

module.exports = new EmployeeService();
