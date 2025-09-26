import dotenv from "dotenv";
dotenv.config();

export const ALLOWED_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "https://tu-gol-de-suerte-react-app-j2bq-evubah8ev.vercel.app"];
export const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];

export const GLOBAL_ENV = {
    MONGODB_URI: process.env.MONGODB_URI as string,

    PORT: process.env.PORT as string,

    CLOUD_NAME: process.env.CLOUD_NAME as string,
    API_KEY_CLOUDINARY: process.env.API_KEY_CLOUDINARY as string,
    API_SECRET_CLOUDINARY: process.env.API_SECRET_CLOUDINARY as string,

    JWT_SECTRET: process.env.JWT_SECTRET as string,
    RESEND_API_KEY: process.env.RESEND_API_KEY as string,

    FRONT_DOMAIN: process.env.FRONT_DOMAIN as string,
};


export const DEFAULT_PROFILE_AVATAR = {
    url: "https://res.cloudinary.com/dym9kg3vx/image/upload/v1725175200/default_profile_avatar.png",
    public_id: "",
}