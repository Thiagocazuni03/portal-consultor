import Modal from '../../core/Modal.js'
import PlusMinus from '../../core/PlusMinus.js'
import LoadingModal from '../../business/general/LoadingModal.js'
import OrderService from '../cart/OrderService.js'
import ProcessPrompt from './ProcessPrompt.js'
import Utils from '../../core/Utils.js'

export default class ProductClonePrompt extends ProcessPrompt {

   #product
   #draftID

   constructor(product, draftID, target) {
      super(target)

      if (!draftID) {
         throw new Error('ProductClonePrompt: Missing draft identifier.')
      }

      this.#product = product
      this.#draftID = draftID
   }

   /**
    * Mostra o prompt
    */
   show() {
      this.#showQuantitySelectionModal()
   }

   /**
    * Mostra o modal de selecionar quantidade
    */
   #showQuantitySelectionModal() {
      const plusMinus = new PlusMinus({
         max: 10,
         min: 1,
         value: 1
      })

      const cancel = {
         type: 'blank',
         text: 'Cancelar'
      }

      const confirm = {
         type: 'filled',
         text: 'Confirmar',
         color: 'var(--orange)',
         onClick: () => this.#cloneProductAndUpdateOrder(plusMinus.getValue())
      }

      const modal = new Modal({
         appendTo: this.target,
         icon: 'ic-copy',
         color: 'var(--orange)',
         title: 'Duplicar',
         message: 'Selecione a quantidade de __novos__ produtos que se deseja criar.',
         buttons: [cancel, confirm]
      })

      modal.appendToContent(plusMinus.getView())
      modal.openModal()
   }

   /**
    * Clona o produto
    * @param {number} quantity A quantidade de vezes 
    */
   async #cloneProductAndUpdateOrder(quantity) {      
      const loadingModal = new LoadingModal({
         appendTo: this.target,
         autoOpen: true,
         title: 'Aguarde',
         message: 'Estamos duplicando seus produtos'
      })

      try {
         const order = new OrderService(this.#draftID)
         const clones = this.#createProductClones(quantity)

         for (const clone of clones) {
            await order.addProduct(clone)
         }

         this.#showSuccessModal(clones)

      } catch (error) {

         this.#showErrorModal()

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Cria clones do produto e os retorna
    * @param {number} quantity A quantidade 
    */
   #createProductClones(quantity) {
      const clones = []

      for (let i = 0; i < quantity; i++) {
         const clone = structuredClone(this.#product)

         clone.identifier = Utils.generateUniqueToken('PRD')
         clone.time = Date.now()
         clone.measures.forEach(measure => {
            measure.identifier = Utils.generateUniqueToken('PCE')
         })

         clones.push(clone)
      }

      return clones
   }

   /**
    * Mostra a mensagem de sucesso
    * @param {object[]} clones Os clones 
    */
   #showSuccessModal(clones){
      if(this.onSuccess){
         this.onSuccess(clones)
      }

      new Modal({
         autoOpen: true,
         target: this.target,
         icon: 'ic-check',
         hasFooter: false,
         color: 'var(--green)',
         title: 'Sucesso!',
         message: 'Seus produtos foram duplicados com sucesso!',
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
         icon: 'ic-trash',
         color: 'var(--red)',
         title: 'Erro!',
         hasFooter: false,
         message: 'Houve um erro ao duplicar os produtos. Contate o desenvolvedor.',
      })
   }
}