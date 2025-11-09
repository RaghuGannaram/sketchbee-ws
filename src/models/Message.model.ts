import { Schema, model, Document, Types } from "mongoose";

export interface MessageDocument extends Document {
    id: string;
    chat: Types.ObjectId;
    sender: Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
    {
        chat: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
        },
        sender: {
            
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        collection: "messageCollection",
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

const MessageModel = model<MessageDocument>("Message", messageSchema);

export default MessageModel;
