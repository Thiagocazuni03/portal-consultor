import Translator from "../translation/Translator";

export default class BaseError{
    constructor(
        private code: number = 1,
        private message: string = Translator.t('errors:1')
    ){}

    getCode(): number {
        return this.code
    }

    getMessage(){
        return this.message
    }
}