export const PLAN_LIMITS = {
    free: {
        triggers: 3,
        executionsPerMonth: 100,
        minIntervalMinutes: 15,
    },
    hobbyist: {
        triggers: 5,
        executionsPerMonth: 5000,
        minIntervalMinutes: 1,
    },
    pro: {
        triggers: 25,
        executionsPerMonth: 20000,
        minIntervalMinutes: 1,
    },
    business: {
        triggers: Infinity,
        executionsPerMonth: 100000,
        minIntervalMinutes: 1,
    },
};
