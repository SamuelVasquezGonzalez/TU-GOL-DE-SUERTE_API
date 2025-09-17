import { Request } from "express";
import { UserTokenPayload } from "./user.type";


export type MediaType = {
    url: string;
    public_id: string;
}


export interface RequestUser extends Request {
    user: UserTokenPayload;
}