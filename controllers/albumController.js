// Importar modelo Album, modulos y dependencias
import albumModel from "../models/Album.js";
import artistModel from '../models/Artist.js'
import songModel from '../models/Song.js';
import validate from '../helpers/validate.js';

// Accion de prueba
const test = (req, res) => {
    return res.status(200).send({
        status: 'Success',
        message: 'Accion de prueba del controlador album'
    });
}

// mostrar un album por id
const showById = async (req, res) => {
    // Verificar y Obtener id del album por parametro
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe indicar el id del album por la url'
    });

    const albumId = req.params.id;

    // hacer un findOneById
    albumModel.findById(albumId).exec()
        .then(album => {
            if(!album || album.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'Album no encontrado'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Album encontrado con exito',
                album
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al buscar el album'
            });
        })
}

// Mostrar todos los albums de un artista
const showAlbums = async (req, res) => {
    // Verificar y obtener id del artista por parametro
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe indicar el id del artista por la url'
    });

    const artistId = req.params.id;

    // Verificar que el artista existe
    await artistModel.findById(artistId).exec()
        .then(async artist => {
            if(!artist || artist.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'Artista no encontrado'
            });

            await albumModel.find({artist: artistId}).exec()
                .then(albums => {
                    if(!albums || albums.length == 0) return res.status(200).send({
                        status: 'Success',
                        message: 'El artista no tiene albums'
                    });

                    return res.status(200).send({
                        status: 'Success',
                        message: 'Albums del artista',
                        albums
                    });
                })
                .catch(error => {
                    return res.status(500).send({
                        status: 'Error',
                        message: 'Error al buscar albums del artista'
                    });
                });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al buscar al artista'
            });
        });
}



// Acciones de administrador

// Crear album
const save = async (req, res) => {

    // Verificar que el usuario identificado sea admin
    if(!validate.validateAdmin(req.user)) return res.status(400).send({
        status: 'Unauthorized',
        message: 'Debe ser administrador para ejecutar esta acción'
    });

    // Obtener el id del artista por url
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe indicar el id del artista por la url'
    });

    const artistId = req.params.id;

    // Verificar existencia del artista
    await artistModel.findById(artistId).exec()
        .then(artist => {
            if(!artist || artist.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'Artista no encontrado'
            });

            // Si artsta existe, recibir datos del body
            let albumData = req.body;

            // Verificar que llegan bien los datos del body
            if(!validate.validateAlbum(albumData)) return res.status(400).send({
                status: 'Error',
                message: 'Faltan datos por enviar'
            });

            // asignar id del artista
            albumData.artist = artist._id;

            // Control de album duplicado
            albumModel.find({$and: [{title: albumData.title}, {artist: albumData.artist}]}).exec()
                .then(album => {
                    if(album.length > 0) return res.status(400).send({
                        status: 'Already exists',
                        message: 'El album ya existe',
                        album
                    });

                    // guardar en DB
                    albumModel.create(albumData)
                    .then(createdAlbum => {
                        if(!createdAlbum || createdAlbum.length == 0) return res.status(400).send({
                            status: 'Error',
                            message: 'No se pudo guardar el album'
                        });

                        return res.status(200).send({
                            status: 'Success',
                            message: 'Album guardado con exito',
                            createdAlbum
                        });
                    })
                    .catch(error => {
                        return res.status(500).send({
                            status: 'Error',
                            message: 'Error al guardar el album'
                        });
                    });
                })
                .catch(error => {
                    return res.status(500).send({
                        status: 'Error',
                        message: 'Error al buscar si el album existe'
                    });
                });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al buscar el artista indicado'
            });
        });

}

// Actualizar album
const update = (req, res) => {

    // verificar que el usuario identificado sea admin
    if(!validate.validateAdmin(req.user)) return res.status(400).send({
        status: 'Unauthorized',
        message: 'Debe ser administrador para ejecutar esta acción'
    });

    // verificar y obtener id del album por parametro
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe indicar el id del album por la url'
    });

    const albumId = req.params.id;

    // verificar y obtener datos del body
    const albumToUpdate = req.body;

    // hacer un findByIdAndUpdate
    albumModel.findByIdAndUpdate(albumId, albumToUpdate, {new: true}).exec()
        .then(updatedAlbum => {
            if(!updatedAlbum || updatedAlbum.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'Album no encontrado'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Album actualizado con exito',
                updatedAlbum
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al intentar actualizar el album'
            });
        });
}

const deleteAlbum = (req, res) => {
    // Validar user admin
    if(!validate.validateAdmin(req.user)) return res.status(400).send({
        status: 'Unathorized',
        message: 'Debe ser administrador para ejecutar esta acción'
    });

    // Obtener id del album por parametro
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe indicar el id del album por la url'
    });

    const albumId = req.params.id;

    // hacer un findByIdAndDelete
    albumModel.findByIdAndDelete(albumId).exec()
        .then(async deletedAlbum => {
            try{
                const deletedSongs = await songModel.deleteMany({album: deletedAlbum._id}).exec();
                return res.status(200).send({
                    status: 'Success',
                    message: 'Album eliminado con exito',
                    deletedAlbum,
                    deletedSongs
                });
            }catch(exception){
                return res.status(500).send({
                    status: 'Error',
                    message: 'Error al intentar eliminar las canciones'
                });
            }
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al intentar eliminar el album'
            });
        })
}

// Exportar acciones
export {
    test,
    save,
    showById,
    showAlbums,
    update,
    deleteAlbum
}