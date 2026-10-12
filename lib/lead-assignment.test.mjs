import assert from 'node:assert/strict';
import test from 'node:test';

import {
    SALES_EXECUTIVE_ROLE,
    SHARAVATHI_SALES_EMAIL,
    getSalesExecutiveEligibilityFilter,
    isSharavathiExclusiveLeadSource,
} from './lead-assignment.js';

test('routes Sharavathi-exclusive sources only to Sharavathi', () => {
    for (const source of [
        'ready_to_move_whatsapp_modal',
        'ready_to_move_landing',
        ' READY_TO_MOVE_LANDING ',
    ]) {
        assert.equal(isSharavathiExclusiveLeadSource(source), true);
        assert.deepEqual(getSalesExecutiveEligibilityFilter(source), {
            role: SALES_EXECUTIVE_ROLE,
            active: true,
            email: SHARAVATHI_SALES_EMAIL,
        });
    }
});

test('excludes Sharavathi from every other lead source', () => {
    for (const source of ['website', 'aurum_analytica', 'magic_bricks', '', undefined]) {
        assert.equal(isSharavathiExclusiveLeadSource(source), false);
        assert.deepEqual(getSalesExecutiveEligibilityFilter(source), {
            role: SALES_EXECUTIVE_ROLE,
            active: true,
            email: { $ne: SHARAVATHI_SALES_EMAIL },
        });
    }
});
