import { Schema, model } from "mongoose";
import paginate from "mongoose-paginate-v2";

const albumSchema = Schema({
    artist: {
        type: Schema.ObjectId,
        ref: 'Artist'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: 'Default Album description'
    },
    year: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: 'defaultAlbum.png'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

albumSchema.plugin(paginate);

const albumModel = model('Album', albumSchema, 'albums');

export default albumModel;