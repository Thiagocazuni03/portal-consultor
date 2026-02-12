import Translator from "../translation/Translator";
import BaseError from "./BaseError";

export default class ApiError extends BaseError{
    constructor(message: string = Translator.tC('errors:api')){
        super(2, message)
    }
}