/**
 * Classe responsável por criar um highlight em palavras dos logs
 * @abstract Não deve ser instânciada
 * @author Fernando Petri
 */
export class LogHighlighter{

   /**
    * Previne a instânciação da classe
    */
   constructor(){
      throw new Error(`A classe ${this.constructor.name} não deve ser instânciada.`)
   }

   /**
    * Adiciona o highlight em um texto
    * @param {string} text O texto
    * @param {string} color A cor como uma propriedade CSS válida
    * @returns {string} O texto como highlithed
    */
   static highlight(text = '', color = 'black'){
      return `<span style="color: ${color}; font-weight: 500">${text}</span>`
   }
}