import validator from "validator";

const validateEmptyAlphanum = (...text) => {
    // if(typeof text !== 'String'){
    //     console.log('El campo no es string');
    //     return false;
    // }

    for(let ele in text){
        if(validator.isEmpty(ele)){
            console.log('El campo esta vacio');
            return false;
        }

        if(!validator.isAlphanumeric(ele)){
            console.log('El campo no es alfanumerico');
            return false;
        }
    }

    // if(text.length <= 0 && text.length > 16){
    //     console.log('El campo debe tener un maximo de 15 caracteres');
    //     return false;
    // }

    return true;
}

const validarPass = (text) => {
    // if(typeof text !== 'String'){
    //     console.log('El campo no es string');
    //     return false;
    // }

    if(validator.isEmpty(text)){
        console.log('El campo esta vacio');
        return false;
    }

    return true;
}

const validarEmail = (text) => {
    // if(typeof text !== 'String'){
    //     console.log('El campo email no es string');
    //     return false;
    // }

    if(validator.isEmpty(text)){
        console.log('El campo email esta vacio');
        return false;
    }

    if(!validator.isEmail(text)){
        console.log('El campo email no corresponde al formato de email');
        return false;
    }

    return true;
}


const validate = {
    
    validateUser: (user) => {

        // validar name
        if(!validateEmptyAlphanum(user.name)) return false;

        // validar nick
        if(!validateEmptyAlphanum(user.nick)) return false;

        // validar email
        if(!validarEmail(user.email)) return false;

        // validar password
        if(!validarPass(user.password)) return false;

        return true;
    },

    validateLogin: (user) => {

        if(!user.username || !user.password){
            console.log('Faltan datos por enviar');
            return false;
        }

        // validar username o email (campo)
        if(validator.isEmpty(user.username)){
            console.log('username is empty');
            return false
        }

        // validar contraseña
        if(validator.isEmpty(user.password)){
            console.log('password is empty');
            return false
        }

        return true;
    },

    validateImageExtension: (extension) => {
        if(extension != 'png' && extension != 'jpg' && extension != 'jpeg' && extension != 'gif') return false;

        return true;
    },

    validateArtist: (artist) => {
        // validar name

        if(!artist.name) return false;

        if(validator.isEmpty(artist.name)) return false;

        return true;
    },

    validateAdmin: (user) => {
        if(!user.role || user.role != 'role-admin') return false;

        return true;
    },

    validateIdByParam: (params) => {
        if(!params.id || params.id.length == 0) return false;

        return true;
    },

    validateAlbum: (album) => {
        // Validar title
        if(!album.title || !validateEmptyAlphanum(album.tile)) return false;

        // Validar year
        if(!album.year || !validator.isNumeric(album.year)) return false;

        return true;
    },

    validateSong: (song) => {
        // validar track
        if(!song.track || !validator.isNumeric(song.track)) return false;

        // validar name
        if(!song.name || !validateEmptyAlphanum(song.name)) return false;

        // validar duration
        if(!song.duration) return false;

        return true;
    },

    validateSongExtension: (extension) => {
        if(extension != 'mp3' && extension != 'wav' && extension != 'ogg' && extension != 'aac') return false;

        return true;
    }
}

export default validate;