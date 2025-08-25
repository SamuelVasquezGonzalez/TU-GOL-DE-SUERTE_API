import { InitiConnection } from "./config/db_connection";
import { app } from "./server_config";
import { GLOBAL_ENV } from "./shared/contants";
import os from "os";

const reset = "\x1b[0m";
const blue = "\x1b[34m";

function main() {
    InitiConnection.getInstance();

    const networkInterfaces = os.networkInterfaces();
    const networkInterface = networkInterfaces.en0;
    const ipAddress = networkInterface?.find((iface) => iface.family === "IPv4")?.address || "127.0.0.1";

    app.listen(GLOBAL_ENV.PORT, () => {
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
