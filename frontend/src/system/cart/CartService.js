import { DRAFTS_FOLDER_PATH } from '../../api/Variables.js'
import FolderManager from '../../core/FolderManager.js'

export default class CartService{
   
   /**
    * Caminho base para chegar nas pastas dos carrinhos
    */
   static #BASE_PATH = `${DRAFTS_FOLDER_PATH}/`

   /**
    * Nome da pasta que se encontra
    */
   static #FOLDER_NAME = 'products'
   
   #folder

   /**
    * Instância a a classe
    * @param {string} draftID 
    */
   constructor(draftID, base = null){
      let path = null

      if(base){
         path = base + draftID 
      } else {
         path = CartService.#BASE_PATH + draftID
      }

      this.#folder = new FolderManager(
         // CartService.#BASE_PATH + draftID, 
         path,
         CartService.#FOLDER_NAME
      )
   }

   /**
    * Os produtos presentes neste carrinho
    * @returns {Promise<object[]>} A lista de produtos
    */
   async list(){
      return this.#folder.readAll()
   }

   getPath(){
      return this.#folder.getPath()
   }

   /**
    * Salva um produto no carrinho
    * @param {string} identifier O identificador do produto
    * @param {object} product O produto
    * @returns {Promise<void>} A promise
    */
   async save(product){
      
      console.log('%c Insere o produto no bucket!', 'color: red; font-weight: bold;');
      console.log(product.identifier);
       
      
      return await this.#folder.create(product.identifier, product)
   }

   /**
    * Deleta um produto do carrinho
    * @param {string} identifier O identificador do produto
    * @returns {Promise<void>} A promise
    */
   async delete(identifier){
      return await this.#folder.delete(identifier)
   }

   /**
    * Limpa todos os produtos do carrinho
    * @returns {Promise<void>} A promise
    */
   async clear(){
      return await this.#folder.deleteAll()
   }
}