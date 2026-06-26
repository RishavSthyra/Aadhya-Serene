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

const RecurringPaymentSchema = new mongoose.Schema(
    {
        externalId: { type: String, trim: true, default: undefined, index: true },
        matchKey: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true, index: true },
        type: {
            type: String,
            enum: ['salary', 'subscription'],
            required: true,
            index: true,
        },
        cycle: {
            type: String,
            enum: ['monthly', 'annual'],
            required: true,
            index: true,
        },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'INR', uppercase: true, trim: true },
        startDate: { type: Date, required: true, index: true },
        endDate: { type: Date, default: null },
        status: {
            type: String,
            enum: ['active', 'paused', 'ended'],
            default: 'active',
            index: true,
        },
        paymentMethod: { type: String, default: 'bank_transfer', trim: true },
        ownerName: { type: String, default: '', trim: true },
        department: { type: String, default: '', trim: true },
        employeeCode: { type: String, default: '', trim: true, index: true },
        employeeEmail: { type: String, default: '', trim: true, lowercase: true },
        vendorName: { type: String, default: '', trim: true, index: true },
        notes: { type: String, default: '', trim: true },
        autoRenew: { type: Boolean, default: false },
        seatCount: { type: Number, default: 0, min: 0 },
        source: {
            type: String,
            enum: ['manual', 'csv'],
            default: 'manual',
            index: true,
        },
        importBatchId: { type: String, default: '' },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    },
    { timestamps: true },
);

export const Flat = mongoose.models.Flat || mongoose.model('Flat', FlatSchema);
export const AdminUser =
    mongoose.models.AdminUser || mongoose.model('AdminUser', UserSchema);
export const SignupKey =
    mongoose.models.SignupKey || mongoose.model('SignupKey', SignupKeySchema);
export const RecurringPayment =
    mongoose.models.RecurringPayment || mongoose.model('RecurringPayment', RecurringPaymentSchema);
