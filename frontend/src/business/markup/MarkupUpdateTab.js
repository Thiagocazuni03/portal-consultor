import Tab from '../../components/Tab.js'
import Modal from '../../core/Modal.js'
import APIManager from '../../api/APIManager.js'
import PopUp from '../../core/PopUp.js'
import { PRICING_URL, APPLICATION } from '../../api/Variables.js'
import CheckList from '../../core/CheckList.js'
import UserStorage from '../../core/UserStorage.js'
import LoadingModal from '../general/LoadingModal.js'
import PriceList from '../../system/PriceList.js'
import Datasheet from '../../system/Datasheet.js'
import { Div, Icon, Input } from '../../utils/Prototypes.js'
import 'jquery-mask-plugin/dist/jquery.mask.min'

export default class MarkupUpdateTab extends Tab {
   constructor(config) {
      super({
         css: 'isFull hasContentSidePadding isMarkupContent',
         openAnimation: 'slide-up',
         title: config.product.title,
         scrollable: true,
         desc: `Adicione e configure os preços de markup do produto ${config.product.title}`,
         closeIcon: 'ic-close',
         leftButtonText: 'Fechar',
         rightButtonText: 'Salvar',
         onLeftButtonClick: () => this.openCloseConfirmationModal(),
         onCloseIconClick: () => this.openCloseConfirmationModal(),
         onRightButtonClick: () => this.updateMarkup(),
         ...config
      })

      this.isLoading = true
      this.productMarkup = null

      this.initialize()
   }

   async initialize() {
      try {

         const [markupRequest, userMarkupRequest] = await Promise.allSettled([
            APIManager.getMarkup(this.getProductID()),
            APIManager.getUserMarkup(this.getProductID())
         ])

         if (markupRequest.status === 'rejected') {
            this.appendToContent(null)
            PopUp.triggerFail('Houve um erro ao buscar o arquivo de markup. Verifique se o mesmo foi gerado.', this.tab)
            return
         }

         if (userMarkupRequest.status === 'rejected') {
            this.appendToContent(null)
            PopUp.triggerFail('Houve um erro ao buscar seus markups. Contate o desenolvedor', this.tab)
            return
         }

         const markupJSON = markupRequest.value
         const userMarkupJSON = userMarkupRequest.value ?? {}
         const validModelsID = (markupJSON.model ?? []).map(model => model.id).map(Number)
         const validLinesID = (markupJSON.line ?? []).map(line => line.id).map(Number)
         const validCollectionsID = (markupJSON.collection ?? []).map(collection => collection.optional).map(Number)
         const validComponentsID = (markupJSON.component ?? []).map(component => component.component).map(Number)
         const validOptionalsID = (markupJSON.optional ?? []).map(optional => optional.optional).map(Number)
         const validInputsID = (markupJSON.commodity ?? []).map(commodity => commodity.commodity).map(Number)

         this.productMarkup = userMarkupJSON.markupProduct

         this.modelsChecklist = this.createChecklist({
            value: (userMarkupJSON.markupModel ?? []).filter(row => validModelsID.includes(+row.markup)),
            title: 'Modelos',
            placeholder: 'Pesquise o modelo aqui...',
            options: this.getModelOptions(markupJSON.model)
         })

         this.linesChecklist = this.createChecklist({
            value: (userMarkupJSON.markupLine ?? []).filter(row => validLinesID.includes(+row.markup)),
            title: 'Linhas',
            placeholder: 'Pesquise a linha aqui...',
            options: this.getLineOptions(markupJSON.line)
         })

         this.collectionChecklist = this.createChecklist({
            value: (userMarkupJSON.markupCollection ?? []).filter(row => validCollectionsID.includes(+row.markup)),
            title: 'Coleções',
            placeholder: 'Pesquise a coleção aqui...',
            options: this.getCollectionOptions(markupJSON.collection)
         })

         this.componentChecklist = this.createChecklist({
            value: (userMarkupJSON.markupComponent ?? []).filter(row => validComponentsID.includes(+row.markup)),
            title: 'Componentes',
            placeholder: 'Pesquise o componente aqui...',
            options: this.getComponentOptions(markupJSON.component)
         })

         this.optionalsChecklist = this.createChecklist({
            value: (userMarkupJSON.markupOptional ?? []).filter(row => validOptionalsID.includes(+row.markup)),
            title: 'Opcionais',
            placeholder: 'Pesquise o opcional aqui...',
            options: this.getOptionalsOptions(markupJSON.optional)
         })

         this.inputsChecklist = this.createChecklist({
            value: (userMarkupJSON.markupCommodity ?? []).filter(row => validInputsID.includes(+row.markup)),
            title: 'Insumos',
            placeholder: 'Pesquise o insumo aqui...',
            options: this.getInputsOptions(markupJSON.commodity)
         })

         this.modelsChecklist.init()
         this.linesChecklist.init()
         this.collectionChecklist.init()
         this.componentChecklist.init()
         this.optionalsChecklist.init()
         this.inputsChecklist.init()

         this.appendToContent(this.createBaseMarkup(userMarkupJSON.markupProduct))
         this.appendToContent(this.modelsChecklist.getView())
         this.appendToContent(this.linesChecklist.getView())
         this.appendToContent(this.collectionChecklist.getView())
         this.appendToContent(this.componentChecklist.getView())
         this.appendToContent(this.optionalsChecklist.getView())
         this.appendToContent(this.inputsChecklist.getView())

         this.isLoading = false

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Erro desconhecido. Contate o desenvolvedor.', this.tab)

      }
   }

   async updateMarkup() {
      if (!this.isEveryChecklistValid()) return
      if (this.isLoading) return

      const loadingModal = new LoadingModal({ message: 'Aguarde, estamos __atualizando__ seu markup...' })

      try {

         this.productMarkup = this.productMarkup.toString()
         
         if (this.productMarkup.replace('%', '').length === 0) {
            PopUp.triggerFail('O markup base não tem um valor válido.', this.tab, 'MARKUP_BASE_FAIL')
            return
         }

         loadingModal.openModal()

         const markupJSON = {
            'product': this.productMarkup,
            'model': this.modelsChecklist.getValue(),
            'line': this.linesChecklist.getValue(),
            'collection': this.collectionChecklist.getValue(),
            'component': this.componentChecklist.getValue(),
            'optional': this.optionalsChecklist.getValue(),
            'commodity': this.inputsChecklist.getValue(),
         }

         const response = await APIManager.doAPIRequest(PRICING_URL, {
            application: APPLICATION,
            type: 'set',
            member: await UserStorage.getMemberInfo('id'),
            markup: markupJSON, 
            id: this.getProductID()
         })
         
         if (response.errorCode !== 0) {
            throw new Error(response.errorMessage)
         }

         const onConfirm = (modal) => {
            PriceList.clearCache()
            Datasheet.clearCache()
            modal.closeModal()

            this.close()
         }

         new Modal({
            canBeClosed: false,
            icon: 'ic-check',
            color: 'var(--green)',
            title: 'Sucesso!',
            autoOpen: true,
            message: 'Seu markup foi __atualizado__ com sucesso!',
            buttons: [{
               type: 'filled',
               color: 'var(--green)',
               text: 'Fechar',
               onClick: (modal) => onConfirm(modal)
            }]
         })

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um erro ao atualizar o seu markup. Tente novamente.', this.tab)

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Retorna se todos os checklists são válidos 
    */
   isEveryChecklistValid() {
      return this.getChecklists().map(checklist => checklist.validate()).every(Boolean)
   }

   /**
    * Retorna os checklists dessa aba 
    */
   getChecklists() {
      return [
         this.modelsChecklist,
         this.linesChecklist,
         this.collectionChecklist,
         this.componentChecklist,
         this.optionalsChecklist,
         this.inputsChecklist
      ]
   }

   /**
    * Retorna as opções de modelo para cadastrar o markup
    */
   getModelOptions(models = []) {
      return models.map(({ id, model }) => ({
         value: id,
         label: model
      }))
   }

   /**
    * Retorna as opções de linhas para cadastrar o markup
    */
   getLineOptions(lines = []) {
      return lines.map(({ id, line }) => ({
         value: id,
         label: line
      }))
   }

   /**
    * Retorna as opções de coleções para cadastrar o markup
    */
   getCollectionOptions(collection = []) {
      return collection.map(({ optional, title }) => ({
         value: optional,
         label: title
      }))
   }

   /**
    * Retorna as opções de componentes para cadastrar o markup
    */
   getComponentOptions(components = []) {
      return components.map(({ component, title }) => ({
         value: component,
         label: title
      }))
   }

   /**
    * Retorna as opções de opcionais para cadastrar o markup
    */
   getOptionalsOptions(optionals = []) {
      return optionals.map(({ optional, title }) => ({
         value: optional,
         label: title
      }))
   }

   /**
    * Retorna as opções de opcionais para cadastrar o markup
    */
   getInputsOptions(inputs = []) {
      return inputs.map(({ commodity, title }) => ({
         value: commodity,
         label: title
      }))

   }

   /**
    * Retorna o ID do produto atual da aba 
    */
   getProductID() {
      return Number(this.config.product.id)
   }

   /**
    * Cria um CheckList
    */
   createChecklist({ title, value, placeholder, options }) {
      return new CheckList({
         value: value,
         style: 'blank isMarkup',
         header: [{
            label: title,
            align: 'left'
         }],
         validate: {
            min: null,
            max: null
         },
         inputs: [
            {
               name: 'markup',
               default: null,
               type: 'select_module',
               unique: true,
               column: 9,
               required: true,
               placeholder,
               options,
               validate: {
                  required: true
               }
            },
            {
               name: 'value',
               type: 'text',
               placeholder: '0.00%',
               default: '',
               validate: {
                  type: 'percent',
                  required: true
               },
               column: 3,
               align: 'right'
            }
         ]
      })
   }

   createBaseMarkup() {
      const wrapper = new Div('SP__basemarkup')
      const icon = new Icon('SP__basemarkup__icon ic-price-tag')
      const title = new Div('SP__basemarkup__title')
      const message = new Div('SP__basemarkup__message')
      const markupContainer = new Div('SP__basemarkup__markup_container')
      const markup = new Input('SP__basemarkup__markup')
      markup.attr('placeholder', '0%')
      markupContainer.append(markup)

      const handleInput = ({ target }) => {
         setTimeout(() => {
            const newPercent = target.value
            const percentNum = parseFloat(newPercent.replace(',', '.'))

            if (percentNum >= 1000) {
               target.value = '999,99%'
            }

            this.productMarkup = target.value
         })
      }

      wrapper.click(() => markup.select())
      markup.val(this.productMarkup)
      markup.on('input', (event) => handleInput(event))
      markup.mask('##0,00%', { reverse: true })
      title.text('Markup do produto')
      message.text('Clique aqui para editar')
      wrapper.append(icon, title, message, markupContainer)

      return wrapper
   }

   /**
    * Abre um modal confirmando a saída do usuário
    */
   openCloseConfirmationModal() {
      new Modal({
         autoOpen: true,
         title: 'Atenção!',
         icon: 'ic-warning',
         color: 'var(--orange)',
         message: 'Tem certeza que deseja __sair__? Suas alterações __não salvas__ serão __perdidas__. Essa ação é __irreversível__.',
         buttons: [
            { type: 'blank', text: 'Cancelar' },
            { type: 'filled', color: 'var(--orange)', text: 'Sair', onClick: () => this.close() }
         ]
      })
   }
}