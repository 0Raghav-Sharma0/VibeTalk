import User from "../models/user.model.js";
import {generateToken} from "../lib/utils.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required." });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long." });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullName, email, password: hashedPassword });
        await newUser.save();

        const token = generateToken(newUser._id, res);

        res.status(201).json({
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            profilePic: newUser.profilePic,
            token,
        });
    } catch (error) {
        console.log("Error in signup controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid Credentials." });
        }

        const token = generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            token,
        });
    } catch (error) {
        console.log("Error in login controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const logout = (req,res)=>{
    try{
        res.cookie("jwt", "", {maxAge : 0});
        res.status(200).json({message : "Logged out successfully"});
    }catch(error){
        console.log("Error in logout controller", error.message);
        res.status(500).json({message : "Internal Server Error"});
    }
};

export const updateProfile = async (req,res) =>{
    try{
        const {profilePic} = req.body;
        const userId = req.user._id;
        if(!profilePic){
            return res.status(400).json({message : "Profile Pic is required."});
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic: uploadResponse.secure_url}, {new: true});
        res.status(200).json(updatedUser);
    }catch(error){
        console.log("Error in updating profile: ", error);
        res.status(500).json({message : "Internal Server Error."})
    }
};

export const checkAuth = (req,res) => {
    try{
        res.status(200).json(req.user);
    } catch(error){
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({message : "Internal Server Error"});
    }
};