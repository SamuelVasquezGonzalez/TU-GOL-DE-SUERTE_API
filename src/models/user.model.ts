import mongoose, {model, Schema} from "mongoose";
import { IUser } from "@/contracts/interfaces/users.interface";

const UserSchema = new Schema<IUser>({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    identity: {type: mongoose.Schema.Types.Mixed, required: true},
    phone: {type: String, required: false},
    recover_code: {type: Number, required: true},
    created_at: {type: Date, default: new Date()},
    role: {type: String, required: true, enum: ["admin", "customer", "staff"]},
    avatar: {type: mongoose.Schema.Types.Mixed, required: false, default: null},
})

export const UserModel = model<IUser>("User", UserSchema);