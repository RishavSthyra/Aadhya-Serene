import mongoose from 'mongoose';

function getMongoUris() {
    const primaryUri =
        process.env.MONGODB_URI ||
        process.env.MONGO_DB_CONNECTION_STRING ||
        process.env.MONGO_DB_CONNECTIO_STRING;
    const directUri = process.env.MONGODB_DIRECT_URI;
    const mongoUris = [primaryUri, directUri].filter(Boolean);

    if (!mongoUris.length) {
        throw new Error('Missing MongoDB connection string.');
    }

    return mongoUris;
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
        const mongoUris = getMongoUris();

        cached.promise = (async () => {
            let lastError = null;

            for (const mongoUri of mongoUris) {
                try {
                    return await mongoose.connect(mongoUri, {
                        bufferCommands: false,
                        dbName: process.env.MONGODB_DB || 'AadhyaSerene',
                    });
                } catch (error) {
                    lastError = error;
                }
            }

            throw lastError || new Error('Unable to connect to MongoDB.');
        })();
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        throw error;
    }
}
