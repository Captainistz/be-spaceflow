const cron = require('node-cron')
const { completedReservations } = require('../controllers/reservations')

const runCompletedReservationsJob = async () => {
  try {
    console.log('  ⏰ Completing past reservations')
    const startTime = Date.now()
    await completedReservations()
    const elapsedTime = Date.now() - startTime
    console.log(`  ⏰ Done in ${elapsedTime}ms`)
  } catch (error) {
    console.error(
      `  ⏰ Error in completedReservations job:\n  ${error.message}`,
    )
  }
}

const initCronjobs = async () => {
  cron.schedule('0 * * * *', runCompletedReservationsJob)
  console.log('  ⏰ Initialized Cronjobs')
  await runCompletedReservationsJob()
}
module.exports = initCronjobs
