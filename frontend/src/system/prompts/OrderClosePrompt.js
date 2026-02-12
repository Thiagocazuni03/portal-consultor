import Modal from '../../core/Modal.js'
import LoadingModal from '../../business/general/LoadingModal.js'
import CartService from '../cart/CartService.js'
import OrderService from '../cart/OrderService.js'
import ProcessPrompt from './ProcessPrompt.js'

/**
 * Classe responsável por servir de processo padronizado na deleção de pedidos
 */
export default class OrderClosePrompt extends ProcessPrompt {

   #draftID

   constructor(draftID, target) {
      super(target)

      if (!draftID) {
         throw new Error('OrderClosePrompt: Missing draft identifier.')
      }

      this.#draftID = draftID
   }

   /**
    * Mostra a mensagem
    * @override
    * @param {string} draftID O identificador do pedido 
    * @param {JQuery<HTMLElement>} target O alvo em que os modais serão adicionados
    */
   show() {
      this.#showConfirmation()
   }

   /**
    * Mostra a confirmação de finalização
    */
   #showConfirmation() {
      const cancel = {
         type: 'blank',
         text: 'Cancelar'
      }

      const confirm = {
         type: 'filled',
         text: 'Finalizar',
         color: 'var(--orange)',
         onClick: () => this.#tryToClose()
      }

      new Modal({
         appendTo: this.target,
         autoOpen: true,
         icon: 'ic-warning',
         color: 'var(--orange)',
         title: 'Atenção!',
         message: 'Você está prestes a __finalizar__ seu orçamento, essa ação é __irreversível__, tem certeza que __deseja continuar__?',
         buttons: [cancel, confirm]
      })
   }

   /**
    * Deleta um pedido por fim
    */
   async #tryToClose() {
      console.log('aaaa');
      
      const loadingModal = new LoadingModal({
         appendTo: this.target,
         autoOpen: true,
         title: 'Aguarde',
         message: 'Estamos finalizando seu orçamento...'
      })

      try {

         const cart = new CartService(this.#draftID)
         const products = await cart.list()

         const isValid = this.#areAllProductsFinished(products)
         const isEmpty = this.#isCartEmpty(products)

         if(isEmpty){
            this.#showEmptyCartErrorMessage()
            return
         }

         if(!isValid){
            this.#showUnfinishedProductsOnCartErrorMessage()
            return
         }

         await this.#closeOrder()
         this.#showSuccessModal()

      } catch (error) {
         console.log(error);
         // debugger
         this.#showErrorModal()

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Fecha a ordem por fim
    */
   async #closeOrder(){
      return new OrderService(this.#draftID).close()
   }

   /**
    * Retorna se todos os produtos estão finalizados
    * @param {object[]} products A lista de produtos 
    * @returns {boolean} Se todos estão finalizados
    */
   #areAllProductsFinished(products){
      return products.every(product => {
         return product.isFinished
      })
   }

   /**
    * Retorna se o carrinho está vazio
    * @param {object[]} products A list de produtos
    * @returns {boolean} Se o carrinho está vazio 
    */
   #isCartEmpty(products){
      return products.length === 0
   }

   /**
    * Mostra uma mensagem de erro dizendo que o carrinho está vazio
    */
   #showUnfinishedProductsOnCartErrorMessage(){
      const close = {
         type: 'blank',
         text: 'Fechar'
      }
   
      new Modal({
         appendTo: this.target,
         autoOpen: true,
         icon: 'ic-close',
         color: 'var(--red)',
         title: 'Produtos Incompletos!',
         message: 'Parece que você tem produtos __não finalizados__ neste orçamento. Não é possível continuar.',
         buttons: [close]
      })
   }

   /**
    * Mostra mensagem que o carrinho está vazio
    */
   #showEmptyCartErrorMessage(){
      const close = {
         type: 'blank',
         text: 'Fechar'
      }

      new Modal({
         appendTo: this.target,
         autoOpen: true,
         icon: 'ic-close',
         color: 'var(--red)',
         title: 'Orçamento Vazio!',
         message: 'Parece que você não possui __nenhum item__ neste orçamento. Não é possível prosseguir.',
         buttons: [close]
      })
   }

   /**
    * Mostra um modal com uma mensagem de sucesso
    */
   #showSuccessModal() {
      let showModal = true
      
      if (this.onSuccess) {
         showModal = this.onSuccess()
      }

      if(showModal === false){
         return
      }

      new Modal({
         appendTo: this.target,
         autoOpen: true,
         icon: 'ic-check',
         color: 'var(--green)',
         title: 'Sucesso!',
         message: 'Seu pedido foi finalizado com sucesso!',
         hasFooter: false,
      })
   }

   /**
    * Mostra um modal de erro
    */
   #showErrorModal() {
      if (this.onError) {
         this.onError()
      }

       
      new Modal({
         appendTo: this.target,
         autoOpen: true,
         icon: 'ic-close',
         color: 'var(--red)', 
         hasFooter: false,
         title: 'Erro!',
         message: 'Houve um erro ao finalizar seu pedido. Contate o desenvolvedor.',
      })
   }
}