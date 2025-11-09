import { Schema, model, Document, Types } from "mongoose";

export interface CommentDocument extends Document {
    id: string;
    post: Types.ObjectId;
    author: Types.ObjectId;
    description: string;
    likes: Types.ObjectId[];
    hidden: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<CommentDocument>(
    {
        post: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        description: {
            type: String,
            required: [true, "description is required, received {VALUE}"],
            maxLength: [200, "description must be at most 200 characters"],
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                default: [],
            },
        ],
        hidden: {
            type: Boolean,
            default: false,
        },
    },
    {
        collection: "commentCollection",
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

const CommentModel = model<CommentDocument>("Comment", commentSchema);
export default CommentModel;
