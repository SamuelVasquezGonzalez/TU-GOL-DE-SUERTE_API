const mongoose = require('mongoose');

// Configuración de conexión a la base de datos
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tu-gol-de-suerte';

async function removePinIndex() {
    try {
        // Conectar a la base de datos
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener la colección de usuarios
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Listar todos los índices existentes
        console.log('📋 Índices existentes:');
        const indexes = await usersCollection.indexes();
        indexes.forEach((index, i) => {
            console.log(`${i + 1}. ${JSON.stringify(index)}`);
        });

        // Intentar eliminar el índice del PIN si existe
        try {
            const indexExists = indexes.some(index => 
                index.key && index.key.pin !== undefined
            );

            if (indexExists) {
                console.log('🔍 Encontrado índice del PIN, eliminando...');
                
                // Intentar eliminar por nombre del índice
                const pinIndex = indexes.find(index => 
                    index.key && index.key.pin !== undefined
                );
                
                if (pinIndex && pinIndex.name) {
                    await usersCollection.dropIndex(pinIndex.name);
                    console.log(`✅ Índice del PIN eliminado exitosamente: ${pinIndex.name}`);
                } else {
                    // Si no tiene nombre, intentar eliminar por la clave
                    await usersCollection.dropIndex({ pin: 1 });
                    console.log('✅ Índice del PIN eliminado exitosamente por clave');
                }
            } else {
                console.log('ℹ️ No se encontró ningún índice del PIN');
            }

        } catch (error) {
            if (error.code === 27 || error.message.includes('index not found')) {
                console.log('ℹ️ El índice del PIN no existe o ya fue eliminado');
            } else {
                console.error('❌ Error al eliminar el índice del PIN:', error.message);
            }
        }

        // Remover el campo pin de todos los documentos donde exista
        console.log('🧹 Limpiando campos PIN existentes de los documentos...');
        const updateResult = await usersCollection.updateMany(
            { pin: { $exists: true } },
            { $unset: { pin: "" } }
        );
        
        if (updateResult.modifiedCount > 0) {
            console.log(`✅ Eliminado campo PIN de ${updateResult.modifiedCount} documentos`);
        } else {
            console.log('ℹ️ No se encontraron documentos con campo PIN');
        }

        console.log('🎉 Limpieza completa del PIN realizada exitosamente');

    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        // Cerrar la conexión
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB');
    }
}

// Ejecutar el script
removePinIndex().catch(console.error);
