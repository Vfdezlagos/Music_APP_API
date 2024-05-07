// importar mongoose
import mongoose from "mongoose";

// Metodod e conexion
const connection = async() => {
    try{
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to DB app_musica')
    }catch(exception){
        console.log(exception)
        throw new Error('No se ha establecido la conexion a la DB')
    }
}

// exportar conexion
export default connection;