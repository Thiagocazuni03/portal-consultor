import Modal from '../../core/Modal.js'
import LoadingModal from '../../business/general/LoadingModal.js'
import OrderService from '../cart/OrderService.js'
import ProcessPrompt from './ProcessPrompt.js'

/**
 * Classe responsável por servir de processo padronizado na deleção de pedidos
 */
export default class OrderDeletionPrompt extends ProcessPrompt{

   #draftID

   constructor(draftID, target) {
      super(target)

      if(!draftID){
         throw new Error('OrderDeletionPrompt: Missing draft identifier.')
      }

      this.#draftID = draftID
   }

   /**
    * Mostra a mensagem
    * @param {string} draftID O identificador do pedido 
    * @param {JQuery<HTMLElement>} target O alvo em que os modais serão adicionados
    */
   show() {
      this.#showFirstWarning()
   }

   /**
    * Mostra a primeira mensagem de aviso
    */
   #showFirstWarning() {
      const cancel = {
         text: 'Cancelar',
         type: 'blank',
      }

      const confirm = {
         text: 'Continuar',
         color: 'var(--red)',
         type: 'filled',
         onClick: () => this.#showSecondWarning()
      }

      new Modal({
         autoOpen: true,
         appendTo: this.target,
         icon: 'ic-warning',
         color: 'var(--red)',
         title: 'Atenção!',
         message: 'Você está prestes a __deletar__ um orçamento. Isso __excluirá seu registro__, assim como __todos seus produtos__. Tem certeza que deseja continuar?',
         buttons: [cancel, confirm]
      })
   }

   /**
    * Mostra a segunda mensagem de aviso
    */
   #showSecondWarning() {
      const cancel = {
         text: 'Cancelar',
         type: 'blank'
      }

      const confirm = {
         text: 'Deletar',
         color: 'var(--red)',
         type: 'filled',
         onClick: () => this.#deleteOrder()
      }

      new Modal({
         appendTo: this.target,
         autoOpen: true,
         icon: 'ic-warning',
         color: 'var(--red)',
         title: 'Atenção!',
         message: 'Tem certeza que deseja __excluir este orçamento__? Esta ação é __irreversível__ e não pode ser desfeita.',
         buttons: [cancel, confirm]
      })
   }

   /**
    * Deleta um pedido por fim
    */
   #deleteOrder() {
      const loadingModal = new LoadingModal({
         appendTo: this.target,
         autoOpen: true,
         title: 'Aguarde',
         message: 'Estamos deletando seu orçamento...'
      })

      new OrderService(this.#draftID)
         .delete()
         .then(() => this.#showSuccessModal())
         .catch(() => this.#showErrorModal())
         .finally(() => loadingModal.closeModal())
   }

   /**
    * Mostra um modal com uma mensagem de sucesso
    */
   #showSuccessModal() {
      if (this.onSuccess) {
         this.onSuccess()
      }

      new Modal({
         appendTo: this.target,
         autoOpen: true,
         icon: 'ic-trash',
         color: 'var(--green)',
         title: 'Sucesso!',
         hasFooter: false,
         message: 'Seu pedido foi deletado com sucesso!',
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
         message: 'Houve um erro ao deletar seu pedido. Contate o desenvolvedor.',
      })
   }
}