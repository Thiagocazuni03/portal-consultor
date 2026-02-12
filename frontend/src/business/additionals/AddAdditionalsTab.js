import InputForm from '../../core/InputForm.js'
import Tab from '../../components/Tab.js'
import UserStorage from '../../core/UserStorage.js'
import APIManager from '../../api/APIManager.js'
import PopUp from '../../core/Modal.js'
import LoadingModal from '../general/LoadingModal.js'
import { SERVICES_URL } from '../../api/Variables.js'

export default class AdditionalsTab extends Tab {
   constructor(config) {
      super({
         title: 'Novo Adicional',
         desc: 'Preencha os campos abaixo para criar um novo adicional.',
         leftButtonText: 'Cancelar',
         rightButtonText: 'Adicionar',
         onLeftButtonClick: () => this.close(),
         onRightButtonClick: () => this.tryToCreateService(),
         ...config
      })

      //Formulário
      this.serviceForm = new InputForm({
         inputs: this.getFields(),
         showRequired: true
      })

      //Inicializando
      this.appendToContent(this.serviceForm.getView())
   }

   /**
    * Tenta criar um parceiro e chamar o callback após
    */
   async tryToCreateService() {
      const loadingModal = new LoadingModal({ message: 'Um momento, estamos __registrando__ seu adicional.' })

      try{

         loadingModal.openModal()

         const serviceData = await this.getRegisterAPISettings(this.serviceForm.getValues())
         const createServiceResponse = await APIManager.doAPIRequest(SERVICES_URL, serviceData)
         const wasSucessfull = createServiceResponse.errorCode === 0

         wasSucessfull
            ? this.makeCallbackAndClose({ ...serviceData, id: Number(createServiceResponse.id), action: 1 })
            : this.serviceForm.triggerError(createServiceResponse)

      } catch(error){

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro interno ao salvar o serviço, contato o desenvolvedor.', this.tab)

      } finally{

         loadingModal.closeModal()

      }
   }

   /**
    * Chama o callback com os dados do parceiro criado 
    */
   makeCallbackAndClose(serviceData) {
      this.config.afterChange(serviceData)
      this.close()
   }

   /**
    * Retorna os dados da api para serem 
    */
   async getRegisterAPISettings({ service, price }) {
      return {
         'type': 'register',
         'application': await UserStorage.getKeyInfo('application'),
         'member': await UserStorage.getMemberInfo('id'),
         'service': service,
         'price': (price.replace(/^R\$ /gi, '') ?? '0')
      }
   }

   /**
    * Retorna os campos dos formulários para serem criados 
    */
   getFields() {
      return [
         {
            key: 'service',
            type: 'text',
            placeholder: 'Digite o nome do adicional',
            label: 'Nome',
            isOptional: false,
            invalid: 'O nome não pode estar vazio'
         },
         {
            key: 'price',
            placeholder: 'Digite o preço do adicional',
            label: 'Preço',
            isOptional: false,
            invalid: 'Digite um preço válido',
            value: '0',
            mask: 'price'
         }
      ]
   }
}