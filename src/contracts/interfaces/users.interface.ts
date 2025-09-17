import { Document } from "mongoose";
import type { UserIdentity, UserRole } from "../types/user.type";
import { MediaType } from "../types/global.type";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    identity: UserIdentity;
    phone?: string;

    recover_code: number;
    
    role: UserRole
    pin?: number;
    
    created_at: Date;

    avatar?: MediaType
    
}

export interface UserPayload {
    name: string;
    email: string;
    identity: UserIdentity;
    phone: string;
    role: UserRole;
    password?: string;
    pin?: boolean;
    avatar?: Express.Multer.File;
}
