// Importar modulos
import validate from "../helpers/validate.js";
import artistModel from "../models/Artist.js";
import albumModel from "../models/Album.js";
import songModel from "../models/Song.js";
import fs from 'node:fs';
import path from "node:path";

// Accion de prueba
const test = (req, res) => {
    return res.status(200).send({
        status: 'Success',
        message: 'Accion de prueba del controlador artist'
    });
}


// Guardar artista en DB
const save = async (req, res) => {

    // Verificar que el usuario identificado sea admin
    if(!validate.validateAdmin(req.user)) return res.status(400).send({
        status: 'Unathorized',
        message: 'Debes ser administrador para ejecutar esta acción'
    });

    // Recoger datos del body
    const artist = req.body;

    // validar datos del artista
    if(!validate.validateArtist(artist)) return res.status(400).send({
        status: 'Error',
        message: 'Debe ingresar al menos el campo name con caracteres alfanumericos'
    });

    // Control de artistas duplicados
    const artistExists = await artistModel.find({name: artist.name}).exec()
        .then(result => {
            return result;
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la busqueda de artistas duplicados'
            });
        });
    
    if(artistExists.length > 0) return res.status(400).send({
        status: 'Error',
        message: 'El artista con ese nombre ya existe',
        artist: artistExists
    });

    // Guardarlo objeto en DB
    await artistModel.create(artist)
        .then(storedArtist => {
            if(!storedArtist || storedArtist.length == 0) return res.status(400).send({
                status: 'Error',
                message: 'No se pudo guardar el artista en la base de datos'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Artista guardado con exito',
                storedArtist
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la creación del artista en la DB'
            });
        });
}

// Sacar un artista por id
const getOne = (req, res) => {

    // Obtener id por parametro
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe ingresar un id por la url'
    });

    const artistId = req.params.id;

    // hacer un findById
    artistModel.findById(artistId).exec()
        .then(artist => {
            if(!artist || artist.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'Usuario no encontrado'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Usuario encontrado con exito',
                artist
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la busqueda del artista'
            });
        });
}

// Listar artistas
const list = (req, res) => {

    // Obtener la page por parametro
    const page = req.params.page ? req.params.page : 1;

    // Configurar el paginate
    const itemsPerPage = 10;

    const customLabels = {
        docs: 'artists',
        limit: 'itemsPerPage',
        totalDocs: 'total',
        totalPages: 'pages'
    }

    const options = {
        select: { __v: 0},
        sort: {_id: 1},
        page,
        limit: itemsPerPage,
        customLabels
    }

    // Hacer un paginate
    artistModel.paginate({}, options)
        .then(artists => {
            if(!artists || artists.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'Artistas no encontrados'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Listado de artistas',
                artists
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la busqueda de usuarios'
            });
        });
}

// Editar un artista
const update = (req, res) => {

    // Verificar que el usuario identificado sea admin
    if(!validate.validateAdmin(req.user)) return res.status(400).send({
        status: 'Unathorized',
        message: 'Debes ser administrador para ejecutar esta acción'
    });

    // Obtener id del artista por parametro
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe ingresar un id por la url'
    });
    const artistId = req.params.id;

    // Obtener datos del body
    const userToUpdate = req.body;

    // hacer un findByIdAndUpdate
    artistModel.findByIdAndUpdate(artistId, userToUpdate, {new: true}).exec()
        .then(updatedArtist => {
            if(!updatedArtist || updatedArtist.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'Artista no encontrado, el artista no pudo ser actualizado'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Artista actualizado con exito',
                updatedArtist
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al ejecutar la actualizacion del artista'
            });
        });
}

// Eliminar artista
const deleteArtist = (req, res) => {
    // Verificar que el usuario identificado sea admin
    if(!validate.validateAdmin(req.user)) return res.status(400).send({
        status: 'Unathorized',
        message: 'Debes ser administrador para ejecutar esta acción'
    });

    // Obtener id por parametro
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe ingresar un id por la url'
    });

    const artistId = req.params.id;


    // hacer un find

    artistModel.findByIdAndDelete(artistId).exec()
        .then(async artist => {
            try{
                const albums = await albumModel.find({artist: artist._id}).exec();
                return [artist, albums];
            }catch(exception){
                return [artist, []];
            }
        })
        .then(async data => {

            const albumsId = data[1].map(album => album._id);

            try{
                const albums = await albumModel.deleteMany({artist: data[0]._id}).exec()
                const songs = await songModel.deleteMany({album: {$in: albumsId}}).exec();
                return [data[0], albums, songs];
            }catch(exception){
                return [...data, []]
            }
        })
        .then(data => {
            return res.status(200).send({
                status: 'Success',
                message: 'Artista eliminado con exito',
                deletedArtist: data[0],
                deletedAlbums: data[1],
                deletedSongs: data[2]
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al intentar eliminar al artista'
            });
        });

}

// Subida de imagenes
const uploadImage = (req, res) => {
    // Verificar que el usuario identificado es administrador
    if(!validate.validateAdmin(req.user)) return res.status(400).send({
        status: 'Unauthorized',
        message: 'Debes ser administrador para ejecutar esta acción'
    });

    // verificar que llegue id por parametro
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debes indicar el id del artista por la url'
    });

    const artistId = req.params.id;

    // Recoger fichero de file y verificar si existe
    if(!req.file) return res.status(404).send({
        status: 'Error',
        message: 'Debe seleccionar una imagen para subir'
    });

    const file = req.file;

    // Obtener el nombre del fichero
    const filename = file.filename;

    // Obtener extension del archivo
    const splitName = filename.split('\.');
    const extension = splitName[splitName.length - 1].toLowerCase();

    // Si la extension no corresponde, eliminar el archivo
    if(!validate.validateImageExtension(extension)){

        // Eliminar archivo
        const filePath = './uploads/artistAvatar/' + filename;
        fs.unlinkSync(filePath);

        return res.status(400).send({
            status: 'Error',
            message: 'El archivo debe tener extension png, jpg, jpeg o gif'
        });
    }

    artistModel.findByIdAndUpdate(artistId, {image: filename}, {new: true}).exec()
        .then(artistUpdated => {
            if(!artistUpdated || artistUpdated.length == 0){
                // Eliminar archivo
                const filePath = './uploads/artistAvatar/' + filename;
                fs.unlinkSync(filePath);

                return res.status(404).send({
                    status: 'Not Found',
                    message: 'Artista no encontrado'
                });
            }

            return res.status(200).send({
                status: 'Success',
                message: 'Imagen subida con exito y asignada al artista',
                artistUpdated
            });
        })
        .catch(error => {
            // Eliminar archivo
            const filePath = './uploads/artistAvatar/' + filename;
            fs.unlinkSync(filePath);

            return res.status(500).send({
                status: 'Error',
                message: 'Error al intentar actualizar el usuario'
            });
        });
}

// Mostrar imagen
const showAvatar = (req, res) => {
    // Verificar que llega el id por parametro
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debes ingresar el id del artista por la url'
    });

    // Obtener id de la url
    const artistId = req.params.id;

    // Hacer un findById
    artistModel.findById(artistId).exec()
        .then(artists => {
            if(!artists || artists.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'Artista no encontrado'
            });

            // obtener el nombre de la imagen del avatar del artista
            const filename = artists.image;

            // completar el path
            const filePath = './uploads/artistAvatar/' + filename;

            // comprobar que existe el path
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
                message: 'Error al ejecutar la busqueda del artista'
            });
        });
}

// Exportar acciones
export {
    test,
    save,
    getOne,
    list,
    update,
    deleteArtist,
    uploadImage,
    showAvatar
}