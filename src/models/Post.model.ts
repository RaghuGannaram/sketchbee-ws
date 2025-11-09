import { Schema, model, Document, Types } from "mongoose";

export interface PostDocument extends Document {
    id: string;
    author: Types.ObjectId;
    description: string;
    image: {
        thumbnail: string;
        original: string;
    };
    likes: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const postSchema = new Schema<PostDocument>(
    {
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        description: {
            type: String,
            maxLength: [500, "description must be at most 500 characters, received {VALUE}"],
            default: "",
        },
        image: {
            thumbnail: {
                type: String,
                default: "",
            },
            original: {
                type: String,
                default: "",
            },
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                default: [],
            },
        ],
    },
    {
        collection: "postCollection",
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

const PostModel = model<PostDocument>("Post", postSchema);

export default PostModel;
