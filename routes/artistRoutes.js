// Importar controller y dependencias
import * as artistController from '../controllers/artistController.js';
import auth from '../middlewares/auth.js';
import multer from 'multer';

// Importar Router
import { Router } from 'express';

// crear instancia de router
const artistRouter = Router();

// Configuracion de subida multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/artistAvatar/');
    },
    filename: (req, file, cb) => {
        cb(null, 'artistAvatar-' + Date.now() + '-' + file.originalname);
    }
});

const uploads = multer({storage});

// Definir rutas
artistRouter.get('/test', artistController.test);

artistRouter.post('/save', auth, artistController.save);
artistRouter.get('/one/:id?', auth, artistController.getOne);
artistRouter.get('/list', auth, artistController.list);
artistRouter.put('/update/:id?', auth, artistController.update);
artistRouter.delete('/delete/:id?', auth, artistController.deleteArtist);
artistRouter.post('/upload/:id?', [auth, uploads.single('file0')], artistController.uploadImage);
artistRouter.get('/avatar/:id?', artistController.showAvatar);

// Exportar router
export default artistRouter;