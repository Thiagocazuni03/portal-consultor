import $ from 'jquery'

export default class ProcessPrompt {

   /**
    * Instância a clasese
    * @param {JQuery<HTMLElement>} target O elemento que será adicionado 
    */
   constructor(target = $('body')){
      this.target = target
      this.onSuccess = null
      this.onError = null
   }

   /**
    * Define a função callback de finalização
    * @param {() => unknow} onSuccess A função
    */
   setOnSuccess(onSuccess) {
      this.onSuccess = onSuccess
   }

   /**
    * Define a função callback para erros
    * @param {() => unknow} onError A função
    */
   setOnError(onError) {
      this.onError = onError
   }

   /**
    * Mostra o prompt
    */
   show(){
      throw new Error('OrderPrompt: Missing override implementation')
   }
}