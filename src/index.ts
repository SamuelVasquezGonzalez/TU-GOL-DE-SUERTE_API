import { InitiConnection } from "./config/db_connection";
import { connectRedis } from "./config/redis.config";
import { createMongoDBIndexes } from "./config/mongodb-indexes";
import { queueProcessor } from "./services/queue-processor.service";
import { http_server, configureSocketIoRedisAdapter } from "./server_config";
import { GLOBAL_ENV } from "./shared/contants";
import os from "os";

const reset = "\x1b[0m";
const blue = "\x1b[34m";

async function main() {
    InitiConnection.getInstance();
    await connectRedis(); // Conectar a Redis (opcional, no crítico)
    
    // Configurar Redis adapter para Socket.io (después de conectar Redis)
    await configureSocketIoRedisAdapter();
    
    // Inicializar procesadores de queue
    queueProcessor.initializeProcessors();
    
    // Crear índices de MongoDB (solo una vez, o cuando se necesite)
    // Comentar esta línea después de la primera ejecución si quieres
    // ejecutarlo manualmente cuando sea necesario
    if (process.env.CREATE_INDEXES === 'true') {
        await createMongoDBIndexes();
    }

    const networkInterfaces = os.networkInterfaces();
    const networkInterface = networkInterfaces.en0;
    const ipAddress = networkInterface?.find((iface) => iface.family === "IPv4")?.address || "127.0.0.1";

    http_server.listen(GLOBAL_ENV.PORT, () => {
        console.log("#===============================================#")
        console.log(`   TU_GOL_DE_SUERTE_API is running`);
        console.log(`   > [LOCAL]: ${blue}http://localhost:${GLOBAL_ENV.PORT}${reset}`);
        console.log(`   > [LOCAL NETWORK]: ${blue}http://${ipAddress}:${GLOBAL_ENV.PORT}${reset}`);
        console.log(`               
                .#@@@@@@@@*:-+#@@+      
              -@@@@@@@@@@@@@@@@-        
            .#@@@@@#:..-@@@@#.          
           .@@@@@#       @-             
           @@@@@=           .:=         
          +@@@@+          .:**=         
         .@@@@@          :****-         
         +@@@@+         .*****.         
         @@@@-          -****=          
         @@-           .*****.          
        .-    .       .*****:           
           .:*=.    .:*****:            
         .+*****+--*******.             
      .:****************:.              
    .-*=-....-+******-..`)
        console.log("#===============================================#")
    });
}

main();
