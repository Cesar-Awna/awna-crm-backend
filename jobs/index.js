import startLeadDormantJob from './leadDormant.job.js';
import startLeadStagnationJob from './leadStagnation.job.js';
import startRankingJob from './ranking.job.js';

export const startJobs = () => {
    console.log('⏱️ [jobs] Iniciando background jobs del CRM...');
    try {
        startLeadDormantJob();
    } catch (error) {
        console.error('❌ [jobs] Error al iniciar leadDormantJob:', error);
    }

    try {
        startLeadStagnationJob();
    } catch (error) {
        console.error('❌ [jobs] Error al iniciar leadStagnationJob:', error);
    }

    try {
        startRankingJob();
    } catch (error) {
        console.error('❌ [jobs] Error al iniciar rankingJob:', error);
    }
};

export default {
    startJobs,
};

