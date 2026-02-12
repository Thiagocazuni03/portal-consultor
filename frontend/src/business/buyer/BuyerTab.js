import Tab from '../../components/Tab.js'
import InputForm from '../../core/InputForm.js'
import APIManager from '../../api/APIManager.js'
import PopUp from '../../core/PopUp.js'
import { APPLICATION, BUYER_URL } from '../../api/Variables.js'
import LoadingModal from '../../business/general/LoadingModal.js'
import UserStorage from '../../core/UserStorage.js'
import Modal from '../../core/Modal.js'

export default class BuyerTab extends Tab {
   constructor(config) {
      super({
         title: 'Novo Cliente',
         desc: 'Preencha as opções para criar um novo cliente.',
         rightButtonText: 'Continuar',
         leftButtonText: 'Cancelar',
         onRightButtonClick: () => this.tryToCreateBuyer(),
         onLeftButtonClick: () => this.close(),
         ...config
      })

      //Formulário de pesquisa
      this.buyerForm = new InputForm({ inputs: this.getFields() })

      //Inicializando
      this.appendToContent(this.buyerForm.getView())
   }  

   /**
    * Tenta criar um cliente
    */
   tryToCreateBuyer(){
      const mandatoryData = this.getFields().map(field => fiWeld.key)
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
      this.createBuyer(formData)
   }

   /**
    * Cria um parceiro
    */
   async createBuyer(allFormData){
      const loadingModal = new LoadingModal({ message: 'Aguarde, estamos realizando o __cadastro__ do cliente.', autoOpen: true })

      try{

         const createBuyerParams = await this.getCreateBuyerAPIParams(allFormData)
         const createBuyerResponse = await APIManager.doAPIRequest(BUYER_URL, createBuyerParams)
         const someErrorOcurred = createBuyerResponse.errorCode > 0
         
         if(someErrorOcurred) throw createBuyerResponse.errorMessage

         this.openCreateBuyerSucesssModal()
         this.config.callback({ 
            ...allFormData, 
            document: allFormData.document.replace(/[.-]/gi, ''),
            phone: allFormData.phone.replace(/[()-]/gi, ''),
            idClient: createBuyerResponse.identifier, 
            id: createBuyerResponse.id,
         })

      } catch(error){

         console.error(error)
         PopUp.triggerFail(`Parece que houve um erro ao tentar criar seu cliente. ${error}.`, this.tab)

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Abre um modal de confirmação de cadastro do cliente
    */
   openCreateBuyerSucesssModal(){
      new Modal({
         icon: 'ic-check',
         color: 'var(--green)',
         title: 'Concluído',
         autoOpen: true,
         message: 'Seu cliente foi __cadastrado__ com sucesso.',
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
   async getCreateBuyerAPIParams(formData){
      return {
         application: APPLICATION,
         type: 'register',
         search: '',
         data: {
            source: 1,
            identifier: this.createBuyerIdentifier(),
            member: await UserStorage.getMemberInfo('id'),
            document: formData.document.replace(/\D/, ''),
            ...formData
         }
      }
   }

   /**
    * Cria um identificador para o cliente 
    */
   createBuyerIdentifier(){
      const todayDate = new Date()
      const fullYear = String(todayDate.getFullYear())
      const month = String(todayDate.getMonth()).padStart(2, '0')
      const day = String(todayDate.getDay()).padStart(2, '0')
      const hours = String(todayDate.getHours()).padStart(2, '0')
      const minutes = String(todayDate.getMinutes()).padStart(2, '0')
      const seconds = String(todayDate.getSeconds()).padStart(2, '0')
      const randomNum = String(Math.floor(Math.random() * 999)).padStart(3, '0')

      return 'CLI' + fullYear + month + day + hours + minutes + seconds + randomNum
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
         },
         {
            key: 'document',
            label: 'Documento',
            mask: 'cpf',
            placeholder: 'Digite o número do documento',
            invalid: 'O documento não pode estar em branco'
         },
         {
            key: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'Digite o email',
            invalid: 'O não pode estar em branco',
         },
         {
            key: 'phone',
            label: 'Telefone',
            type: 'tel',
            mask: 'phone',
            placeholder: 'Digite o número de telefone',
            invalid: 'O telefone não pode estar em branco',
         },
         {
            key: 'birthdate',
            label: 'Data de Nascimento',
            type: 'date',
            invalid: 'A data de nascimento precisa ser preenchida'
         }

      ]

   }
   
}