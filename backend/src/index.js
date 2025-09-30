import express from "express";
import dotenv from "dotenv";
import {connectDB} from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";   
import cookieParser from "cookie-parser"; 
import messageRoutes from "./routes/message.route.js";
import cors from "cors";
import { app, server} from "./lib/socket.js";
import path from "path";
import multer from "multer";

dotenv.config();


const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(express.json({ limit : "50mb"}));
app.use(express.urlencoded({ limit : "50mb", extended: true}));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin : ["http://localhost:5173","https://chitchat-vvxt.onrender.com"],
    credentials: true,
}))

app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes)
app.use("/songs", express.static(path.join(__dirname, "songs"), {
    setHeaders: (res, path) => {
        if (path.endsWith(".mp3")) {
          res.setHeader("Content-Type", "audio/mpeg");
        }
    }
}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, "songs")),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
    
const upload = multer({storage});

app.post("/upload", upload.single("song"), (req,res) => {
    if(!req.file){
        return res.status(400).json({error: "No file uploaded"});
    }
    res.json({
        message: "File uploaded successfully",
        url: `/songs/${req.file.filename}`,
    });
});


if(process.env.NODE_ENV==="production"){
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req,res)=>{
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    })
}

server.listen(5001, () =>{
    console.log(`Server listening on port ${PORT}`);
    connectDB();
}) 