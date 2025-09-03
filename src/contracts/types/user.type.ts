export type UserRole = "admin" | "customer";
export type UserIdentity = {
    type_document: "CC" | "CE" | "TI" | "PP" | "NIT";
    number_document: string;
}