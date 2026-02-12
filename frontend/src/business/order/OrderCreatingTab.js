import Tab from '../../components/Tab.js'
import LoadingModal from '../../business/general/LoadingModal.js'
import InputForm from '../../core/InputForm.js'
import UserStorage from '../../core/UserStorage.js'
import Session from '../../core/Session.js'
import APIManager from '../../api/APIManager.js'
import FolderManager from '../../core/FolderManager.js'
import PopUp from '../../core/PopUp.js'
import { API_KEY, APPLICATION, DRAFTS_FOLDER_PATH,API_BASE_URL2, ORDER_DATA_FILE_NAME, ORDER_URL } from '../../api/Variables.js'
import { IDToken } from '../../utils/IDToken.js'
import Translator from '../../translation/Translator.js'
import Utils from '../../core/Utils.js'

export default class OrderCreatingTab extends Tab {
   constructor(config) {
      super({
         title: Translator.t('actions:new-sale'),
         desc: Translator.t('messages:fill-the-form-below'),
         leftButtonText: Translator.tC('actions:cancel'),
         rightButtonText: Translator.tC('actions:continue'),
         onLeftButtonClick: () => this.close(),
         onRightButtonClick: () => this.tryToCreateDraft(),
         ...config
      })

      //Estado
      this.administrators = []
      this.buildings = []
      this.partners = []

      //Inicializando
      this.initialize()
   }

   /**
    * Busca os dados necessários e cria o formulário
    */
   async initialize() {
      await this.fetchNeededData()

      //Formulário
      this.saleForm = new InputForm({
         inputs: this.getFields(),
         height: '100%',
         values: {
            administrator: this.administrators.length === 1 ? this.administrators[0] : null
         }
      })

      //Modal de loading
      this.loadingModal = new LoadingModal({
         title: 'Aguarde',
         message: 'Estamos __registrando__ seu orçamento.'
      })

      this.appendToContent(this.saleForm.getView())
   }

   /**
    * Busca os dados necessários para criar o formulário
    */
   async fetchNeededData() {
      [this.buildings, this.partners, this.administrators, this.sellerID] = await Promise.all([
         APIManager.getRepository('building'),
         APIManager.getPartners(),
         UserStorage.getMemberInfo('administrators'),
         UserStorage.getSellerInfo('id')
      ])
   }

   /**
    * Tenta criar um draft com os valores do Orçamento
    */
   async tryToCreateDraft() {
      try {

         const formValues = this.saleForm.getValues()
         const formErrors = this.getFormErrors()
         const hasSomeError = formErrors.length > 0
         const errorObject = {
            errorMessage: 'Dados inválidos',
            errorCode: 1,
            invalid: formErrors
         }

         //Caso houver um erro
         if (hasSomeError) {
            this.saleForm.triggerError(errorObject)
            return
         }

         //Criando o draft
         this.postNewDraft(await this.createDraftJSON(formValues))

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro ao juntar as informações para criar o orçamento.', this.tab, 'CREATE_DRAFT_ERROR')

      }
   }

   /**
    * Retorna as informações que necessárias do Seller para criar uma venda
    */
   async getNeededSellerInfo() {
      const [id, name] = await Promise.all([
         UserStorage.getSellerInfo('id'),
         UserStorage.getSellerInfo('name')
      ])

      return {
         id,
         name
      }
   }

   /**
    * Retorna as informações necessárias do Member para criar uma venda 
    */
   async getNeededMemberInfo() {
      const [id, name, nickname, document, identifier] = await Promise.all([
         UserStorage.getMemberInfo('id'),
         UserStorage.getMemberInfo('name'),
         UserStorage.getMemberInfo('nickname'),
         UserStorage.getMemberInfo('document'),
         UserStorage.getMemberInfo('identifier'),
      ])

      return {
         id,
         name,
         nickname,
         document,
         identifier
      }
   }

   /**
    * Retorna as informações necessárias do Buyer para criar uma venda 
    */
   getFormatedBuyerInfo({ document, email, name, phone }) {
      return {
         document,
         email,
         name,
         phone
      }
   }

   async createDraftJSON(formValues) {

      console.log('createDraftJSON');
      
      //Pegando informações asíncronas
      const [allEmployees, sellerInfo, memberInfo, customerProfile, securityLevels] = await Promise.all([
         this.getAllMemberEmployees(),
         this.getNeededSellerInfo(),
         this.getNeededMemberInfo(),
         await UserStorage.getMemberInfo('customerProfile'),
         await UserStorage.getMemberInfo('securityLevels'),
      ])

      //Outras informações
      const buyerInfo = this.getFormatedBuyerInfo(formValues)
      const building = formValues.building
      const partner = formValues.partner
      const administrator = formValues.administrator
      const sourceNumber = navigator.userAgentData.mobile ? 2 : 1

      // const response =  {
      //    application: APPLICATION,
      //    order: {
      //       source: sourceNumber,
      //       action: 1,
      //       draft: true,
      //       created: this.getTodayDateFormated(),
      //       token: new IDToken().getToken().slice(0, 10),
      //       order: {
      //          ...allEmployees,
      //          identifier: new IDToken().getToken().slice(0, 10),
      //          costcenter: null,
      //          products: null,
      //          customerProfile,
      //          securityLevels,
      //          administrator,
      //          building,
      //          partner,
      //          member: memberInfo,
      //          buyer: buyerInfo,
      //          seller: sellerInfo,
      //          extract: {
      //             products: 0,
      //             discount: 0,
      //             addition: 0,
      //             order: 0
      //          },
      //       },
      //    }
      // }
 
      // console.log(response)
      // debugger
      // return response
      //thiago cazuni 

       return {
         application: APPLICATION,
         key:API_KEY,
         type: 'draft',
         params:{
            order: { 
               created: this.getTodayDateFormated(),   
               source: sourceNumber,
               identifier: Utils.generateUniqueToken('DRA'),
               ...allEmployees,
               // new IDToken().getToken().slice(0, 10),
               costcenter: null,
               products: null,
               customerProfile,
               securityLevels,
               administrator,
               building,
               partner,
               member: memberInfo,
               buyer: buyerInfo,
               seller: sellerInfo,
               extract: {
                  products: 0,
                  discount: 0,
                  addition: 0,
                  order: 0
               },
            },
         }
      }
   }

   /**
    * Retorna os tipos de obra para usar no select 
    */
   getBuildingsAsOptions() {
      return this.buildings.map(building => {
         return {
            value: building,
            text: building.name
         }
      })
   }

   /**
    * Retorna os parceiros para usar no select
    */
   getPartnersAsOptions() {
      return (this.partners ?? []).map(partner => {
         return {
            value: partner,
            text: partner.name
         }
      })
   }

   /**
    * Retorna os parceiros para usar no select (Caso necessário)
    */
   getAdministratorsAsOptions() {
      return (this.administrators ?? []).map(admin => {
         return {
            value: admin,
            text: admin.name
         }
      })
   }

   /**
    * Cria um draft
    */
   // async postNewDraft(draftJSON) {
      
   //    try {

   //       this.loadingModal.openModal()

   //       const createOrderResponse = await APIManager.doAPIRequest(ORDER_URL, draftJSON)
         
   //       const someErrorOcurred = createOrderResponse.errorCode > 0
   //       const draftID = createOrderResponse.identifier
   //       const draftNumber = createOrderResponse.id

   //       someErrorOcurred
   //          ? this.saleForm.triggerError(createOrderResponse)
   //          : this.storeDraftJSONOnFolder(draftID, draftJSON, draftNumber).then(() => this.goToCatalog(draftID, draftNumber))

   //    } catch (error) {

   //       console.error(error)
   //       PopUp.triggerFail('Parece que houve um erro ao tentar criar seu orçamento', this.tab, 'CREATE_DRAFT_ERROR')
   //       this.loadingModal.closeModal()

   //    }
   // }
   // thiago cazuni 
     async postNewDraft(draftJSON) {
      
      try {

         this.loadingModal.openModal()
 
         // console.log(draftJSON);
         // debugger
          
         const createOrderResponse = await APIManager.doAPIRequest(API_BASE_URL2 + 'draft/create', draftJSON)
         const someErrorOcurred = createOrderResponse.errorCode > 0
         const draftID = createOrderResponse.identifier
         const draftNumber = createOrderResponse.id

 
         someErrorOcurred
            ? this.saleForm.triggerError(createOrderResponse)
            : this.storeDraftJSONOnFolder(draftID, draftJSON, draftNumber).then(() => this.goToCatalog(draftID, draftNumber))

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro ao tentar criar seu orçamento', this.tab, 'CREATE_DRAFT_ERROR')
         this.loadingModal.closeModal()

      }
   }

   /**
    * Salva os dados da order na pasta do orçamento
    */
   async storeDraftJSONOnFolder(draftID, draftJSON, draftNumber) {

      console.log("draftJSON");
      console.log(draftJSON);

      const folderManager = new FolderManager(DRAFTS_FOLDER_PATH, draftID)
      const jsonToStore = await this.getDraftDataToStore(draftJSON, draftID, draftNumber)
       
      // await folderManager.create(ORDER_DATA_FILE_NAME, jsonToStore, 'json')
   }

   /**
    * Retorna os dados que devem ser salvos no bucket
    */
   async getDraftDataToStore(draftJSON, draftID, draftNumber) {
     
      
      const clonedJSON = structuredClone(draftJSON)

      //Pegando dados da storage para guardar
      const [sellerImage, sellerEmail, sellerPhone, sellerDocument, memberImage] = await Promise.all([
         UserStorage.getSellerInfo('image'),
         UserStorage.getSellerInfo('email'),
         UserStorage.getSellerInfo('phone'),
         UserStorage.getSellerInfo('document'),
         UserStorage.getMemberInfo('image')
      ])

      //Adicionando os dados
      clonedJSON.params.order.id = Number(draftNumber)
      clonedJSON.params.order.identifier = draftID
      clonedJSON.params.order.seller.image = sellerImage
      clonedJSON.params.order.seller.email = sellerEmail
      clonedJSON.params.order.seller.phone = sellerPhone
      clonedJSON.params.order.seller.document = sellerDocument
      clonedJSON.params.order.member.image = memberImage
 
      //Deletando informações inúteis
      delete clonedJSON.params.order.action
      delete clonedJSON.params.order.draft
 
      return clonedJSON
   }

   /**
    * Vai para a página do catalogo e coloca na sessão o ID do Draft 
    */
   goToCatalog(draftID, draftNumber) {
      Session.set('currentDraftIndex', draftNumber)
      Session.set('currentDraftID', draftID)
      window.location.href = 'catalog.html'
   }

   /**
    * Retorna um objeto com todos os empregados necessários para criar um Draft
    */
   async getAllMemberEmployees() {
      const neededEmployees = this.getNeededEmployees()
      const allFoundEmployees = await this.getAllPresentEmployees(neededEmployees)

      return allFoundEmployees
   }

   /**
    * Busca todos os empregados na storage 
    */
   async getAllPresentEmployees(neededEmployees) {
      return Object.fromEntries(
         await Promise.all(
            neededEmployees.map(async employee => {
               return [employee, await UserStorage.getMemberInfo(employee)]
            })
         )
      )
   }

   /**
    * Retorna a lista de empregados que devem ser passados para criar o draft 
    */
   getNeededEmployees() {
      return [
         'partner',
         'building',
         'company',
         'administrator',
         'consultant',
         'attendant',
         'supervisor',
         'coordinator',
         'manager',
         'director',

      ]
   }
   /**
    * Retorna a data atual formatada 
    */
   // getTodayDateFormated() {
   //    const dateNow = new Date()
   //    const dateString = `${dateNow.getFullYear()}-${dateNow.getMonth()}-${dateNow.getDate()}`
   //    const timeString = `${dateNow.getHours()}:${dateNow.getMinutes()}`

   //    return `${dateString} ${timeString}`
   // }

   getTodayDateFormated() {
      const d = new Date()

      const ano = d.getFullYear()
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const dia = String(d.getDate()).padStart(2, '0')

      const hora = String(d.getHours()).padStart(2, '0')
      const minuto = String(d.getMinutes()).padStart(2, '0')
      const segundo = String(d.getSeconds()).padStart(2, '0')

      return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`
   }

   /**
    * Retorna os valores vazios do formulário 
    */
   getFormErrors() {
      const necessaryKeys = ['name']
      const currentFormValues = this.saleForm.getValues()
      const formInvalidities = necessaryKeys.filter(key => !currentFormValues[key])

      return formInvalidities
   }

   /**
    * Retorna os campos para criar o formulário da venda 
    */
   getFields() {
      const administrators = this.getAdministratorsAsOptions()
      const fields = [
         {
            key: 'name',
            label: Translator.t('common:customer'),
            placeholder: 'Digite o nome do cliente',
            invalid: 'O nome não pode estar em branco',
         },
         {
            key: 'document',
            label: Translator.t('common:document'),
            mask: 'cpf',
            isOptional: true,
            placeholder: 'Digite o documento do cliente',
         },
         {
            key: 'email',
            label: 'Email',
            type: 'email',
            isOptional: true,
            placeholder: 'Digite o email do cliente',
         },
         {
            key: 'phone',
            label: Translator.t('common:phone'),
            type: 'tel',
            mask: 'phone',
            isOptional: true,
            placeholder: 'Digite o telefone do cliente',
         },
         {
            key: 'building',
            label: Translator.t('common:build-type'),
            type: 'select',
            options: this.getBuildingsAsOptions()
         },
         {
            key: 'partner',
            label: `${Translator.t('professions:architect')} / ${Translator.t('professions:designer')}`,
            type: 'select',
            isOptional: true,
            options: [{ text: 'Sem parceiro', value: null }, ...this.getPartnersAsOptions()]
         },
         {
            key: 'administrator',
            label: Translator.tC('common:manager'),
            type: 'select',
            staticValue: true,
            value: administrators.find(admin => admin.value.id === this.sellerID),
            options: administrators,
            willCreate: () => administrators.length > 1
         },
      ]

      return fields
   }
}