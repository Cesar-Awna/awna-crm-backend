export const resolveLeadBusinessUnitScope = ({ req, role }) => {
    const userBusinessUnitIds = Array.isArray(req?.user?.businessUnitIds)
        ? req.user.businessUnitIds
        : [];
    const requestedBusinessUnitId = req?.businessUnitId || req?.query?.businessUnitId || null;

    if (requestedBusinessUnitId) {
        return {
            businessUnitId: requestedBusinessUnitId,
            businessUnitFilter: requestedBusinessUnitId,
            effectiveBusinessUnitIds: [requestedBusinessUnitId],
            hasExplicitScope: true,
        };
    }

    if (role === 'SUPERVISOR' && userBusinessUnitIds.length > 1) {
        return {
            businessUnitId: null,
            businessUnitFilter: { $in: userBusinessUnitIds },
            effectiveBusinessUnitIds: userBusinessUnitIds,
            hasExplicitScope: false,
        };
    }

    if ((role === 'SUPERVISOR' || role === 'EXECUTIVE') && userBusinessUnitIds.length === 1) {
        return {
            businessUnitId: userBusinessUnitIds[0],
            businessUnitFilter: userBusinessUnitIds[0],
            effectiveBusinessUnitIds: [userBusinessUnitIds[0]],
            hasExplicitScope: false,
        };
    }

    return {
        businessUnitId: null,
        businessUnitFilter: null,
        effectiveBusinessUnitIds: [],
        hasExplicitScope: false,
    };
};
