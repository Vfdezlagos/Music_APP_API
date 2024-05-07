// Importar conexion a DB
import connection from "./database/connection.js";

// Importar dependencias
import express from "express";
import cors from "cors";

// Importar routers
import userRouter from "./routes/userRoutes.js";
import albumRouter from "./routes/albumRoutes.js";
import artistRouter from "./routes/artistRoutes.js";
import songRouter from "./routes/songRoutes.js";

// Mensaje bienvenida
console.log('Running API-APP-MUSICAL with NODEJS')

// Ejecutar conexion a DB
connection();

// Crear servidor node
const app = express();
const port = process.env.PORT;

// configurar cors
app.use(cors());

// convertir datos del body a json
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// cargar config de rutas
app.use('/api/user', userRouter);
app.use('/api/artist', artistRouter)
app.use('/api/album', albumRouter)
app.use('/api/song', songRouter)

// Ruta de prueba
app.get('/test', (req, res) => {
    return res.status(200).json({
        status: 'Success',
        message: 'Ruta de prueba de servidor de node app musical'
    });
});

// Arrancar servidor (poner a escuchar peticiones HTTP)
app.listen(port, () => {
    console.log(`Server Running at port ${port}`);
});