const Employee = require('../models/Employee');

const generateEmployeeId = async () => {
  // Format: EMP-YYYYMM-XXXX where XXXX is a sequential number
  const now = new Date();
  const yearMonth = now.getFullYear().toString() + 
    (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Find the last employee ID for the current year/month
  const lastEmployee = await Employee.findOne({
    employeeId: new RegExp(`^EMP-${yearMonth}-`)
  }, {
    employeeId: 1
  }).sort({ employeeId: -1 });

  let sequence = 1;
  if (lastEmployee) {
    const lastSequence = parseInt(lastEmployee.employeeId.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `EMP-${yearMonth}-${sequence.toString().padStart(4, '0')}`;
};

module.exports = {
  generateEmployeeId
};
