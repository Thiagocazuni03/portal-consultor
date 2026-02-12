import i18next from 'i18next'
import Session from '../core/Session.js'
import portuguese from './languages/pt.js'
import spanish from './languages/es.js'
import english from './languages/en.js'
import Utils from '../core/Utils.js'

/**
 * Classe responsável por servir de interface para traduções
 * @author Fernando Petri
 * @abstract
 * @requires i18next
 */
export default class Translator {

   /**
    * Inicializa o tradutor
    */
   static async initialize() {
      await i18next.init({
         lng: Session.getLanguage(),
         debug: true,

         resources: {
            pt: portuguese,
            es: spanish,
            en: english
         }
      })
   }

   /**
    * Realiza a tradução de uma chave
    * @param {string} key A chave 
    * @param {object} key As opções 
    * @returns {string} A tradução
    */
   static t(key, options = {}) {
      return i18next.t(key, options)
   }
   
   /**
    * Realiza a tradução de uma chave e a retorna capitalizada (translateCapitalized)
    * @param {string} key A chave 
    * @param {object} key As opções 
    * @returns {string} A tradução
    */
   static tC(key, options = {}){
      return Utils.capitalize(
         this.t(key, options)
      )
   }

   /**
    * Realiza a tradução de uma chave e a retorna como título (translateTitleCased)
    * @param {string} key A chave 
    * @param {object} options As opções
    * @returns {string} A tradução
    */
   static tT(key, options = {}){
      return Utils.titleCase(
         this.t(key, options)
      )
   }
}