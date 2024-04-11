// Importar controller
import * as albumController from '../controllers/albumController.js';

// Importar Router de express y modulos
import { Router } from "express";
import auth from '../middlewares/auth.js';
import multer from 'multer';

// Configuracion de subida multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/album/');
    },
    filename: (req, file, cb) => {
        cb(null, 'avatar-' + Date.now() + '-' + file.originalname);
    }
});

const uploads = multer({storage});

// crear instancia de router
const albumRouter = Router();

// definir rutas
albumRouter.get('/test', albumController.test);
albumRouter.post('/save/:id?', auth, albumController.save);
albumRouter.get('/one/:id?', auth, albumController.showById);
albumRouter.get('/albums/:id?', auth, albumController.showAlbums);
albumRouter.put('/update/:id?', auth, albumController.update);
albumRouter.delete('/delete/:id?', auth, albumController.deleteAlbum);

// Exportar rutas
export default albumRouter;
