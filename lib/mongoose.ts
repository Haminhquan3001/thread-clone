import mongoose from 'mongoose';

let isConnected = false;

export const connectToDB = async () => {
    mongoose.set('strictQuery', true);

    if (!process.env.MONGODB_URL) return console.log("MongoDB url not found");
    if (isConnected) return console.log("Mongodb already connected");
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        isConnected = true;
        // console.log("Connected to MongoDB")
    } catch (error) {
        console.log("Error: ", error)
    }
}