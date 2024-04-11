// Imports
import songModel from "../models/Song.js";
import validate from "../helpers/validate.js";
import fs from "node:fs";
import path from "node:path";

// Accion de prueba
const test = (req, res) => {
    return res.status(200).send({
        status: 'Success',
        message: 'Accion de prueba del controlador song'
    });
}

// mostrar cancion
const showSong = (req, res) => {
    // verificar que llega el id por url y obtenerlo
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debes indicar el id de la cancion por la url'
    });

    const songId = req.params.id;

    // hacer un findById
    songModel.findById(songId).exec()
        .then(song => {
            if(!song || song.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'Cancion no encontrada'
            });
            
            // Obtener nombre de la cancion
            const fileName = song.file;

            // completar path
            const filePath = './uploads/songs/' + fileName;

            // verificar existencia del archivo
            fs.stat(filePath, (error, exists) => {
                if(error || !exists) return res.status(400).send({
                    status: 'Error',
                    message: 'EL archivo ya no existe en el sistema'
                });

                // mostrar archivo
                return res.sendFile(path.resolve(filePath));
            });

        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al buscar la cancion'
            });
        });
}

// Listar canciones de un album
const list = (req, res) => {
    // Verificar y obtener id del album por url
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe indicar el id del album por la url'
    });

    const albumId = req.params.id;

    // hacer un find
    songModel.find({album: albumId}).sort({track: 1}).exec()
        .then(songs => {
            if(!songs || songs.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'No se encontraron canciones'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Listado de canciones del album',
                songs
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al buscar las canciones del album'
            });
        });
}




// Metodos de Administrador

// guardar cancion
const save = (req, res) => {
    //Verificar si se sube el archivo y Obtener nombre del archivo de la cancion
    if(!req.file) return res.status(400).send({
        status: 'Error',
        message: 'Debes subir un archivo de audio'
    });

    const file = req.file;
    const filename = file.filename;

    // Verificar que el usuario identificado sea admin
    if(!validate.validateAdmin(req.user)) {
        // Eliminar fichero
        const filePath = './uploads/songs/' + filename;
        fs.unlinkSync(filePath);

        return res.status(400).send({
            status: 'Unauthorized',
            message: 'Debe ser administrador para ejecutar esta acción'
        });
    }

    // Verificar y Obtener id del album donde vamos a guardar la cancion por url
    if(!validate.validateIdByParam(req.params)) {
        // Eliminar fichero
        const filePath = './uploads/songs/' + filename;
        fs.unlinkSync(filePath);

        return res.status(400).send({
            status: 'Error',
            message: 'Debe indicar el id del album donde quiere guardar la cancion por la url'
        });
    }

    const albumId = req.params.id;

    // Obtener los datos de la cancion por el body
    const songData = req.body;


    // verificar los datos de la cancion por el body
    if(!validate.validateSong(songData)) {
        // Eliminar fichero
        const filePath = './uploads/songs/' + filename;
        fs.unlinkSync(filePath);

        return res.status(400).send({
            status: 'Error',
            message: 'Faltan datos o archivo por enviar'
        });
    }


    // Obtener y verificar extension del archivo
    const splittedFileName = filename.split('\.');
    const extension = splittedFileName[splittedFileName.length - 1].toLowerCase();

    if(!validate.validateSongExtension(extension)) {

        // Eliminar fichero
        const filePath = './uploads/songs/' + filename;
        fs.unlinkSync(filePath);

        return res.status(400).send({
        status: 'Error',
        message: 'El archivo debe tener extension mp3, wav, ogg o aac',
        extension
        });
    }

    // crear objeto de Song a guardar
    const song = {album: albumId, file: filename, ...songData};

    // Control de duplicados
    songModel.find({$and: [{album: song.album}, {name: song.name}, {track: song.track}]}).exec()
        .then(songExists => {
            if(songExists && songExists.length > 0) {

                 // Eliminar fichero
                const filePath = './uploads/songs/' + filename;
                fs.unlinkSync(filePath);

                return res.status(400).send({
                    status: 'Error',
                    message: 'La cancion ya existe'
                });
            }

            // guardar en DB
            songModel.create(song)
            .then(createdSong => {
                if(!createdSong || createdSong.length == 0) {
                    // Eliminar fichero
                    const filePath = './uploads/songs/' + filename;
                    fs.unlinkSync(filePath);

                    return res.status(400).send({
                        status:'Error',
                        message: 'No se pudo guardar la cancion en la DB'
                    });
                }

                return res.status(200).send({
                    status: 'Success',
                    message: 'Cancion guardada con exito',
                    createdSong
                });
            })
            .catch(error => {

                // Eliminar fichero
                const filePath = './uploads/songs/' + filename;
                fs.unlinkSync(filePath);

                return res.status(500).send({
                    status: 'Error',
                    message: 'Error al intentar guardar la cancion en la base de datos'
                });
            });
        })
        .catch(error => {
             // Eliminar fichero
            const filePath = './uploads/songs/' + filename;
            fs.unlinkSync(filePath);

            return res.status(500).send({
                status: 'Error',
                message: 'Error al buscar canciones duplicadas'
            });
        });
}

// Actualizar cancion
const update = (req, res) => {
    // Verificar si se sube el archivo de la cancion

    let file;
    let filename;

    if(req.file) {
        file = req.file;
        filename = file.filename;
    }
    

    // Verificar que el usuario identificado sea admin
    if(!validate.validateAdmin(req.user)) {
        if(req.file){
            // Eliminar fichero
            const filePath = './uploads/songs/' + filename;
            fs.unlinkSync(filePath);
        }

        return res.status(400).send({
            status: 'Unauthorized',
            message: 'Debe ser administrador para ejecutar esta acción'
        });
    }

    // Verificar y Obtener id de la cancion
    if(!validate.validateIdByParam(req.params)) {
        if(req.file){
            // Eliminar fichero
            const filePath = './uploads/songs/' + filename;
            fs.unlinkSync(filePath);
        }

        return res.status(400).send({
            status: 'Error',
            message: 'Debe indicar el id de la cancion por la url'
        });
    }

    const songId = req.params.id;

    // hacer un findById
    songModel.findById(songId).exec()
        .then( song => {
            if(!song || song.length == 0) {
                if(req.file){
                    // Eliminar fichero
                    const filePath = './uploads/songs/' + filename;
                    fs.unlinkSync(filePath);
                }

                return res.status(404).send({
                    status: 'Not Found',
                    message: 'Cancion no encontrada'
                });
            }
            
            const fileNameToDelete = song.file;

            // Obtener datos del body
            let songToUpdate = req.body;

            if(req.file){
                songToUpdate.file = filename;
            }


            songModel.findByIdAndUpdate(song._id, songToUpdate, {new: true}).exec()
                .then(updatedSong => {
                    if(!updatedSong || updatedSong.length == 0) {
                        if(req.file){
                            // Eliminar fichero
                            const filePath = './uploads/songs/' + filename;
                            fs.unlinkSync(filePath);
                        }

                        return res.status(404).send({
                            status: 'Not Found',
                            message: 'No se pudo actualizar la cancion'
                        });
                    }

                    if(req.file){
                        // Eliminar fichero
                        const filePath = './uploads/songs/' + fileNameToDelete;
                        fs.unlinkSync(filePath);
                    }

                    return res.status(200).send({
                        status: 'Success',
                        message: 'Cancion actualizada con exito',
                        updatedSong
                    });
                })
                .catch(error => {
                    if(req.file){
                        // Eliminar fichero
                        const filePath = './uploads/songs/' + filename;
                        fs.unlinkSync(filePath);
                    }

                    return res.status(500).send({
                        status: 'Error',
                        message: 'Error al realizar la actualizacion de la cancion'
                    });
                });
        })
        .catch(error => {
            if(req.file){
                // Eliminar fichero
                const filePath = './uploads/songs/' + filename;
                fs.unlinkSync(filePath);
            }

            return res.status(500).send({
                status: 'Error',
                message: 'Error al realizar la busqueda por id de la cancion'
            });
        });

}

// Eliminar cancion
const deleteSong = (req, res) => {
    // Verificar que el usuario identidficado sea administrador
    if(!validate.validateAdmin(req.user)) return res.status(400).send({
        status: 'Unauthorized',
        message: 'Debe ser administrador para ejecutar esta acción'
    });

    // Verificar que llega el id de la cancion por url y obtener
    if(!validate.validateIdByParam(req.params)) return res.status(400).send({
        status: 'Error',
        message: 'Debe indicar el id de la cancion a eliminar por la url'
    });

    const songId = req.params.id;

    // hacer un findByIdAndDelete
    songModel.findByIdAndDelete(songId).exec()
        .then(deletedSong => {
            if(!deletedSong || deletedSong.length == 0) return res.status(404).send({
                status: 'Not Found',
                message: 'No se encontro la cancion a eliminar'
            });

            return res.status(200).send({
                status: 'Success',
                message: 'Cancion eliminada con exito',
                deletedSong
            });
        })
        .catch(error => {
            return res.status(500).send({
                status: 'Error',
                message: 'Error al buscar la cancion'
            });
        });
}


// Exportar acciones
export {
    test,
    save,
    showSong,
    list,
    update,
    deleteSong
}