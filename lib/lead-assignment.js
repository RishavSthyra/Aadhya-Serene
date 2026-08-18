import { connectMongo } from './mongodb';
import { AdminUser, LeadAssignmentState } from './models';

export const SALES_EXECUTIVE_ROLE = 'sales_executive';
export const LEAD_ASSIGNMENT_STATUS_ASSIGNED = 'assigned';
export const LEAD_ASSIGNMENT_STATUS_UNASSIGNED = 'unassigned';
export const LEAD_ASSIGNMENT_SCOPE = 'sales_executive_round_robin';

export function getUnassignedLeadAssignment() {
    return {
        assignedSalesExecutiveId: '',
        assignedSalesExecutiveName: '',
        assignedSalesExecutiveEmail: '',
        assignmentStatus: LEAD_ASSIGNMENT_STATUS_UNASSIGNED,
        assignedAt: null,
    };
}

export async function getEligibleSalesExecutives() {
    await connectMongo();

    return AdminUser.find({
        role: SALES_EXECUTIVE_ROLE,
        active: true,
    })
        .sort({ createdAt: 1, _id: 1 })
        .lean();
}

export async function getNextLeadAssignment() {
    const eligibleSalesExecutives = await getEligibleSalesExecutives();

    if (!eligibleSalesExecutives.length) {
        return getUnassignedLeadAssignment();
    }

    const assignmentState = await LeadAssignmentState.findOneAndUpdate(
        { scope: LEAD_ASSIGNMENT_SCOPE },
        {
            $inc: { nextSequence: 1 },
            $setOnInsert: {
                scope: LEAD_ASSIGNMENT_SCOPE,
                nextSequence: 0,
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

    return {
        assignedSalesExecutiveId: String(assignedExecutive._id),
        assignedSalesExecutiveName: assignedExecutive.name || '',
        assignedSalesExecutiveEmail: assignedExecutive.email || '',
        assignmentStatus: LEAD_ASSIGNMENT_STATUS_ASSIGNED,
        assignedAt: new Date(),
    };
}
