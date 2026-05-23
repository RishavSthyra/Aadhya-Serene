import mongoose from 'mongoose';

const MONGODB_URI =
    process.env.MONGODB_URI ||
    process.env.MONGO_DB_CONNECTION_STRING ||
    process.env.MONGO_DB_CONNECTIO_STRING;

if (!MONGODB_URI) {
    throw new Error('Missing MongoDB connection string.');
}

let cached = global.mongooseConnection;

if (!cached) {
    cached = global.mongooseConnection = {
        conn: null,
        promise: null,
    };
}

export async function connectMongo() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            dbName: process.env.MONGODB_DB || 'AadhyaSerene',
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
