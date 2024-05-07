// Importar dependencias
import jwt from 'jwt-simple';
import moment from 'moment';

// Clave secreta
const secret = process.env.JWT_KEY;

// Crear funcion para generar tokens
const createToken = (user) => {

    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        image: user.image,
        iat: moment().unix(),
        exp: moment().add(15, "days").unix()
    };

    // Devolver el token
    return jwt.encode(payload, secret);
}

// Exportar modulo
export {
    secret, 
    createToken
}