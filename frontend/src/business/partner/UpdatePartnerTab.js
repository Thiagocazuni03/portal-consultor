import Tab from '../../components/Tab.js'
import InputForm from '../../core/InputForm.js'
import UserStorage from '../../core/UserStorage.js'
import Modal from '../../core/Modal.js'
import APIManager from '../../api/APIManager.js'
import { APPLICATION, PARTNER_URL } from '../../api/Variables.js'
import Translator from '../../translation/Translator.js'

export default class UpdatePartnerTab extends Tab {
   constructor(config) {
      super({
         title: Translator.tC('business:update-partner'),
         desc: Translator.tC('areas:description:update-partner'),
         leftButtonText: Translator.t('actions:delete'),
         rightButtonText: Translator.t('actions:update'),
         onLeftButtonClick: () => this.openDeleteConfirmation(),
         onRightButtonClick: () => this.tryToUpdatePartner(),
         ...config
      })

      //Inicializando
      this.createPartnersForm()
   }

   /**
    * Cria e adiciona o formulário para atualizar os dados
    */
   async createPartnersForm() {
      this.possibleSegments = await APIManager.getRepository('segment')
      this.partnersForm = new InputForm({ inputs: this.getFields(), values: { id: this.config.partnerData } })
      this.appendToContent(this.partnersForm.getView())
   }

   /**
    * Tenta atualizar o parceiro
    */
   async tryToUpdatePartner() {
      const updatePartnerData = { ...this.partnersForm.getValues(), id: this.config.partnerData.id }
      const updateParams = await this.getUpdateAPIParams(updatePartnerData)
      const updateRequest = await APIManager.doAPIRequest(PARTNER_URL, updateParams)
      const wasUpdateSuccess = updateRequest.errorCode === 0

      wasUpdateSuccess
         ? this.makeCallbackAndClose(updatePartnerData, false)
         : this.partnersForm.triggerError(updateRequest)
   }

   /**
    * Tenta excluir um parceiro
    */
   async tryToDeletePartner() {
      const deletePartnerData = this.config.partnerData
      const deleteParams = await this.getDeleteAPIParams(deletePartnerData)
      const deleteRequest = await APIManager.doAPIRequest(PARTNER_URL, deleteParams)
      const wasDeleteSuccess = deleteRequest.errorCode === 0

      wasDeleteSuccess
         ? this.makeCallbackAndClose(deletePartnerData, true)
         : this.partnersForm.triggerError(deleteRequest)
   }

   /**
    * Chama um callback e fecha a aba 
    */
   makeCallbackAndClose(updatedParnerData, wasDeletion) {
      wasDeletion
         ? this.config.onDelete(updatedParnerData)
         : this.config.onUpdate(updatedParnerData)

      this.close()
   }


   /**
    * Abre um modal para confirmar a exclusão do parceiro
    */
   openDeleteConfirmation() {
      new Modal({

         onBackspace: (modal) => modal.closeModal(),
         onEscape: (modal) => modal.closeModal(),
         onEnter: (modal) => {
            this.tryToDeletePartner()
            modal.closeModal()
         },
         uniqueToken: 'DELETE_PARTNER_MODAL',
         title: Translator.tC('common:warning') + '!',
         message: `${Translator.tC('prompt:delete-partner-confirmation')} ${Translator.tC('messages:action-is-irreversible')}` + '.',
         icon: 'ic-trash',
         autoOpen: true,
         color: 'var(--red)',

         buttons: [{
            type: 'blank',
            text: Translator.tC('actions:cancel'),
            closeOnClick: true
         }, {
            type: 'filled',
            text: Translator.tC('actions:confirm'),
            color: 'var(--red)',
            closeOnClick: true,
            onClick: () => this.tryToDeletePartner()
         }]
      })
   }


   /**
    * Retorna os parâmetros para atualizar um parceiro 
    */
   async getUpdateAPIParams({ name, email, phone, segment, id }) {
      return {
         'type': 'update',
         'application': APPLICATION,
         'data': {
            'member': await UserStorage.getMemberInfo('id'),
            'id': id,
            'name': name,
            'email': email,
            'phone': phone,
            'segment': JSON.parse(segment),
         }
      }
   }

   /**
    * Retorna os parâmetros para deletar um parceiro 
    */
   async getDeleteAPIParams({ id }) {
      return {
         'type': 'delete',
         'application': APPLICATION,
         'data': {
            'member': await UserStorage.getMemberInfo('id'),
            'id': id,
         }
      }
   }

   /**
    * Retorna os segmentos formatados para serem consumidos pelo formulário 
    */
   getFormatedSegments() {
      return this.possibleSegments.map(segment => {
         return {
            value: JSON.stringify(segment),
            text: segment.name
         }
      })
   }

   /**
    * Pega os campos do formulário 
    */
   getFields() {
      return [
         {
            key: 'name',
            type: 'text',
            value: this.config.partnerData.name,
            label: Translator.t('common:name'),
            placeholder: Translator.tC('type:partner-name'),
            invalid: Translator.tC('messages:name-cannot-be-blank')
         },
         {
            key: 'email',
            type: 'email',
            value: this.config.partnerData.email,
            label: Translator.t('common:email'),
            placeholder: Translator.tC('type:company-email'),
            invalid: Translator.tC('invalid:email-format')
         },
         {
            key: 'phone',
            label: Translator.t('common:phone'),
            value: this.config.partnerData.telephone,
            mask: 'phone',
            placeholder: Translator.tC('type:company-phone'),
            invalid: Translator.tC('invalid:phone-format')
         },
         {
            key: 'segment',
            label: Translator.t('common:segment'),
            type: 'select',
            options: this.getFormatedSegments()
         }
      ]
   }
}