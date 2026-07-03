import mongoose from 'mongoose';

function getMongoUri() {
    const mongoUri =
        process.env.MONGODB_URI ||
        process.env.MONGO_DB_CONNECTION_STRING ||
        process.env.MONGO_DB_CONNECTIO_STRING;

    if (!mongoUri) {
        throw new Error('Missing MongoDB connection string.');
    }

    return mongoUri;
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
        const mongoUri = getMongoUri();

        cached.promise = mongoose.connect(mongoUri, {
            bufferCommands: false,
            dbName: process.env.MONGODB_DB || 'AadhyaSerene',
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
