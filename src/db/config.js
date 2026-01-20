import mongoose from "mongoose";
import { DB_NAME } from "../utils/constants.js";


const connectDB = async ()=> {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        if (connectionInstance) {
            console.log("mongo db connected successfully",connectionInstance.connection.host);
        }
    } catch (error) {
        console.log(error,"error in connecting db");
        process.exit(1);
    }
}

export default connectDB;