// importar modulos
import jwt from 'jwt-simple';
import moment from 'moment';

// Importar clave secreta
import { secret } from '../helpers/jwt.js';

// crear middleware
const auth = (req, res, next) => {
    // Comprobar si me llega la cabecera auth
    if(!req.headers.authorization) return res.status(403).send({
        status: 'Error',
        message: 'La peticion no tiene la cabecera de autenticación'
    });

    // Limpiar token
    let token = req.headers.authorization.replaceAll(/['"]+/g, '');

    try{
        // decodificar token
        let payload = jwt.decode(token, secret);

        // Comprobar la expiración del token
        if(moment().unix() >= payload.exp) return res.status(401).send({
            status: 'Error',
            message: 'Token expirado'
        });

        // Agregar los datos de usuario a la request
        req.user = payload;
    
    }catch(exception){
        return res.status(404).send({
            status: 'Error',
            message: 'Token Invalido',
            exception
        });
    }

    // Pasar a la ejecución de la accion
    next();
}

export default auth;
