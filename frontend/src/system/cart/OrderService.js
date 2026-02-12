import CartService from './CartService.js'
import DraftService from './DraftService.js'
import {ORDER_FOLDER_PATH, DRAFTS_FOLDER_PATH, STORAGE_URL} from '../../api/Variables.js'
import APIManager from '../../api/APIManager.js'
export default class OrderService {

   #cart
   #draft

   /**
    * Instância um serviço de pedidos e orçamentos
    * @param {string} draftID O ID de serviço
    */
   constructor(draftID, isDraft = true) {
      let base = null
      if (!draftID) {
         throw new Error('OrderService: Missing draft identifier.')
      }
 
      
      if(isDraft){
         base = DRAFTS_FOLDER_PATH
      } else {
         base = ORDER_FOLDER_PATH
      }
      

      this.#cart = new CartService(draftID, `${base}/`)
      this.#draft = new DraftService(draftID)
   }

   /**
    * Retorna os dados armazenados do pedido
    * @returns {Promise<object>} Os dados do pedido
    */
   // async getData() {
      // return await this.#draft.fetchData()
   // }

   // async getData(){  
      
   //    console.log(this);
   //    debugger
      
   //    return APIManager.fetchJSON(`${STORAGE_URL}${DRAFTS_FOLDER_PATH}/${this.#id}/${ORDER_DATA_FILE_NAME}.json`)
   // }

   async getData(){
      const path = this.#cart.getPath()
      
      return APIManager.fetchJSON(`${STORAGE_URL}${path}/order.json`)
      // https://storage.googleapis.com/amorimcortinas/file/order/ORD20251205143539659.json
      // https://storage.googleapis.com/amorimcortinas/file/draft/DRA20251205154452931/order.json
   }
   /**
    * Retorna a lista de produtos neste pedido
    * @returns {Promise<object[]>} A lista de produtos
    */
   async getProducts() {
      return await this.#cart.list()
   }

   /**
    * Adiciona um produto
    * @param {object} product O produto 
    */
   async addProduct(product) {
      
      
      await this.#cart.save(product)
      const products = await this.getProducts()
      // const response = await this.#draft.createProduct(product, products)
      // tem que ser assim, estava duplicando produtos na forma anterior
      const response = await this.#draft.createProduct(null, products)
  
 
      // debugger
      const isError = response.errorCode !== 0

      if (isError) {
         throw new Error('Erro ao salvar um novo produto')
      }
   }

   /**
    * Edita um produto no pedido
    * @param {object} product O produto
    */
   async editProduct(product) {
      await this.#cart.save(product)

      const products = await this.getProducts()
      const response = await this.#draft.editProduct(product, products)
      const isError = response.errorCode !== 0

      if (isError) {
         throw new Error('Erro ao editar o produto')
      }
   }

   /**
    * Deleta um produto específico do pedido
    * @param {object} product O produto
    * @returns {Promise<void>} A promise
    */
   async deleteProduct(product) {
      const response = await this.#draft.deleteProducts(product)
      const isError = response.errorCode !== 0

      if (isError) {
         throw new Error('Erro ao deletar produto')
      }

      await this.#cart.delete(product.identifier)
   }

   /**
    * Deleta todos os produtos do pedido
    * @returns {Promise<void>}
    */
   async deleteAllProducts() {
      const products = await this.getProducts()
      const response = await this.#draft.deleteProducts(...products)
      const isError = response.errorCode !== 0

      if (isError) {
         throw new Error('Houve um erro ao limpar o carrinho')
      }

      await this.#cart.clear()
   }

   /**
    * Fecha e transforma o pedido em um pedido definitivo
    */
   async close() {
      const products = await this.getProducts()   
      const response = await this.#draft.closeDraft(products)

      console.log('close response');
      console.log(response);
      
      const isError = response.errorCode !== 0

      if (isError) {
         throw new Error('Erro ao finalizar a venda.')
      }
   }

   /**
    * Deleta o pedido
    */
   async delete() {
      
      const products = await this.getProducts()
      console.log(products);
      
      const response = await this.#draft.deleteDraft(products)
      console.log(response);
      
      const isError = response.errorCode !== 0

      
      if (isError) {
         throw new Error('Erro ao deletar a venda')
      }

      await this.#cart.clear()
   }
}