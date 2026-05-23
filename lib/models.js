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

export const Flat = mongoose.models.Flat || mongoose.model('Flat', FlatSchema);
export const AdminUser =
    mongoose.models.AdminUser || mongoose.model('AdminUser', UserSchema);
export const SignupKey =
    mongoose.models.SignupKey || mongoose.model('SignupKey', SignupKeySchema);
