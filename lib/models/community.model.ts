import { Schema, model, models } from "mongoose";

const communitySchema = new Schema({
    id: {
        type: String, required: true
    },
    username: {
        type: String,
        required: [true, "username is required!"],
        unique: true
    },
    name: {
        type: String, required: true
    },
    bio: { type: String },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    threads: [{
        type: Schema.Types.ObjectId,
        ref: 'Thread'
    }],
    members: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    image: { type: String },
});

const Community = models.Community || model("Community", communitySchema);
export default Community;
