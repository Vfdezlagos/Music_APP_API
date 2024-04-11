import { Schema, model } from "mongoose";
import paginate from "mongoose-paginate-v2";

const songSchema = Schema({
    album: {
        type: Schema.ObjectId,
        ref: 'Album'
    },
    track: {
        type: Number,
        require: true
    },
    name: {
        type: String,
        require: true
    },
    duration: {
        type: String,
        require: true
    },
    file: {
        type: String,
        require: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

songSchema.plugin(paginate);

const songModel = model('Song', songSchema, 'songs');

export default songModel;