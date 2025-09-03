import bcrypt from "bcrypt";


export const generate_recover_code = ({length = 6}: {length: number}) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
    return Number(code);
}

export const generate_random_password = ({length = 8}: {length: number}) => {
    const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const special_characters = "@#$&*_-+.";
    const all_characters = letters + numbers + special_characters;
    const password = Array.from({length}, () => all_characters[Math.floor(Math.random() * all_characters.length)]).join("");
    return password;
}

export const hash_password = (password: string) => {
    return bcrypt.hash(password, 12);
}

export const compare_password = (password: string, hashed_password: string) => {
    return bcrypt.compare(password, hashed_password);
}