import { MediaType } from "./global.type";

export type UserRole = "admin" | "staff" | "customer";
export type UserIdentity = {
    type_document: "CC" | "CE" | "TI" | "PP" | "NIT";
    number_document: string;
}

export type UserTokenPayload = {
    _id: string;
    avatar?: MediaType;
    role: UserRole;
}