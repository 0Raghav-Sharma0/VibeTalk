import mongoose from "mongoose";

export const connectDB = async()=>{
    try{
        const conn = await mongoose.connect("mongodb+srv://Raghav010101:Bambambhole007@cluster0.p6uis.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        console.log(`MongoDB connected : ${conn.connection.host}`);
    } catch(error){
        console.log("MongoDB connection error: ", error);
    }
};