import { Schema, model, Document, Types } from "mongoose";

export interface UserDocument extends Document {
    id: string;
    fullname: string;
    handle: string;
    email: string;
    password: string;
    avatar: string;
    background: string;
    bio: string;
    city: string;
    from: string;
    role: "user" | "moderator" | "admin";
    followers: Types.ObjectId[];
    followees: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
    {
        fullname: {
            type: String,
            required: [true, "fullname is required, received {VALUE}"],
            minLength: [1, "fullname must be at least 1 character, received {VALUE}"],
            maxLength: [50, "fullname must be at most 50 characters, received {VALUE}"],
        },
        handle: {
            type: String,
            required: [true, "handle is required, received {VALUE}"],
            minLength: [1, "handle must be at least 3 character, received {VALUE}"],
            maxLength: [20, "handle must be at most 20 characters, received {VALUE}"],
            lowercase: true,
            unique: true,
        },
        email: {
            type: String,
            required: [true, "email is required, received {VALUE}"],
            minLength: [5, "email must be at least 5 characters, received {VALUE}"],
            maxLength: [100, "email must be at most 100 characters, received {VALUE}"],
            lowercase: true,
            unique: true,
        },
        password: {
            type: String,
            required: [true, "password is required, received {VALUE}"],
            minLength: [8, "password must be at least 8 characters, received {VALUE}"],
            maxLength: [100, "password must be at most 100 characters, received {VALUE}"],
        },
        avatar: {
            type: String,
            default: "default-avatar.png",
        },
        background: {
            type: String,
            default: "default-background.jpg",
        },
        bio: {
            type: String,
            default: "",
            maxLength: [200, "bio must be at most 200 characters, received {VALUE}"],
        },
        city: {
            type: String,
            default: "",
            maxLength: [50, "city must be at most 50 characters, received {VALUE}"],
        },
        from: {
            type: String,
            default: "",
            maxLength: [50, "from must be at most 50 characters, received {VALUE}"],
        },
        role: {
            type: String,
            enum: ["user", "moderator", "admin"],
            default: "user",
        },
        followers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                default: [],
            },
        ],
        followees: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
                default: [],
            },
        ],
    },
    {
        collection: "userCollection",
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

const UserModel = model<UserDocument>("User", userSchema);

export default UserModel;
