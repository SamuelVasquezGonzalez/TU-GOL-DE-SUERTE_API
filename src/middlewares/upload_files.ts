import multer from "multer";

export const upload_files = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 5, //
    },
});