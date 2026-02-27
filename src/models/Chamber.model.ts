import { Schema, model, Document, Types } from "mongoose";

export interface ChamberDocument extends Document {
	id: string;
	name: string;
	players: Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

const chamberSchema = new Schema<ChamberDocument>(
	{
		name: {
			type: String,
			default: "",
		},
		players: [
			{
				type: Schema.Types.ObjectId,
				ref: "User",
				default: [],
			},
		],
	},
	{
		collection: "chamberCollection",
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

const ChamberModel = model<ChamberDocument>("Chamber", chamberSchema);

export default ChamberModel;
