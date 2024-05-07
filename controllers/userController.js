// Importar modelo de user y helpers
import userModel from "../models/User.js";
import validate from "../helpers/validate.js";
import * as jwt from "../helpers/jwt.js";
import generatePassword from "../helpers/passGenerator.js";

// importar modulos
import bcrypt from 'bcrypt';
import fs from 'node:fs';
import path from "node:path";

// Accion de prueba
const test = (req, res) => {
    return res.status(200).send({
        status: 'Success',
        message: 'Accion de prueba del controlador user'
    });
}


// Registro de usuario
const register = async (req, res) => {

    // Obtener datos por el body
    let user = req.body;

    // comprobar que llegan bien
    if(!user || user.length == 0) return res.status(400).send({
        status: 'Error',
        message: 'Error al obtener datos del body'
    });

    // validar datos
    if(!validate.validateUser(user)) return res.status(400).send({
        status: 'Error',
        message: 'Faltan datos por enviar o hay algun error en algun campo'
    })

    // Control de usuarios duplicados
    const userExists = await userModel.find({$or: [{nick: user.nick}, {email: user.email}]}).exec()
        .then(result => {
            return result
        })
        .catch(error => {
            res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la consulta de busqueda de usuario duplicado'
            });
        });
    
    if(userExists.length > 0) return res.status(400).send({
        status: 'Error',
        message: 'El usuario ya existe'
    });

    // cifrar contraseña
    const cifresPass = await bcrypt.hash(user.password, 10)
        .then(result => {
            return result;
        })
        .catch(error => {
            res.status(400).send({
                status: 'Error',
                message: 'Error al encriptar la contraseña'
            });
        })
    
    user.password = cifresPass;

    // guardar usuario en DB
    userModel.create(user)
        .then(userStored => {
            if(!userStored || userStored.length == 0) return res.status(400).send({
                status: 'Error',
                message: 'No se pudo registrar el usuario, intentelo denuevo'
            })

            // limpiar datos a mostrar
            let userCreated = userStored.toObject();

            delete userCreated.password;
            delete userCreated.created_at;
            delete userCreated.role;

            return res.status(200).send({
                status: 'Success',
                message: 'Usuario registrado con exito',
                userCreated
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al intentar registrar al usuario'
            });
        });

}

// Login usuario
const login = async (req, res) => {

    // Obtener datos del body
    const user = req.body;

    // validar datos del body

    if(!user.username || !user.password) return res.status(400).send({
        status: 'Error',
        message: 'Faltan datos por enviar'
    });

    validate.validateLogin(user);

    // hacer un find y buscar al usuario
    userModel.findOne({$or: [{nick: user.username}, {email: user.username}]}).select({__v: 0}).exec()
        .then(result => {
            if(!result || result.length == 0){
                return res.status(404).send({
                    status: 'Error',
                    message: 'Usuario no existe'
                });
            }

            // si el usuario existe decodificar la contraseña y comparar
            const match = bcrypt.compareSync(user.password, result.password);

            if(match){
                // generar token jwt
                const token = jwt.createToken(result);

                // Limpiar campos del usuario
                const userLogged = result.toObject();

                delete userLogged.password;
                delete userLogged.role;
                delete userLogged.created_at;

                // devolver respuesta con el token
                return res.status(200).send({
                    status: 'Success',
                    message: 'Usuario logeado corrctamente',
                    userLogged,
                    token
                });
            }

            return res.status(400).send({
                status: 'Error',
                message: 'Contraseña incorrecta'
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la busqueda del usuario'
            });
        });
}

// perfil de usuario
const profile = (req, res) => {

    // Obtener id por parametro, sino usar el del usuario identificado
    const id = req.params.id ? req.params.id : req.user.id;

    // hacer un findOneById y devolver la respuesta
    userModel.findById(id).select({__v: 0, password: 0, role: 0}).exec()
        .then(user => {
            if(!user || user.length == 0 ) return res.status(404).send({
                status: 'Error',
                message: 'Usuario no encontrado'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Usuario encontrado',
                user
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la busqueda'
            });
        });
}

// Actualizar usuario
const update = (req, res) => {

    // Recoger datos del usuario
    let userIdentity = req.user;

    // Recoger datos a actualizar
    let userToUpdate = req.body;

    // Comprobar si el usuario existe
    userModel.findById(userIdentity.id).exec()
        .then(async user => {
            // Si no existe devuelvo una respuesta
            if(!user || user.length == 0) return res.status(404).send({
                status: 'Error',
                message: 'Usuario no encontrado'
            });

            // Cifrar la contraseña si llega
            if(userToUpdate.password){
                const newPass = await bcrypt.hash(userToUpdate.password, 10)
                    .then(result => {
                        return result;
                    })
                    .catch(error => {
                        res.status(500).send({
                            status: 'Error',
                            message: 'Error al cifrar la contraseña'
                        });
                    });
                
                userToUpdate.password = newPass;
            }else{
                // Si no llega la borro
                delete userToUpdate.password;
            }

            // Buscar y actualizar usuario en DB
            userModel.findByIdAndUpdate(userIdentity.id, userToUpdate, {new: true}).exec()
                .then(updatedUser => {
                    if(!updatedUser || updatedUser.length == 0) return res.status(400).send({
                        status: 'Error',
                        message: 'No se pudo actualizar el usuario'
                    });

                    return res.status(200).send({
                        status: 'Success',
                        message: 'Usuario actualizado',
                        updatedUser
                    });
                })
                .catch(error => {
                    return res.status(500).send({
                        status: 'Error',
                        message: 'Error al ejecutar la actualizacion'
                    });
                })
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la busqueda del usuario'
            });
        });
}

// Subir imagen y asignarla al usuario
const uploadImage = (req, res) => {
    // Configuracion de subida (multer)

    // Recoger fichero de imagen y comprbar si existe
    if(!req.file) return res.status(404).send({
        status: 'Error',
        message: 'Debe seleccionar una imagen para subir'
    });

    const file = req.file;

    // Conseguir nombre del archivo
    const fileOriginalName = file.originalname;

    // Sacar la info del archivo (extension)
    const splitImageName = fileOriginalName.split('\.'); 
    const extension = splitImageName[splitImageName.length - 1].toLowerCase();

    // Comprobar extension, si no es correcta eliminar archivo del directorio
    if(!validate.validateImageExtension(extension)){

        // eliminar archivo del directorio
        const filePath = req.file.path;
        fs.unlinkSync(filePath);

        // Devolver error
        return res.status(400).send({
            status: 'Error',
            message: 'La extension del archivo es invalida, debe ser png, jpg, jpeg o gif',
        });
    } 

    // Si es correcto guardar imagen en DB
    // Obtener id del usuario identificado
    const userIdentity = req.user;
    const userId = userIdentity.id;

    // hacer un findByIdAndUpload pasando el parametro de image
    userModel.findByIdAndUpdate(userId, {image: file.filename}, {new: true}).select({_id: 0, nick: 1, image: 1}).exec()
        .then(userUpdated => {
            if(!userUpdated || userUpdated.length == 0) return res.status(404).send({
                status: 'Error',
                message: 'Usuario no encontrado'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Avatar subido con exito y asignado al usuario',
                userUpdated
            });
        })
        .catch(error => {

            // eliminar archivo del directorio
            const filePath = req.file.path;
            fs.unlinkSync(filePath);

            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la busqueda y actualizacion del usuario'
            })
        });
}

// Mostrar avatar del usuario
const showAvatar = (req, res) => {
    // sacar el parametro de la url
    const userId = req.params.id ? req.params.id : req.user.id;

    // hacer un findById
    userModel.findById(userId).select({_id: 0, image: 1}).exec()
        .then(user => {

            if(!user || user.length == 0) return res.status(404).send({
                status: 'Error',
                message: 'Usuario no encontrado'
            });

            // montar el path completo de la imagen
            const fileName = user.image;
            const filePath = process.env.RAILWAY_VOLUME_MOUNT_PATH.concat(fileName);

            // Comprbar que existe el fichero
            fs.stat(filePath, (error, exists) => {
                if(error || !exists) return res.status(404).send({
                    status: 'Error',
                    message: 'El archivo no existe'
                });

                 // devolver el fichero
                return res.sendFile(path.resolve(filePath));
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la bisqueda del usuario'
            });
        });
}

// Listar usuarios
const listUsers = (req, res) => {

    // Obtener la page por parametro
    const page = req.params.page ? req.params.page : 1;

    // Configurar el paginate

    const itemsPerPage = 10;

    const customLabels = {
        docs: 'users',
        limit: 'itemsPerPage',
        totalDocs: 'total',
        totalPages: 'pages'
    }

    const options = {
        select: {password: 0, __v: 0, role: 0},
        sort: {_id: 1},
        page,
        limit: itemsPerPage,
        customLabels
    }

    // hacer un paginate
    userModel.paginate({}, options)
        .then(users => {
            if(!users || users.length == 0) return res.status(404).send({
                status: 'Error',
                message: 'Usuarios no encontrados'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Listado de usuarios',
                users
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la busqueda'
            });
        });
}



// Acciones de administrador

// Cambiar role a usuario
const roleChange = (req, res) => {
    // Validar si el usuario identificado es admin
    validate.validateAdmin(req.user, res);

    // Obtener id por parametro
    if(!req.params.id) return res.status(400).send({
        status: 'Error',
        message: 'Debe mandar un id por parametro'
    });

    const userId = req.params.id;

    // hacer un findById
    userModel.findById(userId).exec()
        .then(user => {
            if(!user || user.length == 0) return res.status(404).send({
                status: 'Error',
                message: 'Usuario no encontrado'
            });

            // obtener el role
            // Si el role es usuario cambiarlo a admin y vice versa
            const newRole = user.role == 'role-user' ? 'role-admin' : 'role-user';


            // hacer un findByIdAndUpdate
            userModel.findByIdAndUpdate(user._id, {role: newRole}, {new: true}).exec()
                .then(userUpdated => {
                    if(!userUpdated || userUpdated.length == 0) return res.status(400).send({
                        status: 'Error',
                        message: 'El usuario no pudo ser actualizado'
                    });

                    return res.status(200).send({
                        status: 'Success',
                        message: 'Role del usuario cambiado exitosamente',
                        userUpdated
                    });
                })
                .catch(error => {
                    return res.status(500).send({
                        status: 'Error',
                        message: 'Error al ejecutar la actualizacion'
                    });
                });

        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la busqueda del usuario'
            });
        })
}

// Cambiar password de un usuario
const passwordChange = async (req, res) => {
    // Validar si el usuario identificado es admin
    validate.validateAdmin(req.user, res);

    // Obtener id por parametro
    if(!req.params.id) return res.status(400).send({
        status: 'Error',
        message: 'Debe mandar un id por parametro'
    });

    const userId = req.params.id;

    let newPass;

    // generar nueva password
    if(!req.body.password) {
        newPass = generatePassword();
    }else{
        newPass = req.body.password;
    }

    // encriptar nueva password
    const encriptedPass = await bcrypt.hash(newPass, 10)
        .then(pass => {
            if(!pass) return res.status(500).send({
                status: 'Error',
                message: 'No se pudo encriptar la contraseña'
            });

            return pass;
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al intentar encriptar la contraseña'
            });
        });

    // hacer un findBydIDAndUpdate
    userModel.findByIdAndUpdate(userId, {password: encriptedPass}, {new: true}).select({__v: 0, }).exec()
        .then(userUpdated => {
            if(!userUpdated || userUpdated.length == 0) return res.status(404).send({
                status: 'Error',
                message: 'No se encontro el usuario a actualizar'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Contraseña cambiada con exito',
                userUpdated,
                newPass
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al intentar actualizar el usuario'
            });
        });
}


// Exportar acciones
export {
    test,
    register,
    login,
    profile,
    update,
    uploadImage,
    showAvatar,
    listUsers,
    roleChange,
    passwordChange
}