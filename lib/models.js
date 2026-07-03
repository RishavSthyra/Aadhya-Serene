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
            enum: ['super_admin', 'manager', 'channel_partner'],
            default: 'channel_partner',
            index: true,
        },
        active: { type: Boolean, default: true },
    },
    { timestamps: true },
);

const SignupKeySchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, index: true },
        role: {
            type: String,
            enum: ['super_admin', 'manager', 'channel_partner'],
            required: true,
        },
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
    },
    { _id: false },
);

const NotificationSchema = new mongoose.Schema(
    {
        projectName: { type: String, default: 'Aadhya Serene', index: true },
        source: { type: String, default: 'website', index: true },
        channel: {
            type: String,
            enum: ['contact_form', 'whatsapp_form'],
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
    },
    {
        timestamps: true,
        collection: 'notifications',
    },
);

export const Flat = mongoose.models.Flat || mongoose.model('Flat', FlatSchema);
export const AdminUser =
    mongoose.models.AdminUser || mongoose.model('AdminUser', UserSchema);
export const SignupKey =
    mongoose.models.SignupKey || mongoose.model('SignupKey', SignupKeySchema);
export const Notification =
    mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
