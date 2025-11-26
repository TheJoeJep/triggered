import { Organization, Trigger, IntervalUnit } from "./types";

export function getIntervalInMinutes(amount: number, unit: IntervalUnit): number {
    switch (unit) {
        case 'seconds': return amount / 60;
        case 'minutes': return amount;
        case 'hours': return amount * 60;
        case 'days': return amount * 60 * 24;
        case 'weeks': return amount * 60 * 24 * 7;
        case 'months': return amount * 60 * 24 * 30; // Approx
        case 'years': return amount * 60 * 24 * 365; // Approx
        default: return 0;
    }
}

export function calculateMinNextRun(organization: Organization): string | null {
    let earliest: string | null = null;

    const checkTrigger = (trigger: Trigger) => {
        if (trigger.status === 'active' && trigger.nextRun) {
            if (!earliest || trigger.nextRun < earliest) {
                earliest = trigger.nextRun;
            }
        }
    };

    // Check top-level triggers
    if (organization.triggers) {
        organization.triggers.forEach(checkTrigger);
    }

    // Check folder triggers
    if (organization.folders) {
        organization.folders.forEach(folder => {
            if (folder.triggers) {
                folder.triggers.forEach(checkTrigger);
            }
        });
    }

    return earliest;
}
