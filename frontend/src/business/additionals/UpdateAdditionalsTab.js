import InputForm from '../../core/InputForm.js'
import Tab from '../../components/Tab.js'
import UserStorage from '../../core/UserStorage.js'
import Modal from '../../core/Modal.js'
import APIManager from '../../api/APIManager.js'
import LoadingModal from '../general/LoadingModal.js'
import PopUp from '../../core/PopUp.js'
import { APPLICATION, CURRENCY, SERVICES_URL } from '../../api/Variables.js'

export default class UpdateAdditionalsTab extends Tab {
   constructor(config) {
      super({
         title: 'Atualizar adicional',
         desc: 'Atualize os campos abaixo para mudar o adicional',
         leftButtonText: 'Remover',
         rightButtonText: 'Atualizar',
         onLeftButtonClick: () => this.openDeleteConfirm(),
         onRightButtonClick: () => this.tryToUpdateService(),
         ...config
      })

      //Dados
      this.service = this.config.service

      //Formulário
      this.serviceForm = new InputForm({
         inputs: this.getFields()
      })

      //Montando
      this.appendToContent(this.serviceForm.getView())
   }


   /**
    * Tenta atualizar o serviço
    */
   async tryToUpdateService() {
      const loadingModal = new LoadingModal({ message: 'Um momento, estamos __atualizando__ o seu adicional.' })
      const formValues = this.serviceForm.getValues()
      const isSameData = this.service.service === formValues.service && parseFloat(this.service.price) === parseFloat(formValues.price)

      if (isSameData) {
         PopUp.triggerFail('Nenhum dado foi alterado.', this.tab, 'NO_SERVICE_CHANGE_ERROR')
         return
      }

      try {

         loadingModal.openModal()

         const updateParams = await this.getUpdateAPISettings(formValues)
         const updateRequest = await APIManager.doAPIRequest(SERVICES_URL, updateParams)
         const wasSucessfull = updateRequest.errorCode === 0

         wasSucessfull
            ? this.makeCallbackAndClose({ ...this.service, ...formValues, price: formValues.price.replace(CURRENCY + ' ', ''), action: 2 })
            : this.serviceForm.triggerError(updateRequest)

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro ao atualizar o seu serviço. Contate o desenvolvedor.', this.tab, 'UPDATE_SERVICE_ERROR')

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Tenta deletar o serviço
    */
   async tryToDeleteService() {
      const loadingModal = new LoadingModal({ message: 'Um momento, estamos __deletando__ seu serviço.' })

      try {

         loadingModal.openModal()

         const deleteParams = await this.getDeleteAPISettings()
         const deleteResponse = await APIManager.doAPIRequest(SERVICES_URL, deleteParams)
         const someErrorOcurred = deleteResponse.errorCode > 0

         if (someErrorOcurred) throw new Error(deleteResponse.errorMessage)

         this.makeCallbackAndClose({ ...this.service, action: 3 })

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro ao deletar seu serviço. Contate o desenvolvedor.', this.tab, 'DELETE_SERVICE_ERROR')

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Retorna os parâmetros da API de atualizar
    */
   async getUpdateAPISettings({ service, price }) {
      return {
         'type': 'update',
         'application': APPLICATION,
         'member': await UserStorage.getMemberInfo('id'),
         'id': this.config.service.id,
         'service': service,
         'price': price.replace(/^R\$ /gi, '')
      }
   }

   /**
    * Retorna os parâmetros da API de deletar
    */
   async getDeleteAPISettings() {
      return {
         'type': 'delete',
         'application': APPLICATION,
         'member': await UserStorage.getMemberInfo('id'),
         'id': this.service.id,
      }
   }

   /**
    * Abre a confirmação de deletar um serviço
    */
   openDeleteConfirm() {
      new Modal({
         title: 'Excluir serviço?',
         message: 'Tem certeza? Essa ação é __irreversível__.',
         icon: 'ic-trash',
         autoOpen: true,
         color: 'var(--red)',
         buttons: [{
            type: 'blank',
            text: 'Cancelar'
         }, {
            type: 'filled',
            text: 'Excluir',
            color: 'var(--red)',
            onClick: () => this.tryToDeleteService()
         }]
      })
   }

   /**
    * Chama o callback e fecha a aba 
    */
   makeCallbackAndClose(serviceData) {
      this.config.afterChange(serviceData)
      this.close()
   }

   /**
    * Retorna os campos do formulário para serem criados 
    */
   getFields() {
      return [
         {
            key: 'service',
            value: this.config?.service?.service,
            type: 'text',
            placeholder: 'Digite o nome do adicional',
            label: 'Nome',
            invalid: 'O nome não pode estar vazio'
         },
         {
            key: 'price',
            placeholder: 'Digite o preço do adicional',
            label: 'Preço',
            invalid: 'Digite um preço válido',
            value: this.config?.service?.price,
            mask: 'price'
         }
      ]
   }
}