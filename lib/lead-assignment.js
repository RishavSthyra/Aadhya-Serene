import { connectMongo } from './mongodb.js';
import { AdminUser, LeadAssignmentState } from './models.js';

export const SALES_EXECUTIVE_ROLE = 'sales_executive';
export const LEAD_ASSIGNMENT_STATUS_ASSIGNED = 'assigned';
export const LEAD_ASSIGNMENT_STATUS_UNASSIGNED = 'unassigned';
export const LEAD_ASSIGNMENT_SCOPE = 'sales_executive_round_robin';
export const SHARAVATHI_SALES_EMAIL = 'sharavathi@aadhyaserene.com';
export const SHARAVATHI_EXCLUSIVE_LEAD_SOURCES = [
    'ready_to_move_whatsapp_modal',
    'ready_to_move_landing',
];

function normalizeLeadSource(source) {
    return typeof source === 'string' ? source.trim().toLowerCase() : '';
}

export function isSharavathiExclusiveLeadSource(source) {
    return SHARAVATHI_EXCLUSIVE_LEAD_SOURCES.includes(normalizeLeadSource(source));
}

export function getSalesExecutiveEligibilityFilter(source) {
    const emailFilter = isSharavathiExclusiveLeadSource(source)
        ? SHARAVATHI_SALES_EMAIL
        : { $ne: SHARAVATHI_SALES_EMAIL };

    return {
        role: SALES_EXECUTIVE_ROLE,
        active: true,
        email: emailFilter,
    };
}

export function getUnassignedLeadAssignment() {
    return {
        assignedSalesExecutiveId: '',
        assignedSalesExecutiveName: '',
        assignedSalesExecutiveEmail: '',
        assignmentStatus: LEAD_ASSIGNMENT_STATUS_UNASSIGNED,
        assignedAt: null,
    };
}

function getAssignedLeadAssignment(salesExecutive) {
    return {
        assignedSalesExecutiveId: String(salesExecutive._id),
        assignedSalesExecutiveName: salesExecutive.name || '',
        assignedSalesExecutiveEmail: salesExecutive.email || '',
        assignmentStatus: LEAD_ASSIGNMENT_STATUS_ASSIGNED,
        assignedAt: new Date(),
    };
}

export async function getEligibleSalesExecutives(source) {
    await connectMongo();

    return AdminUser.find(getSalesExecutiveEligibilityFilter(source))
        .sort({ createdAt: 1, _id: 1 })
        .lean();
}

export async function getNextLeadAssignment(source) {
    const eligibleSalesExecutives = await getEligibleSalesExecutives(source);

    if (!eligibleSalesExecutives.length) {
        return getUnassignedLeadAssignment();
    }

    // Exclusive sources have a single fixed owner and must not advance the
    // round-robin sequence used by all other lead sources.
    if (isSharavathiExclusiveLeadSource(source)) {
        return getAssignedLeadAssignment(eligibleSalesExecutives[0]);
    }

    const assignmentState = await LeadAssignmentState.findOneAndUpdate(
        { scope: LEAD_ASSIGNMENT_SCOPE },
        {
            $inc: { nextSequence: 1 },
            $setOnInsert: {
                scope: LEAD_ASSIGNMENT_SCOPE,
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        },
    ).lean();

    const sequenceValue = Math.max((assignmentState?.nextSequence || 1) - 1, 0);
    const assignedExecutive = eligibleSalesExecutives[
        sequenceValue % eligibleSalesExecutives.length
    ];

    return getAssignedLeadAssignment(assignedExecutive);
}
