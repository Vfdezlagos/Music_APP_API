import { generate } from "generate-password";

const generatePassword = () => {
    return generate({
        length: 30,
        numbers: true
    });
}

export default generatePassword;