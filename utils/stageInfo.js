import BusinessUnit from '../models/BusinessUnit.js';

const FALLBACK_WON     = ['CERRADO_GANADO'];
const FALLBACK_LOST    = ['CERRADO_PERDIDO'];
const FALLBACK_INVALID = ['DATO_ERRADO'];

export const FALLBACK_CLOSED   = [...FALLBACK_WON, ...FALLBACK_LOST, ...FALLBACK_INVALID];
export const FALLBACK_STATUSES = [
    'NUEVO', 'DATO_ERRADO', 'CONTACTADO', 'INTERESADO',
    'COTIZACION_ENVIADA', 'EN_SEGUIMIENTO', 'CERRADO_GANADO', 'CERRADO_PERDIDO',
];

const FALLBACK_RESULT = {
    statusKeys:  FALLBACK_STATUSES,
    wonKeys:     FALLBACK_WON,
    lostKeys:    FALLBACK_LOST,
    invalidKeys: FALLBACK_INVALID,
    closedKeys:  FALLBACK_CLOSED,
};

/**
 * Returns stage classification for a specific BU.
 * Falls back to hardcoded legacy keys when the BU has no pipeline stages
 * or none with a non-open stageType configured.
 */
export const getStageInfo = async (businessUnitId) => {
    if (!businessUnitId) return FALLBACK_RESULT;

    const bu = await BusinessUnit.findById(businessUnitId).select('pipelineStages').lean();
    const stages = bu?.pipelineStages || [];

    if (stages.length === 0) return FALLBACK_RESULT;

    const statusKeys  = stages.map((s) => s.key);
    const wonKeys     = stages.filter((s) => s.stageType === 'won').map((s) => s.key);
    const lostKeys    = stages.filter((s) => s.stageType === 'lost').map((s) => s.key);
    const invalidKeys = stages.filter((s) => s.stageType === 'invalid').map((s) => s.key);
    const closedKeys  = [...wonKeys, ...lostKeys, ...invalidKeys];

    if (closedKeys.length === 0) {
        // Stages configured but no terminal types set — keep custom status keys, use hardcoded terminals
        return { statusKeys, wonKeys: FALLBACK_WON, lostKeys: FALLBACK_LOST, invalidKeys: FALLBACK_INVALID, closedKeys: FALLBACK_CLOSED };
    }

    return { statusKeys, wonKeys, lostKeys, invalidKeys, closedKeys };
};

/**
 * For background jobs that process all BUs at once.
 * Builds a union of all non-open status keys and a map for per-lead stageType lookup.
 */
export const buildBUStageTypeMaps = (businessUnits) => {
    const closedStatusSet = new Set(FALLBACK_CLOSED);
    const stageTypeMap    = new Map(); // 'companyId:buId:statusKey' → stageType

    for (const bu of businessUnits) {
        if (!bu.pipelineStages?.length) continue;
        const hasTerminal = bu.pipelineStages.some((s) => s.stageType && s.stageType !== 'open');
        if (!hasTerminal) continue;

        for (const stage of bu.pipelineStages) {
            const mapKey = `${bu.companyId}:${String(bu._id)}:${stage.key}`;
            stageTypeMap.set(mapKey, stage.stageType || 'open');
            if (stage.stageType !== 'open') closedStatusSet.add(stage.key);
        }
    }

    return { stageTypeMap, closedStatusSet };
};
