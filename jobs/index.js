import startRankingJob from './ranking.job.js';
import startNotificationsJob from './notifications.job.js';

export const startJobs = () => {
    console.log('⏱️ [jobs] Iniciando background jobs del CRM...');

    try {
        startRankingJob();
    } catch (error) {
        console.error('❌ [jobs] Error al iniciar rankingJob:', error);
    }

    try {
        startNotificationsJob();
    } catch (error) {
        console.error('❌ [jobs] Error al iniciar notificationsJob:', error);
    }
};

export default {
    startJobs,
};
