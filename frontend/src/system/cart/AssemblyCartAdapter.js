import CartTab from '../../business/general/CartTab.js'

export default class AssemblyCartAdapter{
   
   #cart

   /**
    * Instância a classe
    * @param {CartTab} cart A aba de carrinho
    */
   constructor(cart){
      this.#cart = cart
   }

   /**
    * Adiciona um produto no carrinho
    * @param {object} product O produto novo
    */
   addProduct(product){
      // console.log(product);
      // debugger
      
      this.#cart.cartRender.addItems(product)
      this.#cart.updateCartUI()
   }

   /**
    * Adiciona um produto no carrinho
    * @param {object} product O produto editado
    */
   editProduct(product){
      this.#cart.cartRender.editItem(product.identifier, product)
      this.#cart.updateCartUI()
   }

   /**
    * Retorna a lista de produtos
    * @returns {object[]} A lista de produtos
    */
   getProducts(){
      return this.#cart.getCartProducts()
   }

   /**
    * Abre a janela do carrinho
    */
   openTab(){
      this.#cart.open()
   }
}