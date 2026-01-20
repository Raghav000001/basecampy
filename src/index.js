import app from "./app.js";
import dotenv from "dotenv"
import connectDB from "./db/config.js";

dotenv.config({path:"./.env"})


const port = process.env.PORT


connectDB()
.then(()=> {
    app.listen(port,()=> {
    console.log(`app is running on port:${port}`);
})
})
.catch((error)=> {
   console.log(error,"error in starting the app");
})
