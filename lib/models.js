import mongoose from 'mongoose';

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
            enum: ['pending', 'sent', 'failed', 'not_requested'],
            default: 'pending',
            index: true,
        },
        sentAt: { type: Date },
        error: { type: String, default: '' },
        messageId: { type: String, default: '' },
    },
    { _id: false },
);

const SalesRemarkSchema = new mongoose.Schema(
    {
        text: { type: String, required: true, trim: true, maxlength: 5000 },
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
        emailDelivery: {
            type: DeliveryStateSchema,
            default: () => ({ status: 'pending' }),
        },
        whatsappDelivery: {
            type: DeliveryStateSchema,
            default: () => ({ status: 'not_requested' }),
        },
        salesRemarks: { type: [SalesRemarkSchema], default: [] },
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

export const Flat = mongoose.models.Flat || mongoose.model('Flat', FlatSchema);
export const AdminUser =
    mongoose.models.AdminUser || mongoose.model('AdminUser', UserSchema);
export const SignupKey =
    mongoose.models.SignupKey || mongoose.model('SignupKey', SignupKeySchema);
export const Notification =
    mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export const WhatsAppConversation =
    mongoose.models.WhatsAppConversation ||
    mongoose.model('WhatsAppConversation', WhatsAppConversationSchema);
