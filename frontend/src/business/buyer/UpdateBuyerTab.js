import Tab from '../components/Tab.js'
import InputForm from '../core/InputForm.js'
import APIManager from '../api/APIManager.js'
import PopUp from '../core/PopUp.js'
import LoadingModal from '../general/LoadingModal.js'
import { APPLICATION, BUYER_URL } from '../api/Variables.js'
import UserStorage from '../core/UserStorage.js'
import Modal from '../core/Modal.js'

export default class UpdateBuyerTab extends Tab {
   constructor(config) {
      super({
         title: 'Atualizar Cliente',
         desc: 'Preencha as opções para atualizar o novo cliente.',
         rightButtonText: 'Atualizar',
         leftButtonText: 'Cancelar',
         onRightButtonClick: () => this.tryToUpdateBuyer(),
         onLeftButtonClick: () => this.close(),
         ...config
      })

      //Formulário de pesquisa
      this.buyerData = this.config.buyerData
      this.buyerForm = new InputForm({ inputs: this.getFields(), })

      //Inicializando
      this.appendToContent(this.buyerForm.getView())
   }  

   /**
    * Tenta criar um cliente
    */
   tryToUpdateBuyer(){
      const mandatoryData = this.getFields().map(field => field.key)
      const formData = this.buyerForm.getValues()
      const invalidFields = mandatoryData.filter(key => !String(formData[key] ?? '').trim())

      //Caso houver algum erro
      if(invalidFields.length > 0){
         this.buyerForm.triggerError({
            errorMessage: 'Dados Inválidos',
            errorCode: 1,
            invalid: invalidFields
         })
         return
      }

      //Cria o parceiro
      this.updateBuyer(formData)
   }

   /**
    * Atualiza um parceiro
    */
   async updateBuyer(allFormData){
      const loadingModal = new LoadingModal({ message: 'Aguarde, estamos __atualizando__ o cadastro do cliente.', autoOpen: true })

      try{

         
         const updateBuyerParams = await this.getUpdateBuyerAPIParams({ ...allFormData, id: this.buyerData.id, identifier: this.buyerData.idClient })
         const updateBuyerResponse = await APIManager.doAPIRequest(BUYER_URL, updateBuyerParams)
         const someErrorOcurred = updateBuyerResponse.errorCode > 0

         if(someErrorOcurred) throw updateBuyerResponse.errorMessage

         this.openUpdateBuyerSucessModal()
         this.config.callback({ ...allFormData, id: this.buyerData.id, idClient: this.buyerData.idClient })

      } catch(error){

         console.error(error)
         PopUp.triggerFail(`Parece que houve um erro ao tentar atualizar seu cliente. ${error}.`, this.tab)

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Abre um modal de confirmação de cadastro do cliente
    */
   openUpdateBuyerSucessModal(){
      new Modal({
         icon: 'ic-check',
         color: 'var(--green)',
         title: 'Atualizado',
         autoOpen: true,
         message: 'Seu cliente foi __atualizado__ com sucesso.',
         onEscape: (modal) => modal.closeModal(),
         onEnter: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         onClose: () => this.close(),
         buttons: [{ type: 'filled', text: 'Fechar', color: 'var(--green)' }]
      })
   }

   /**
    * Retorna os parametro da api para criar o cliente 
    */
   async getUpdateBuyerAPIParams(formData){
      return {
         application: APPLICATION,
         type: 'update',
         search: '',
         data: {
            source: 1,
            document: formData.document.replace(/\D/, ''),
            member: await UserStorage.getMemberInfo('id'),
            ...formData
         }
      }
   }

   /**
    * Retorna os campos do formulário do cliente 
    */
   getFields() {
      return [
         {
            key: 'name',
            label: 'Nome',
            placeholder: 'Digite o nome do cliente',
            invalid: 'O nome não pode estar em branco',
            value: this.buyerData.name
         },
         {
            key: 'document',
            label: 'Documento',
            mask: 'cpf',
            placeholder: 'Digite o número do documento',
            invalid: 'O documento não pode estar em branco',
            value: this.buyerData.document
         },
         {
            key: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'Digite o email',
            invalid: 'O não pode estar em branco',
            value: this.buyerData.email
         },
         {
            key: 'phone',
            label: 'Telefone',
            type: 'tel',
            mask: 'phone',
            placeholder: 'Digite o número de telefone',
            invalid: 'O telefone não pode estar em branco',
            value: this.buyerData.phone
         },
         {
            key: 'birthdate',
            label: 'Data de Nascimento',
            type: 'date',
            invalid: 'A data de nascimento precisa ser preenchida',
            value: this.buyerData.birthdate
         }
      ]
   }
}