import { STORAGE_URL } from '../../api/Variables.js'

/**
 * Classe responsável por buscar os recursos de montagem de um produto
 * @abstract Não deve ser instânciada
 * @author Fernando Petri
 */
export class ResourcesService{

   /**
    * Previne a instânciação da classe
    */
   constructor(){
      throw new Error(`A classe ${this.constructor.name} não deve ser instânciada.`)
   }

   /**
    * Busca todos os dados do produto e retorna os mesmo
    * @param {number} productID O ID do produto
    * @returns {Promise<object>} O resultado 
    */
   static async fetch(productID){
      if(!productID){
         throw new Error('(ResourcesService) Um ID de produto indefinido não é permitido.')
      }

      const [resources, names] = await Promise.all([
         this.#fetchProductData(productID),
         this.#fetchOptionalNames()
      ])

      return {
         resources,
         names
      }
   }

   /**
    * Busca os dados da montagem na nuvem
    * @param {number} productID O ID do produto
    * @returns {Promise<object>} Um objeto
    */
   static async #fetchProductData(productID){
      const response = await fetch(STORAGE_URL + `portal/product/product-${productID}.json?t=${new Date().getTime()}`)
      const data = await response.json()

      return data
   }

   /**
    * Busca os nomes dos opcionais da nuvem
    * @returns {Promise<object>} Os nomes de opcional
    */
   static async #fetchOptionalNames(){
      const response = await fetch(STORAGE_URL + `portal/product/optional-name.json?t=${new Date().getTime()}`)
      const data = await response.json()
      const hashed = Object.fromEntries(data.map(optional => [optional.id, optional.cat]))

      return hashed
   }
}