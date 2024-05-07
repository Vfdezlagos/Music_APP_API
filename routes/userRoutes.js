// importar controlador
import * as userController from '../controllers/userController.js'

// Importar dependencias
import { Router } from 'express'
import auth from '../middlewares/auth.js';
import multer from 'multer';

// crear router
const userRouter = Router();

// Configuracion de subida multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.RAILWAY_VOLUME_MOUNT_PATH);
    },
    filename: (req, file, cb) => {
        cb(null, 'avatar-' + Date.now() + '-' + file.originalname);
    }
});

const uploads = multer({storage});

// definir Rutas
userRouter.get('/test', userController.test);

userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);
userRouter.get('/profile/:id?', auth, userController.profile);
userRouter.put('/update', auth, userController.update);
userRouter.post('/upload', [ auth, uploads.single('file0')], userController.uploadImage);
userRouter.get('/avatar/:id?', auth, userController.showAvatar);
userRouter.get('/list/:page?', auth, userController.listUsers);
userRouter.delete('/deleteavatar/:id?', auth, userController.deleteAvatar);

// Rutas para admin
userRouter.put('/role_change/:id', auth, userController.roleChange);
userRouter.put('/password_change/:id', auth, userController.passwordChange);


// exportar router
export default userRouter;