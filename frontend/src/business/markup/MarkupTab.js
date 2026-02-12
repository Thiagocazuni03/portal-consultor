import Tab from '../../components/Tab.js'
import APIManager from '../../api/APIManager.js'
import Renderer from '../../core/Renderer.js'
import PopUp from '../../core/PopUp.js'
import Item from '../../core/Item.js'
import { APPLICATION, PRICING_URL, STORAGE_URL } from '../../api/Variables.js'
import SearchBar from '../../core/SearchBar.js'
import Utils from '../../core/Utils.js'
import MarkupUpdateTab from './MarkupUpdateTab.js'
import { Icon, Input } from '../../utils/Prototypes.js'
import Modal from '../../core/Modal.js'
import InputFrom from '../../core/InputForm.js'
import LoadingModal from '../general/LoadingModal.js'
import UserStorage from '../../core/UserStorage.js'
import 'jquery-ui'


export default class MarkupTab extends Tab {
   constructor(config) {
      super({
         title: 'Markup',
         desc: 'Configure e adicione seu markup nos produtos disponíveis',
         css: 'hasContentSidePadding',
         leftButtonText: 'Fechar',
         rightButtonText: 'Salvar',
         onLeftButtonClick: () => this.close(),
         onRightButtonClick: () => this.close(),
         ...config
      })

      //Estado
      this.searchText = ''
      this.categorySelected = null
      this.products = []
      this.categories = []

      this.updateAllBtn = new Icon('SP__header__options__icon ic-update')

      //Render
      this.pricingRender = new Renderer({
         items: [],
         style: { paddingBottom: '10rem' },
         hasAnimation: true,
         rowGap: '0.75rem',
         css: 'noInnerPadding',
         iconOnEmpty: 'ic-close',
         hasGoToTopButton: false,
         messageOnEmpty: 'Não há nenhum produto disponível.',
         createFunc: (product, index) => this.createProduct(product, index),
         sortFunc: (products) => this.sortProducts(products),
         filterFunc: (products) => this.filterProducts(products)
      })

      this.updateAllBtn.click(() => PopUp.triggerInfo('Aguarde o carregamento dos produtos.', this.tab))

      //Incializando
      this.prependToOptions(this.updateAllBtn)
      this.appendToContent(this.pricingRender.getView())
      this.initialize()
   }

   /**
    * Inicializa e busca pelos produtos
    */
   async initialize() {
      try {

         [this.products, this.categories] = await Promise.all([
            APIManager.getProducts(),
            APIManager.getRepository('category')
         ])

         //Caso não houver nenhum produto
         if (!this.products.length) {
            this.pricingRender.setItems([])
            this.pricingRender.setupEmptyMesssage()
            return
         }

         this.pricingRender.setItems(this.products)

         const options = (this.categories ?? []).map(category => ({
            text: category.name,
            value: category.id
         }))

         options.unshift({
            text: 'Tudo',
            value: null
         })
      
         //Barra de pesquisa
         this.searchBar = new SearchBar({
            onClear: () => this.updateFilter({ search: '' }),
            onInput: ({ target }) => this.updateFilter({ search: target.value }),
            placeholder: 'Nome do produto...',
            style: { zIndex: 3 },
            css: 'isBordered',
            options: options.length ? [{
               onChange: ({ value }) => this.updateFilter({ category: value }),
               type: 'select',
               label: 'Categoria',
               options: options
            }] : []
         })

         this.updateAllBtn.unbind('click')
         this.updateAllBtn.click(() => this.openUpdateAllMenu())

         this.prependToContent(this.searchBar.getView())

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um erro ao buscar os produtos.', this.tab, 'MARKUP_API_ERROR')

      }
   }

   /***
    * Sorteia os produtos na ordem certa
    */
   sortProducts(products) {
      return products.sort((productA, productB) => productA.sort === null ? 9999 : productA.sort - productB.sort)
   }

   /**
    * Abre o menu de atualziar a porcentagem de todos os produtos
    */
   openUpdateAllMenu() {
      const form = new InputFrom({
         css: 'isMarkupForm',
         showRequired: false,
         inputs: [{
            value: '%',
            align: 'right',
            key: 'percent',
            type: 'text',
            mask: 'percent',
            label: 'Novo Markup'
         }]
      })

      const handleConfirm = (modal) => {
         const newMarkup = form.getValues().percent ?? '0%'
         const isValid = newMarkup !== '%'

         if (!isValid) {
            PopUp.triggerFail('Valor percentual inválido.')
            return
         }

         this.openFinalUpdateAllConfirmation(form.getValues().percent)

         modal.closeModal()
      }

      new Modal({
         icon: 'ic-update',
         color: 'var(--green)',
         title: 'Resetar Markups?',
         message: 'Informe o novo markup que será aplicado em __todos seus produtos__.',
         autoOpen: true,
         appendToContent: form.getView(),
         buttons: [
            { type: 'blank', text: 'Cancelar' },
            { type: 'filled', text: 'Alterar', color: 'var(--green)', closeOnClick: false, onClick: (modal) => handleConfirm(modal) }
         ]
      })
   }

   openFinalUpdateAllConfirmation(percent = '0%') {
      new Modal({
         autoOpen: true,
         icon: 'ic-warning',
         color: 'var(--red)',
         title: 'Atenção!',
         message: `Você está prestes a alterar o markup de __todos__ seus produtos para __${percent}__, isso __excluirá__ todos os registros internos de seus markups e trocará o __markup base__ de todos produtos para esta nova porcentagem. __Deseja continuar?__`,
         buttons: [
            { type: 'blank', text: 'Cancelar' },
            { type: 'filled', text: 'Continuar', color: 'var(--red)', onClick: () => this.resetAllMarkups(percent) }
         ]
      })
   }

   async resetAllMarkups(percent){
      const loadingModal = new LoadingModal({ autoOpen: true, message: 'Estamos atualizando seus markups...'})

      try{

         const markup = {
            product: percent
         }

         const params = {
            application: APPLICATION,
            type: 'reset',
            member: await UserStorage.getMemberInfo('id'),
            id: this.products.map(product => product.id),
            markup: markup
         }
         const response = await APIManager.doAPIRequest(PRICING_URL, params)
         const someErrorOcurred = response.errorCode !== 0
         
         if(someErrorOcurred) throw new Error(response.errorMessage)

         new Modal({
            autoOpen: true,
            color: 'var(--green)',
            title: 'Sucesso!',
            icon: 'ic-money-sign',
            message: `Todos seus markups foram __atualizados__ para __${percent}__ com sucesso!`,
            buttons: [{ color: 'var(--green)', type: 'filled', text: 'Fechar' }]
         })

      } catch(error){

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro ao resetar seus markups. Contate o desenvolvedor.')

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Seta o texto de pesquisa 
    */
   updateFilter({ search = this.searchText, category = this.categorySelected }) {
      this.searchText = Utils.normalizeString(search)
      this.categorySelected = category

      this.pricingRender.messageOnEmpty = (this.searchText || this.categorySelected) ? 'Nenhum produto foi encontrado.' : 'Nenhum produto disponível encontrado.'
      this.pricingRender.renderItems()
   }

   /**
    * Cria um produto
    */
   createProduct({ image, title, model, category }, index) {
      return new Item({
         onClick: () => new MarkupUpdateTab({ product: arguments[0] }).open(),
         style: { center: { justifyContent: 'center' } },
         view: true,
         cursor: 'pointer',
         columns: ['65px', '1fr', '0px'],
         left: Item.image(STORAGE_URL + image),
         center: [
            Item.title(title),
            Item.desc(category.name)
         ]
      })
   }

   /**
    * Filtra os produtos
    */
   filterProducts(products) {
      return products.filter(product => {

         const productTitle = Utils.normalizeString(product.title)
         const searchIsMatching = productTitle.includes(this.searchText)
         const categoryIsMatching = this.categorySelected ? Number(product.category.id ?? 0) === this.categorySelected : true

         return searchIsMatching && categoryIsMatching

      })
   }
}