import { GLOBAL_ENV } from "@/shared/contants";
import { ResponseError } from "@/utils/errors.util";
import mongoose from "mongoose";    

export class InitiConnection {
    private static instance: InitiConnection;
    private constructor() {
        this.connect();
    }

    public static getInstance(): InitiConnection {
        if (!InitiConnection.instance) {
            InitiConnection.instance = new InitiConnection();
        }
        return InitiConnection.instance;
    }

    private async connect() {

        if(!GLOBAL_ENV.MONGODB_URI) {
            throw new ResponseError(500, "MONGODB_URI is not defined");
        }

        try {
            const db = await mongoose.connect(
                GLOBAL_ENV.MONGODB_URI,
                {
                    dbName: "tu_gol_de_suerte",
                    // Connection Pooling Configuration
                    maxPoolSize: 10, // Máximo de conexiones simultáneas
                    minPoolSize: 2, // Mínimo de conexiones mantenidas
                    serverSelectionTimeoutMS: 5000, // Timeout para seleccionar servidor
                    socketTimeoutMS: 45000, // Timeout para operaciones
                    connectTimeoutMS: 10000, // Timeout para conectar
                    heartbeatFrequencyMS: 10000, // Frecuencia de heartbeat
                }
            );

            if(db.connection.readyState === 1) {
                console.log("Connected to MongoDB");
                console.log(`MongoDB Pool: min=${2}, max=${10}`);
            }

        } catch (error) {
            if(error instanceof ResponseError) throw error;
            throw new Error("Error connecting to MongoDB");
        }
    }

    public async disconnect() {
        await mongoose.disconnect();
    }
    
}