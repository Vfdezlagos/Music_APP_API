// importar Schema y model de mongoose
import { Schema, model } from "mongoose";

// importar paginate
import paginate from "mongoose-paginate-v2";

// crear userSchema
const userSchema = Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String
    },
    nick: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'role-user'
    },
    image: {
        type: String,
        default: 'default.png'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

userSchema.plugin(paginate);

const userModel = model('User', userSchema, 'users');

export default userModel;