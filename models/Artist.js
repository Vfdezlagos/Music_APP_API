import { Schema, model } from "mongoose";
import paginate from "mongoose-paginate-v2";

const artistSchema = Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: 'Default Artist Description'
    },
    image: {
        type: String,
        default: 'defaultArtist.png'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

artistSchema.plugin(paginate);

const artistModel = model('Artist', artistSchema, 'artists');

export default artistModel;