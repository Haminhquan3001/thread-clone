import { Schema, model, models } from "mongoose";

const userSchema = new Schema({
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
    threads: [{
        type: Schema.Types.ObjectId,
        ref: 'Thread'
    }],
    onboarded: { type: Boolean, default: false },
    communities: [{
        type: Schema.Types.ObjectId,
        ref: 'Community'
    }],
    image: { type: String },
});

const User = models.User || model("User", userSchema);
export default User;
