import { Schema, model, Document, Types } from "mongoose";

export interface GestureDocument extends Document {
    id: string;
    chamber: Types.ObjectId;
    sender: Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const gestureSchema = new Schema<GestureDocument>(
    {
        chamber: {
            type: Schema.Types.ObjectId,
            ref: "Chamber",
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
        collection: "gestureCollection",
        autoIndex: true,
        optimisticConcurrency: true,
        bufferTimeoutMS: 10000,
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret: Record<string, any>) => {
                ret["id"] = ret["_id"].toHexString();
                delete ret["_id"];
                delete ret["__v"];
                delete ret["_doc"];
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: (_doc, ret: Record<string, any>) => {
                ret["id"] = ret["_id"].toHexString();
                delete ret["_id"];
                delete ret["__v"];
                delete ret["_doc"];
                return ret;
            },
        },
    }
);

const GestureModel = model<GestureDocument>("Gesture", gestureSchema);

export default GestureModel;