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
            enum: ['super_admin', 'manager', 'channel_partner', 'lead_partner'],
            default: 'channel_partner',
            index: true,
        },
        // Lead partners are restricted to this exact Notification.source value.
        leadSource: { type: String, default: '', trim: true, lowercase: true, index: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const SignupKeySchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, index: true },
        role: {
            type: String,
            enum: ['super_admin', 'manager', 'channel_partner', 'lead_partner'],
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

const CallLogSchema = new mongoose.Schema(
    {
        callDate: { type: String, required: true, trim: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        callStatus: {
            type: String,
            required: true,
            enum: ['answered', 'not_answered'],
            default: 'answered',
        },
        remark: { type: String, required: true, trim: true, maxlength: 5000 },
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
        leadStatus: {
            type: String,
            enum: ['active', 'dead'],
            default: 'active',
            index: true,
        },
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
export const WhatsAppConversation = getModel(
    'WhatsAppConversation',
    WhatsAppConversationSchema,
);
