import APIManager from '../../api/APIManager.js'
import { API_KEY, DRAFTS_FOLDER_PATH, ORDER_DATA_FILE_NAME, ORDER_URL, STORAGE_URL } from '../../api/Variables.js'
import { API_BASE_URL2, APPLICATION } from '../../api/Variables.js'
 
export default class DraftService {

   static #MODIFICATION_TYPES = Object.freeze({
      NONE: 0,
      CREATED: 1,
      EDITED: 2
   })

   #id

   /**
    * Instância a classe
    * @param {string} draftID O identificador 
    */
   constructor(draftID) {
      this.#id = draftID
   }

   /**
    * Busca o conteúdo do pedido
    */
   async fetchData() {
      // console.log(`${STORAGE_URL}${DRAFTS_FOLDER_PATH}/${this.#id}/${ORDER_DATA_FILE_NAME}.json`);
      // debugger
      
      return APIManager.fetchJSON(`${STORAGE_URL}${DRAFTS_FOLDER_PATH}/${this.#id}/${ORDER_DATA_FILE_NAME}.json`)
   }

   /**
    * Salva um produto
    * @param {object} newProduct O produto novo
    * @param {object[]} oldProducts Os produtos antigos
    * @returns {Promise<object>} A resposta  
    */
   async createProduct(newProduct, oldProducts) {
      console.log('create product');
       
      const data = await this.fetchData() // procura pelo json do orçamento
      let products = oldProducts

      //necessário para evitar adicionar produto nulo
      if(newProduct){
         products = [...oldProducts, newProduct]
      }

      data.products = this.#createSaveProductModificationList(products, newProduct)
      data.extract = this.#calculateOrderExtract(products)
      data.application = APPLICATION
      
      // console.log(products);
      // console.log(data);
      // debugger   
 
      return await APIManager.doAPIRequest(API_BASE_URL2 + 'draft/update', {
         application:APPLICATION,
         params:{
            order:data
         }
      }) 
 
      // return await APIManager.doAPIRequest(ORDER_URL, data)
   } 

   /**
    * Edite um produto
    * @param {object} newProduct O produto novo
    * @param {object[]} oldProducts Os produtos antigos
    * @returns {Promise<object>} A resposta  
    */
   async editProduct(editedProduct, products) {
      console.log('edit product');
      
      const data = await this.fetchData()

      const productsWithoutEdited = products.filter(product => product.identifier !== editedProduct.identifier)
      const productsWithEdited = [...productsWithoutEdited, editedProduct]

      data.order.draft = true
      data.order.order.products = this.#createEditDraftModificationList(productsWithEdited, editedProduct)
      data.order.order.extract = this.#calculateOrderExtract(productsWithEdited)
      console.log(data);

      
      return await APIManager.doAPIRequest(ORDER_URL, data)
   }

   /**
    * Deleta os produtos do carrinho
    * @param {...object} products Os produtos
    * @returns {Promise<object>} A resposta
    */
   async deleteProducts(...products) {
      const data = await this.fetchData()
      const identifiers = products.map(product => product.identifier)

      data.order.draft = true
      data.order.order.canceled = {}
      data.order.order.canceled.products = identifiers.map(identifier => ({ token: identifier }))

      return await APIManager.doAPIRequest(ORDER_URL, data)
   }

   /**
    * Fecha o pedido como definitivo
    */
   // async closeDraft(products) {
   //    const data = await this.fetchData()

   //    data.order.draft = false
   //    data.order.order.products = this.#createCloseDraftModificationList(products)
   //    data.order.order.extract = this.#calculateOrderExtract(products)
   //    data.order.order.finishedAt = Date.now()

   //    console.log('isto é o que é enviado para order.php');
   //    console.log(data);
      
   //    return await APIManager.doAPIRequest(ORDER_URL, data)
   // }

   //thiago cazuni aqui
   async closeDraft(products) {
      const data = await this.fetchData()
      let obj = {
         key:API_KEY,
         application:APPLICATION,
         params:{}
      }
      const productsFormat = this.#createCloseDraftModificationList(products).map(p => {
         return { token: p.token }
      })
 
      data.products = productsFormat

      obj.params.order = {
         ...data, 
         extract: this.#calculateOrderExtract(products)
      }
     
      let response = await APIManager.doAPIRequest(API_BASE_URL2 + 'order/create', obj)
 
      return response;
   } 
 
   /**
    * Deleta o pedido
    * @param {object[]} products A lista de produtos
    */
   async deleteDraft(products) {      
      const data = await this.fetchData()

      // data.order.draft = 'delete'
      // data.order.order.canceled = {}      
      // data.order.order.canceled.products = this.#createDeleteDraftModificationList(products)
      data.canceled = {}
      data.canceled.products = this.#createDeleteDraftModificationList(products)

      let obj = {
         key:API_KEY,
         application:APPLICATION,
         params:{} 
      }
      
      obj.params.order = {
         ...data, 
      }

      console.log('delete draft');
      console.log(obj);
       
      let response = await APIManager.doAPIRequest(API_BASE_URL2 + 'draft/delete', obj)
      return response

      // return await APIManager.doAPIRequest(ORDER_URL, data)
   }
 
   /**
    * Cria uma lista que representa a modificação dos produtos
    * @param {object[]} products A lista de produtos
    * @param {object} newProduct O produto adicionado
    * @returns {object[]} A lista de modificações
    */
   #createSaveProductModificationList(products, newProduct) {
      return products.map(product => {
         if(!newProduct){
            return {
               token: product.identifier, 
               action: DraftService.#MODIFICATION_TYPES.NONE
            }
         }
         return {
            token: product.identifier,
            action: product.identifier === newProduct.identifier ? DraftService.#MODIFICATION_TYPES.CREATED : 0
         }
      })
   }

   /**
    * Cria uma lista que representa a modificação dos produtos
    * @param {object[]} products A lista de produtos
    * @param {object} editedProduct O produto adicionado
    * @returns {object[]} A lista de modificações
    */
   #createEditDraftModificationList(products, editedProduct) {
      return products.map(product => ({
         token: product.identifier,
         action: product.identifier === editedProduct.identifier ? DraftService.#MODIFICATION_TYPES.EDITED : 0
      }))
   }

   /**
    * Cria uma lista que representa a modificação dos produtos no momento de fechamento
    * @param {object[]} products Os produtos 
    * @returns {object[]} A lista de modificiações
    */
   #createCloseDraftModificationList(products) {
      return products.map(product => ({
         token: product.identifier,
         action: DraftService.#MODIFICATION_TYPES.CREATED
      }))
   }

   /**
    * Cria uma lista que representa os produtos que foram deletados
    * @param {object[]} products A lista de produtos 
    * @returns {object[]} A lista de modificações
    */
   #createDeleteDraftModificationList(products) {
      return products.map(product => ({
         token: product.identifier,
      }))
   }

   /**
    * Calcula o total de um pedido
    * @param {object[]} products A lista de produtos
    * @returns {Record<string, number>} Os totais
    */
   #calculateOrderExtract(products) {
      const additionalsTotal = products.reduce((total, product) => total + Number(product.extract?.additional ?? 0), 0)
      const productsTotal = products.reduce((total, product) => total + Number(product.extract?.total ?? 0), 0) - additionalsTotal
      const markupTotal = products.reduce((total, product) => total + Number(product.extract?.markuped ?? 0), 0) - additionalsTotal
      
      return {
         addition: additionalsTotal,
         products: productsTotal,
         markup: markupTotal,
         total: productsTotal + additionalsTotal
      }
   }
}