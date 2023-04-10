
class MyUUID {
    generateId() {

        const numbers = '0123456789';
        const model = 'xxxx-xxxxx-xxxxx-xxxxxx-xxxxxxxxxx';
        let str = '';

        for (let i = 0; i < model.length; i++) {
            let random_index = Math.floor(Math.random() * numbers.length);
            str += model[i] == '-' ? model[i] : numbers[random_index];
        }
        return str;
    }
}

module.exports = MyUUID;

