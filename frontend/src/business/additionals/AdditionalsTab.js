import Tab from '../../components/Tab.js'
import UserStorage from '../../core/UserStorage.js'
import AddAdditionalsTab from './AddAdditionalsTab.js'
import UpdateAdditionalsTab from './UpdateAdditionalsTab.js'
import Renderer from '../../core/Renderer.js'
import APIManager from '../../api/APIManager.js'
import PopUp from '../../core/PopUp.js'
import MoneyViewer from '../../core/MoneyViewer.js'
import { APPLICATION, SERVICES_URL } from '../../api/Variables.js'
import Item from '../../core/Item.js'

export default class AdditionalsTab extends Tab {
   constructor(config) {
      super({
         title: 'Adicionais',
         desc: 'Lista de adicionais para adicionar em seu orçamento',
         leftButtonText: 'Fechar',
         rightButtonText: 'Novo adicional',
         onLeftButtonClick: () => this.close(),
         onRightButtonClick: () => new AddAdditionalsTab({ afterChange: (service) => this.handleListChange(service) }).open(),
         ...config
      })

      //Render
      this.servicesRender = new Renderer({
         items: [],
         hasAnimation: true,
         hasLoader: true,
         identifierKey: 'id',
         rowGap: '0.75rem',
         hasGoToTopButton: false,
         css: 'isServiceRenderer',
         messageOnEmpty: 'Você não possui nenhum serviço',
         createFunc: (serviceData, index) => this.createService(serviceData, index),
         sortFunc: (services) => this.sortServicesById(services)
      })

      //Inicializando
      this.appendToContent(this.servicesRender.getView())
      this.initialize()
   }

   /**
    * Busca os serviços
    */
   async initialize() {
      try {

         const listServicesParams = await this.getServicesListAPIParams()
         const servicesResponse = await APIManager.doAPIRequest(SERVICES_URL, listServicesParams)
         const someErrorOcurred = servicesResponse.errorCode > 1
         const allItems = (servicesResponse?.itens ?? [])

         if (someErrorOcurred) {
            this.servicesRender.setItems([])
            this.servicesRender.setupFailMessage('Parece que algo deu errado.')
            throw new Error(servicesResponse.errorMessage)
         }

         if (allItems.length === 0) {
            this.servicesRender.setItems([])
            return
         }

         this.servicesRender.setItems(allItems)

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro ao listar seus serviços. Contate o desenvolvedor.', this.tab)

      }
   }

   /**
    * Retorna os parâmetros para listar os serviços
    */
   async getServicesListAPIParams() {
      return {
         'type': 'list',
         'application': APPLICATION,
         'member': await UserStorage.getMemberInfo('id')
      }
   }

   /**
    * Lida após a inserção e atualização de um serviço
    */
   handleListChange(service) {
      const actions = {

         1: () => this.servicesRender.addItems(service),
         2: () => this.servicesRender.editItem(service.id, service),
         3: () => this.servicesRender.deleteItem(service.id)

      }[service.action]()
   }


   /**
    * Retorna os items sorteados pelo ID de criação  
    */
   sortServicesById(itens) {
      return itens.sort((itemA, itemB) => Number(itemB.id) - Number(itemA.id))
   }

   /**
    * Cria um serviço que pode ser clicado para abrir uma aba 
    */
   createService({ service, price, }, index) {

      //Valor do serviço
      const serviceMoney = new MoneyViewer({
         value: price,
      })

      //Quando for clicado
      const serviceClick = (event) => {
         new UpdateAdditionalsTab({
            autoOpen: true,
            service: arguments[0],
            afterChange: (service) => this.handleListChange(service)
         })
      }
      
      //O item em si
      const serviceItem = new Item({
         onClick: (event) => serviceClick(event),
         columns: ['2fr', '1fr'],
         style: {
            item: {
               cursor: 'pointer',
               boxShadow: '0 5px 8px 0 var(--shadow)'
            },
            left: {
               justifyContent: 'center'
            },
            right: {
               alignItems: 'flex-end',
               justifyContent: 'flex-end',
            }
         },
         left: [
            Item.brand('#' + (index + 1)),
            Item.title(service),
         ],
         right: [
            serviceMoney.getView()
         ]
      })


      return serviceItem.getView()
   }
}