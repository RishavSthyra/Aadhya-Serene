import mongoose from 'mongoose';

function getModel(name, schema) {
    const existingModel = mongoose.models[name];
    if (existingModel) {
        const hasEverySchemaPath = Object.keys(schema.paths).every((pathName) =>
            existingModel.schema.path(pathName),
        );

        if (hasEverySchemaPath) {
            return existingModel;
        }

        mongoose.deleteModel(name);
    }

    return mongoose.model(name, schema);
}

const RoomSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        size: { type: String, required: true },
        icon: { type: String, default: '' },
    },
    { _id: false },
);

const FlatSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true, index: true },
        flat: { type: String, required: true, unique: true, index: true },
        model: { type: Number, required: true, index: true },
        type: { type: String, required: true, index: true },
        area: { type: Number, required: true, index: true },
        balconies: { type: Number, required: true },
        facing: { type: String, required: true, index: true },
        status: {
            type: String,
            enum: ['available', 'sold out', 'blocked', 'reserved'],
            default: 'available',
            index: true,
        },
        floor: { type: String, required: true, index: true },
        rooms: { type: [RoomSchema], default: [] },
    },
    { timestamps: true },
);

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        role: {
            type: String,
            enum: ['super_admin', 'manager', 'sales_executive', 'channel_partner', 'lead_partner'],
            default: 'channel_partner',
            index: true,
        },
        // Lead partners are restricted to this exact Notification.source value.
        leadSource: { type: String, default: '', trim: true, lowercase: true, index: true },
        // Optional registered mobile used for server-side click-to-call routing.
        phone: { type: String, default: '', trim: true },
        // Daffytel CRM login identifier used for this salesperson's calls.
        daffytelAgentId: { type: String, default: '', trim: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const SignupKeySchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, index: true },
        role: {
            type: String,
            enum: ['super_admin', 'manager', 'sales_executive', 'channel_partner', 'lead_partner'],
            required: true,
        },
        // Present only for source-scoped partner signup keys.
        leadSource: { type: String, default: '', trim: true, lowercase: true, index: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
        usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
        usedAt: { type: Date },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const DeliveryStateSchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ['pending', 'accepted', 'sent', 'delivered', 'read', 'failed', 'not_requested'],
            default: 'pending',
            index: true,
        },
        metaStatus: { type: String, default: '', trim: true, index: true },
        metaStatusAt: { type: Date },
        metaRecipientId: { type: String, default: '', trim: true },
        metaErrorCode: { type: Number, default: 0 },
        sentAt: { type: Date },
        error: { type: String, default: '' },
        messageId: { type: String, default: '' },
    },
    { _id: false },
);

const SalesRemarkSchema = new mongoose.Schema(
    {
        type: { type: String, enum: ['note', 'feedback'], default: 'note', index: true },
        text: { type: String, required: true, trim: true, maxlength: 6000 },
        budget: { type: String, default: '', trim: true, maxlength: 80 },
        configuration: { type: String, default: '', trim: true, maxlength: 40 },
        location: { type: String, default: '', trim: true, maxlength: 120 },
        notes: { type: String, default: '', trim: true, maxlength: 5000 },
        authorName: { type: String, default: 'Sales Team', trim: true },
        authorEmail: { type: String, default: '', trim: true, lowercase: true },
    },
    { timestamps: true },
);

const LeadLifecycleEventSchema = new mongoose.Schema(
    {
        eventKey: { type: String, required: true, trim: true },
        type: { type: String, required: true, trim: true },
        occurredAt: { type: Date, default: Date.now },
        actorName: { type: String, default: '', trim: true },
        actorEmail: { type: String, default: '', trim: true, lowercase: true },
        source: { type: String, default: 'admin_call', trim: true },
        callId: { type: String, default: '', trim: true },
        callbackDueAt: { type: Date, default: null },
        callbackStatus: {
            type: String,
            enum: ['none', 'pending', 'completed', 'cancelled'],
            default: 'none',
        },
        scheduledAt: { type: Date, default: null },
        note: { type: String, default: '', trim: true, maxlength: 5000 },
    },
    { _id: false },
);

const LeadLifecycleSchema = new mongoose.Schema(
    {
        bucket: {
            type: String,
            enum: ['new_lead', 'site_visit_booked', 'callback_requested', 'dead'],
            default: 'new_lead',
            index: true,
        },
        callbackStatus: {
            type: String,
            enum: ['none', 'pending', 'completed', 'cancelled'],
            default: 'none',
        },
        callbackDueAt: { type: Date, default: null },
        callbackUpdatedAt: { type: Date, default: null },
        siteVisitBookedAt: { type: Date, default: null },
        stateUpdatedAt: { type: Date, default: null },
        events: { type: [LeadLifecycleEventSchema], default: [] },
    },
    { _id: false },
);

const CallLogSchema = new mongoose.Schema(
    {
        callDate: { type: String, required: true, trim: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        callStatus: {
            type: String,
            required: true,
            enum: ['answered', 'not_answered', 'switched_off', 'invalid_number'],
            default: 'answered',
        },
        callOutcome: {
            type: String,
            enum: ['answered', 'not_answered', 'switched_off', 'invalid_number'],
            default: '',
        },
        answeredOutcomes: {
            type: [String],
            enum: ['details_shared', 'site_visit_booked', 'callback_requested'],
            default: [],
        },
        callbackDueAt: { type: Date, default: null },
        callbackStatus: {
            type: String,
            enum: ['none', 'pending', 'completed', 'cancelled'],
            default: 'none',
        },
        idempotencyKey: { type: String, default: '', trim: true, index: true },
        provider: { type: String, enum: ['', 'daffytel'], default: '', trim: true, index: true },
        providerCallId: { type: String, default: '', trim: true, index: true },
        providerRequestId: { type: String, default: '', trim: true, index: true },
        providerAgent: { type: String, default: '', trim: true },
        providerCaller: { type: String, default: '', trim: true },
        providerEventKey: { type: String, default: '', trim: true, index: true },
        providerStatus: { type: String, default: '', trim: true },
        providerHangupCause: { type: String, default: '', trim: true, maxlength: 240 },
        durationSeconds: { type: Number, default: null, min: 0, max: 86400 },
        ivrDurationSeconds: { type: Number, default: null, min: 0, max: 86400 },
        transferDurationSeconds: { type: Number, default: null, min: 0, max: 86400 },
        recordingUrl: { type: String, default: '', trim: true, maxlength: 2000 },
        providerStartedAt: { type: Date, default: null },
        providerEndedAt: { type: Date, default: null },
        providerUpdatedAt: { type: Date, default: null },
        // Retained for historical compatibility. New writes use callOutcome.
        leadStatus: {
            type: String,
            enum: ['', 'cold', 'warm', 'hot', 'dead'],
            default: '',
            index: true,
        },
        remark: { type: String, required: true, trim: true, maxlength: 5000 },
        sharedRequirements: { type: Boolean, default: false },
        budget: { type: String, default: '', trim: true, maxlength: 80 },
        configuration: { type: String, default: '', trim: true, maxlength: 40 },
        location: { type: String, default: '', trim: true, maxlength: 120 },
        authorName: { type: String, default: 'Sales Team', trim: true },
        authorEmail: { type: String, default: '', trim: true, lowercase: true },
    },
    { timestamps: true },
);

const NotificationSchema = new mongoose.Schema(
    {
        projectName: { type: String, default: 'Aadhya Serene', index: true },
        source: { type: String, default: 'website', index: true },
        // Used only for short-lived form idempotency. External portals retain
        // their own permanent leadId-based duplicate protection.
        submissionWindow: { type: String, index: true },
        channel: {
            type: String,
            enum: ['contact_form', 'whatsapp_form', 'portal_lead'],
            required: true,
            index: true,
        },
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true, index: true },
        email: { type: String, default: '', lowercase: true, trim: true, index: true },
        requestType: { type: String, default: 'general_enquiry', index: true },
        requestLabel: { type: String, default: 'General Enquiry' },
        preferredTime: { type: String, default: '' },
        message: { type: String, default: '' },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
        assignedSalesExecutiveId: { type: String, default: '', index: true },
        assignedSalesExecutiveName: { type: String, default: '' },
        assignedSalesExecutiveEmail: { type: String, default: '', lowercase: true, trim: true },
        assignmentStatus: {
            type: String,
            enum: ['assigned', 'unassigned'],
            default: 'unassigned',
            index: true,
        },
        assignedAt: { type: Date, default: null },
        leadStatus: {
            type: String,
            enum: ['active', 'dead'],
            default: 'active',
            index: true,
        },
        salesLeadStatus: {
            type: String,
            enum: ['cold', 'warm', 'hot', 'dead'],
            default: 'cold',
            index: true,
        },
        leadLifecycle: {
            type: LeadLifecycleSchema,
            default: () => ({ bucket: 'new_lead' }),
        },
        originalSubmittedAt: { type: Date, default: null, index: true },
        emailDelivery: {
            type: DeliveryStateSchema,
            default: () => ({ status: 'pending' }),
        },
        whatsappDelivery: {
            type: DeliveryStateSchema,
            default: () => ({ status: 'not_requested' }),
        },
        salesRemarks: { type: [SalesRemarkSchema], default: [] },
        callLogs: { type: [CallLogSchema], default: [] },
    },
    {
        timestamps: true,
        collection: 'notifications',
    },
);

// Portal lead IDs are supplied by 99acres/MagicBricks and make their retry
// requests idempotent: one portal lead can create only one enquiry record.
NotificationSchema.index(
    {
        'metadata.externalLead.provider': 1,
        'metadata.externalLead.leadId': 1,
    },
    { unique: true, sparse: true },
);

NotificationSchema.index(
    { source: 1, phone: 1, channel: 1, submissionWindow: 1 },
    { unique: true, sparse: true },
);

const AdminSettingSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, index: true, trim: true },
        value: { type: mongoose.Schema.Types.Mixed, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    },
    { timestamps: true, collection: 'admin_settings' },
);

const LeadAssignmentStateSchema = new mongoose.Schema(
    {
        scope: { type: String, required: true, unique: true, index: true, trim: true },
        nextSequence: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true },
);

const ConversationHistorySchema = new mongoose.Schema(
    {
        direction: { type: String, enum: ['inbound', 'outbound', 'system'], required: true },
        type: { type: String, default: '' },
        buttonId: { type: String, default: '' },
        message: { type: String, default: '' },
        messageId: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false },
);

const WhatsAppConversationSchema = new mongoose.Schema(
    {
        phoneNumber: { type: String, required: true, unique: true, index: true, trim: true },
        enquiryRecordId: { type: String, default: '', index: true },
        name: { type: String, default: '', trim: true },
        projectName: { type: String, default: 'Aadhya Serene' },
        source: { type: String, default: 'website', index: true },
        currentState: { type: String, default: 'AWAITING_ENTRY', index: true },
        lastButton: { type: String, default: '' },
        history: { type: [ConversationHistorySchema], default: [] },
        siteVisitRequested: { type: Boolean, default: false, index: true },
        callbackRequested: { type: Boolean, default: false, index: true },
    },
    {
        timestamps: true,
        collection: 'whatsapp_conversations',
    },
);

export const Flat = getModel('Flat', FlatSchema);
export const AdminUser = getModel('AdminUser', UserSchema);
export const SignupKey = getModel('SignupKey', SignupKeySchema);
export const Notification = getModel('Notification', NotificationSchema);
export const AdminSetting = getModel('AdminSetting', AdminSettingSchema);
export const LeadAssignmentState = getModel('LeadAssignmentState', LeadAssignmentStateSchema);
export const WhatsAppConversation = getModel(
    'WhatsAppConversation',
    WhatsAppConversationSchema,
);
