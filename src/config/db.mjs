import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

export const connectToMongoDB = async () => {
    try{
        await mongoose.connect(process.env.DB_URL);
        console.log('Conecction to mongodb');
    }catch(err){
        console.error('Error to connect mongodb');
    }
};