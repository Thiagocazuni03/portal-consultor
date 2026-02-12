export default class Component{

   /**
    * Retorna a visualização do componente
    * @returns {JQuery<HTMLElement>} O container do componente
    */
   getView(){
      return this.container
   }

   /**
    * Retorna o tipo do componente
    * @returns {string} O tipo
    */
   getType(){
      return this.config.type
   }

   /**
    * Retorna a configuração da classe
    * @returns {object} A configuração da classe
    */
   getConfig(){
      return this.config
   }
}