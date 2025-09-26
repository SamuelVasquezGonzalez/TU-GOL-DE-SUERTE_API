import { GLOBAL_ENV } from '@/shared/contants';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { ResponseError } from './errors.util';

cloudinary.config({
    cloud_name: GLOBAL_ENV.CLOUD_NAME,
    api_key: GLOBAL_ENV.API_KEY_CLOUDINARY,
    api_secret: GLOBAL_ENV.API_SECRET_CLOUDINARY
});

export const upload_image = async ({image}: {image: Express.Multer.File}): Promise<UploadApiResponse> => {
    try {
        if(!image) throw new ResponseError(400, "No se proporcionó una imagen");

        const {buffer, mimetype} = image;

        const base64_image = buffer.toString("base64");
        const base64_image_url = `data:${mimetype};base64,${base64_image}`;

        const result = await cloudinary.uploader.upload(base64_image_url, {
            transformation: [
                {width: 150, height: 150, crop: "fit"},
                {quality: 80},
                {fetch_format: "webp"}
            ]
        });

        if(!result) throw new ResponseError(500, "Error al subir la imagen");

        return result;
    } catch (error) {
        if(error instanceof ResponseError) throw error;
        throw new ResponseError(500, "Error al subir la imagen");
    }
}

export const delete_image = async ({public_id}: {public_id: string}) => {
    try {
        const result = await cloudinary.uploader.destroy(public_id);
        if(!result) throw new ResponseError(500, "Error al eliminar la imagen");
    } catch (error) {
        if(error instanceof ResponseError) throw error;
        throw new ResponseError(500, "Error al eliminar la imagen");
    }
}

