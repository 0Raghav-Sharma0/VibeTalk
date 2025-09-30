    import User from "../models/user.model.js";
    import Message from "../models/message.model.js";
    import cloudinary from "../lib/cloudinary.js";
    import { getReceiverSocketId, io } from "../lib/socket.js";

    export const getUsersForSidebar = async (req,res) => {
        try{
            const loggedInUserId = req.user._id;
            const filteredUsers = await User.find({_id : {$ne : loggedInUserId}}).select("-password");

            res.status(200).json(filteredUsers);
        }
        catch(error){
            console.log("Error in getUsersForSidebar : ", error.message);
            res.status(500).json({error : "Internal Server Error"});
        }
    };

    export const getMessages = async (req, res) => {
        try {
            const { id: userToChatId } = req.params;
            const myId = req.user._id;
    
            const messages = await Message.find({
                $or: [
                    { senderId: myId, receiverId: userToChatId },
                    { senderId: userToChatId, receiverId: myId },
                ],
            })
            .sort({ createdAt: 1 })
            .lean();
    
            res.status(200).json(messages);
        } catch (error) {
            console.log("Error in getMessages controller:", error.message);
            res.status(500).json({ message: "Internal Server Error" });
        }
    };
    
    

    export const sendMessage = async (req,res) => {
        try{
            const {text, image, video} = req.body;
            const { id : receiverId} = req.params;
            const senderId = req.user._id;

            let imageUrl = null;
            if(image){
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: "chat-images",
                    resource_type: "auto",
                });
                imageUrl = uploadResponse.secure_url;
            }

            let videoUrl = null;
            if(video){
                const uploadResponse = await cloudinary.uploader.upload(video,{
                    folder: "chat-videos",
                    resource_type: "video",
                });
                videoUrl = uploadResponse.secure_url;
            }
            const newMessage = new Message({
                senderId,
                receiverId,
                text,
                image : imageUrl,
                video : videoUrl,
            });
            await newMessage.save();

            const receiverSocketId = getReceiverSocketId(receiverId);
            if(receiverSocketId){
                io.to(receiverSocketId).emit("newMessage", newMessage);
            }

            res.status(201).json(newMessage);
        }catch(error){
            console.log("Error in sendMessage controller : ", error.message);
            res.status(500).json({message : "Internal Server Error"});
        }
    };

    export const addReaction = async (req, res) => {
        try {
            const { messageId, userId, emoji } = req.body;
    
            if (!messageId || !userId || !emoji) {
                return res.status(400).json({ error: "Missing required fields" });
            }
    
            const message = await Message.findById(messageId);
            if (!message) {
                return res.status(404).json({ error: "Message not found" });
            }
            message.reactions = message.reactions.filter((r) => r.userId.toString() !== userId);
            message.reactions.push({ userId, emoji });
            await message.save();
            io.emit("messageReaction", { messageId, reactions: message.reactions });
    
            res.status(200).json({ message: "Reaction added successfully", data: message });
        } catch (error) {
            console.error("Error adding reaction:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    };
    