// Importar controller y modulos
import * as songController from '../controllers/songController.js';
import auth from '../middlewares/auth.js';
import multer from 'multer';

// Importar Router
import { Router } from 'express';

// Configuracion de subida multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/songs/');
    },
    filename: (req, file, cb) => {
        cb(null, 'song-' + Date.now() + '-' + file.originalname);
    }
});

const uploads = multer({storage});

// crear instancia de router
const songRouter = Router();

// Definir rutas
songRouter.get('/test', songController.test);
songRouter.post('/save/:id?', [auth, uploads.single('file0')], songController.save);
songRouter.get('/one/:id?', auth, songController.showSong);
songRouter.get('/list/:id?', auth, songController.list);
songRouter.put('/update/:id?', [auth, uploads.single('file0')], songController.update);
songRouter.delete('/delete/:id?', auth, songController.deleteSong);

// Exportar router
export default songRouter;