export const PLAN_LIMITS = {
    free: {
        triggers: 5,
        executionsPerMonth: 100,
        minIntervalMinutes: 15,
    },
    hobbyist: {
        triggers: 20,
        executionsPerMonth: 5000,
        minIntervalMinutes: 1,
    },
    pro: {
        triggers: 50,
        executionsPerMonth: 20000,
        minIntervalMinutes: 1,
    },
    business: {
        triggers: Infinity,
        executionsPerMonth: 100000,
        minIntervalMinutes: 1,
    },
};
