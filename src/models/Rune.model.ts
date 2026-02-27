import { Schema, model, Document, Types } from "mongoose";

export interface RuneDocument extends Document {
	id: string;
	chamber: Types.ObjectId;
	caster: Types.ObjectId;
	rune: string;
	createdAt: Date;
	updatedAt: Date;
}

const runeSchema = new Schema<RuneDocument>(
	{
		chamber: {
			type: Schema.Types.ObjectId,
			ref: "Chamber",
			required: true,
		},
		caster: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		rune: {
			type: String,
			required: true,
		},
	},
	{
		collection: "runeCollection",
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

const RuneModel = model<RuneDocument>("Rune", runeSchema);

export default RuneModel;
