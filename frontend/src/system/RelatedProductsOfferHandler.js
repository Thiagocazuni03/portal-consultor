import APIManager from '../api/APIManager.js'
import { STORAGE_URL } from '../api/Variables.js'
import Item from '../core/Item.js'
import Modal from '../core/Modal.js'
import DataCart from './DataCart.js'
import { ProductOfferItem } from './ProductOfferItem.js'
import ProductViewTab from './ProductViewTab.js'

/**
 * Class responsável por detectar se um produto recém adicionado tem produtos relacionados para oferece-lo
 */
export default class RelatedProductsOfferHandler {

   #dataCart
   #cartAdapter

   /**
    * Instância a classe
    * @param {DataCart} dataCart O produto 
    */
   constructor({ dataCart, cartAdapter }) {
      this.#cartAdapter = cartAdapter
      this.#dataCart = dataCart
   }

   /**
    * Lida com o produto verificando se tem produtos relacionados
    */
   handle() {
      const relatedIds = this.#dataCart.getRelatedProductsIds()
      const hasRelation = relatedIds.length > 0

      if (!hasRelation) {
         return
      }

      this.showOffers(relatedIds)
   }

   /**
    * Mostra as ofertas de produtos
    * @param {number[]} relatedIds A lista de IDS relacionados 
    */
   async showOffers(relatedIds) {
      const modal = new Modal({
         icon: 'ic-price-tag',
         color: 'var(--orange)',
         title: 'Produtos Relacionados',
         message: 'Parece que há outros produtos relacionados a este produto, deseja adicioná-los?',
         hasFooter: false
      })

      const products = await this.fetchProductsData(relatedIds)
      const offers = products.map(product => this.createOfferingView(product))

      modal.appendToContent(offers)
      modal.openModal()
   }

   /**
    * Busca todos os produtos disponíveis e retorna os produtos que tem um ID relacionado
    * @param {number[]} relatedIds Os ids relacionados  
    * @returns {Promise<object[]>} A lista de produtos relacionados
    */
   async fetchProductsData(relatedIds) {
      const products = await APIManager.getProducts()
      const related = products.filter(product => relatedIds.includes(product.id))

      return related
   }

   /**
    * Cria uma visualização de oferta
    * @param {object} product O produto da oferta
    * @param {Modal} modal O modal das ofertas
    * @returns {JQuery<HTMLElement>} O elemento da visualização
    */
   createOfferingView(product) {
      const item = new ProductOfferItem(product)

      item.setOnClick(() => {         
         new ProductViewTab({
            autoOpen: true,
            zIndex: 20,
            product: product,
            cartAdapter: this.#cartAdapter
         })
      })

      return item.getView()
   }
}