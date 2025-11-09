import { Schema, model, Document, Types } from "mongoose";

export interface ChatDocument extends Document {
    id: string;
    name: string;
    displayPicture: string;
    participants: Types.ObjectId[];
    isGroupChat: boolean;
    lastMessage: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const chatSchema = new Schema<ChatDocument>(
    {
        name: {
            type: String,
            default: "",
        },
        displayPicture: {
            type: String,
            default: "default-group-dp.png",
        },
        participants: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                default: [],
            },
        ],
        isGroupChat: {
            type: Boolean,
            default: false,
        },
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
    },
    {
        collection: "chatCollection",
        autoIndex: true,
        optimisticConcurrency: true,
        bufferTimeoutMS: 10000,
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                ret["id"] = ret["_id"].toHexString();
                delete ret["_id"];
                delete ret["__v"];
                delete ret["_doc"];
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: (_doc, ret) => {
                ret["id"] = ret["_id"].toHexString();
                delete ret["_id"];
                delete ret["__v"];
                delete ret["_doc"];
                return ret;
            },
        },
    }
);

const ChatModel = model<ChatDocument>("Chat", chatSchema);

export default ChatModel;
