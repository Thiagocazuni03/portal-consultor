import { P } from '../../utils/Prototypes.js'
import Tab from '../../components/Tab.js'
import Modal from '../../core/Modal.js'
import Signature from '../../utils/Signature.js'
import UserStorage from '../../core/UserStorage.js'
import LoadingModal from '../general/LoadingModal.js'
import { EVENT_URL, TERMS } from '../../api/Variables.js'

export default class AcceptTermsTab extends Tab {
   constructor(config) {
      super({ ...config, appendTo: $('body'), openAnimation: 'appear' })

      //Configurando elementos
      this.title.text('Termos de Uso')
      this.desc.text('A seguir estão descritos os Termos de Uso e Condições do portal')
      this.leftButton.text('Sair')
      this.rightButton.prepend('Eu aceito')
      this.tab.addClass('isUserTerms')
      this.overlay.addClass('isUserTerms')
      this.rightButton.attr('disabled', true)
      this.closeIcon.remove()
      
      //Adicionando e gerenciando eventos eventos
      this.overlay.unbind('click')
      this.leftButton.unbind('click')
      this.leftButton.click(() => this.openQuitModalConfirmation())
      this.rightButton.click(() => this.didUserReadTerms && this.openSignModal())

      //Parte dos termos
      this.loadingModal = new LoadingModal({ title: 'Assinando termos' })
      this.signatureComponent = new Signature({ width: 318, height: 150 })
      this.userTerms = new P('SP__userterms')
      
      this.userTerms[0].innerText = TERMS.trim()
      this.userTerms.on('scroll', () => this.checkIfUserReadTerms())
      this.tab.on('mousemove', () => this.checkIfUserReadTerms())
      this.didUserReadTerms = false

      this.appendToContent(this.userTerms)
   }

   openSignModal() {
      new Modal({
         hasIcon: false,
         title: 'Assinatura Digital',
         message: 'Para finalizar, faça sua assinatura na linha abaixo.',
         appendToContent: this.signatureComponent.getView(),
         buttons: [
            { type: 'blank', text: 'Cancelar' },
            { type: 'filled', text: 'Enviar', onClick: this.signUseTerms.bind(this) }
         ]
      }).openModal()
   }

   async signUseTerms() {
      this.loadingModal.openModal()

      const signatureBase64 = this.signatureComponent.getAsBase64()
      const termsAPIParams = await this.getTermsSettings(signatureBase64)
      const updateTermsRequest = await fetch(EVENT_URL, termsAPIParams)
      const wasSuccess = updateTermsRequest.ok

      wasSuccess
         ? this.proceedAfterSignTerms()
         : this.openFailModal()
   }

   async getTermsSettings(signatureBase64){
      return {
         method: 'POST',
         timeout: 0,
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            'type': 'query',
            'module': 101,
            'params': {
               'seller': await UserStorage.getSellerInfo('identifier'),
               'signature': signatureBase64,
            },
            'application': await UserStorage.getKeyInfo('application')
         })
      }
   }

   async proceedAfterSignTerms() {
      await UserStorage.rebuildSession()
      await this.config.callback()
      this.loadingModal.closeModal()
      this.close()
   }


   openFailModal() {
      this.loadingModal.closeModal()

      new Modal({
         title: 'Houve um erro ao assinar os termos',
         color: 'var(--red)',
         icon: 'ic-close',
         hasMessage: false,
         hasFooter: false,
         css: 'hasNoFooter'
      }).openModal()
   }

   openQuitModalConfirmation() {
      new Modal({
         icon: 'ic-info-circle',
         title: 'Tem certeza que deseja sair?',
         message: 'Você não poderá usar o Portal até aceitar os Termos de Uso.',
         buttons: [
            {
               type: 'blank',
               text: 'Cancelar',
            },
            {
               type: 'filled',
               text: 'Sair',
               onClick: () => this.cancelTerms(),
            },
         ],
      }).openModal()
   }

   cancelTerms() {
      UserStorage.clearAllStorage()
      window.location.href = './index.html'
   }

   checkIfUserReadTerms() {
      if (this.isElementAtScrollBottom(this.userTerms)) {
         this.didUserReadTerms = true
         this.rightButton.attr('disabled', false)
      }
   }

   isElementAtScrollBottom(element) {
      return (
         element[0].scrollHeight - element[0].scrollTop === element[0].clientHeight
      )
   }


}
