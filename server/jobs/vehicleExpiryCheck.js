const cron = require('node-cron');
const Vehicle = require('../models/vehicleModel');
const Alert = require('../models/alertModel');

// Function to check vehicle expiry and create alerts
async function checkVehicleExpiry() {
  try {
    console.log('\n🚗 Running vehicle expiry check...');
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Find all active vehicles
    const vehicles = await Vehicle.find({}).populate('assignedDriver', 'name email');

    let warningCount = 0;
    let criticalCount = 0;
    let inactiveCount = 0;

    for (const vehicle of vehicles) {
      const insuranceExpiry = new Date(vehicle.insuranceExpiryDate);
      const pollutionExpiry = new Date(vehicle.pollutionExpiryDate);

      // Check insurance expiry
      if (insuranceExpiry <= now) {
        // CRITICAL: Insurance expired
        if (vehicle.status !== 'Inactive') {
          vehicle.status = 'Inactive';
          await vehicle.save();
          inactiveCount++;
          console.log(`   ❌ Vehicle ${vehicle.vehicleNumber} set to Inactive (insurance expired)`);
        }

        // Create critical alert if assigned driver exists
        if (vehicle.assignedDriver) {
          const existingAlert = await Alert.findOne({
            vehicleId: vehicle._id,
            userId: vehicle.assignedDriver._id,
            alertType: 'Insurance',
            severity: 'Critical',
            isRead: false
          });

          if (!existingAlert) {
            await Alert.create({
              userId: vehicle.assignedDriver._id,
              vehicleId: vehicle._id,
              alertType: 'Insurance',
              severity: 'Critical',
              message: `CRITICAL: Insurance for vehicle ${vehicle.vehicleNumber} has expired. Vehicle is now inactive.`,
              expiryDate: insuranceExpiry
            });
            criticalCount++;
            console.log(`   🚨 Critical alert created for ${vehicle.vehicleNumber} (insurance expired)`);
          }
        }
      } else if (insuranceExpiry <= sevenDaysFromNow) {
        // WARNING: Insurance expiring within 7 days
        if (vehicle.assignedDriver) {
          const existingAlert = await Alert.findOne({
            vehicleId: vehicle._id,
            userId: vehicle.assignedDriver._id,
            alertType: 'Insurance',
            severity: 'Warning',
            isRead: false,
            expiryDate: insuranceExpiry
          });

          if (!existingAlert) {
            const daysRemaining = Math.ceil((insuranceExpiry - now) / (1000 * 60 * 60 * 24));
            await Alert.create({
              userId: vehicle.assignedDriver._id,
              vehicleId: vehicle._id,
              alertType: 'Insurance',
              severity: 'Warning',
              message: `WARNING: Insurance for vehicle ${vehicle.vehicleNumber} expires in ${daysRemaining} day(s). Please renew soon.`,
              expiryDate: insuranceExpiry
            });
            warningCount++;
            console.log(`   ⚠️  Warning alert created for ${vehicle.vehicleNumber} (insurance expiring in ${daysRemaining} days)`);
          }
        }
      }

      // Check pollution expiry
      if (pollutionExpiry <= now) {
        // CRITICAL: Pollution certificate expired
        if (vehicle.status !== 'Inactive') {
          vehicle.status = 'Inactive';
          await vehicle.save();
          inactiveCount++;
          console.log(`   ❌ Vehicle ${vehicle.vehicleNumber} set to Inactive (pollution expired)`);
        }

        // Create critical alert if assigned driver exists
        if (vehicle.assignedDriver) {
          const existingAlert = await Alert.findOne({
            vehicleId: vehicle._id,
            userId: vehicle.assignedDriver._id,
            alertType: 'Pollution',
            severity: 'Critical',
            isRead: false
          });

          if (!existingAlert) {
            await Alert.create({
              userId: vehicle.assignedDriver._id,
              vehicleId: vehicle._id,
              alertType: 'Pollution',
              severity: 'Critical',
              message: `CRITICAL: Pollution certificate for vehicle ${vehicle.vehicleNumber} has expired. Vehicle is now inactive.`,
              expiryDate: pollutionExpiry
            });
            criticalCount++;
            console.log(`   🚨 Critical alert created for ${vehicle.vehicleNumber} (pollution expired)`);
          }
        }
      } else if (pollutionExpiry <= sevenDaysFromNow) {
        // WARNING: Pollution certificate expiring within 7 days
        if (vehicle.assignedDriver) {
          const existingAlert = await Alert.findOne({
            vehicleId: vehicle._id,
            userId: vehicle.assignedDriver._id,
            alertType: 'Pollution',
            severity: 'Warning',
            isRead: false,
            expiryDate: pollutionExpiry
          });

          if (!existingAlert) {
            const daysRemaining = Math.ceil((pollutionExpiry - now) / (1000 * 60 * 60 * 24));
            await Alert.create({
              userId: vehicle.assignedDriver._id,
              vehicleId: vehicle._id,
              alertType: 'Pollution',
              severity: 'Warning',
              message: `WARNING: Pollution certificate for vehicle ${vehicle.vehicleNumber} expires in ${daysRemaining} day(s). Please renew soon.`,
              expiryDate: pollutionExpiry
            });
            warningCount++;
            console.log(`   ⚠️  Warning alert created for ${vehicle.vehicleNumber} (pollution expiring in ${daysRemaining} days)`);
          }
        }
      }
    }

    console.log(`✅ Vehicle expiry check completed:`);
    console.log(`   - ${warningCount} warning alert(s) created`);
    console.log(`   - ${criticalCount} critical alert(s) created`);
    console.log(`   - ${inactiveCount} vehicle(s) set to inactive`);
  } catch (error) {
    console.error('❌ Error in vehicle expiry check:', error);
  }
}

// Schedule cron job to run daily at 6:00 AM
function startVehicleExpiryCheckJob() {
  // Run every day at 6:00 AM
  cron.schedule('0 6 * * *', () => {
    console.log('\n⏰ Scheduled vehicle expiry check triggered at', new Date().toLocaleString());
    checkVehicleExpiry();
  });

  console.log('✅ Vehicle expiry check cron job scheduled (daily at 6:00 AM)');

  // Run immediately on startup for testing
  console.log('🔄 Running initial vehicle expiry check...');
  checkVehicleExpiry();
}

module.exports = {
  startVehicleExpiryCheckJob,
  checkVehicleExpiry
};
