import PriceList from './PriceList.js'
import PopUp from '../core/PopUp.js'
import Modal from '../core/Modal.js'
import DatasheetTab from './DatasheetTab.js'
import Session from '../core/Session.js'
import LoadingModal from '../business/general/LoadingModal.js'
import FolderManager from '../core/FolderManager.js'
import Color from '../utils/Color.js'
import Pantones from '../utils/Pantones.js'
import Utils from '../core/Utils.js'
import FormulaParser from './FormulaParser.js'
import RulesResultTab from './RulesResultTab.js'
import Dropdown from '../core/Dropdown.js'
import MoneyViewer from '../core/MoneyViewer.js'
import Datasheet from './Datasheet.js'
import { Button, Div, Footer, H2, Header, Icon, Img, Input, Label, Li, Option, P, Section, Select, Span, TextArea, Ul } from '../utils/Prototypes.js'
import { STORAGE_URL, DRAFTS_FOLDER_PATH, CURRENCY, IS_DEVELOPER } from '../api/Variables.js'
import { IDToken } from '../utils/IDToken.js'
import FormulaTestTab from '../business/general/FormulaTestTab.js'
import Checkbox from '../components/Checkbox.js'
import DataCart from './DataCart.js'
import SearchBar from '../core/SearchBar.js'
import { AssemblyCoordinator } from './AssemblyCoordinator.js'
import { AssemblyLogger } from './logs/AssemblyLogger.js'
import { AssemblyLoggerStorage } from './logs/AssemblyLoggerStorage.js'
import { convertDaysToFriendlyTime } from '../helpers/convertDaysToFriendlyTime.helper.js'
import ProductViewTab from './ProductViewTab.js'
import { ResourceNamesProvider } from './resources/ResourcesNamesProvider.js'
import CartItem from '../business/general/CartItem.js'
import Item from '../core/Item.js'
import $ from 'jquery'
import Swiper from 'swiper'
import { Pagination } from 'swiper/modules'
import 'jquery-mask-plugin/dist/jquery.mask.min'
import 'jquery-ui'
import 'swiper/css'
import 'swiper/css/pagination'
import { AssemblyLoggerView } from './logs/AssemblyLoggerView.js'
import Translator from '../translation/Translator.js'
import APIManager from '../api/APIManager.js'
import { ResourcesMapper } from './resources/ResourcesMapper.js'


/** 
 * Classe responsável pela visualização da montagem do produto
 * @author Fernando Petri
 */
export default class AssemblyView {

   /**
    * Os tipos de pesquisa disponíveis
    * @type {Record<string, number>}
    */
   static SEARCH_TYPES = Object.freeze({
      INPUTS: 1,
      OPTIONALS: 2
   })

   /**
    * Os tipos de formulários
    * @type {Record<string, number>}
    */
   static FORM_TYPES = Object.freeze({
      TEXT: 1,
      OPTION: 2,
      UPLOAD: 3,
      PANTONE: 4,
      SLIDER: 5,
      PIECES: 6,
      FIXED: 7
   })

   /**
    * Constrói a classe
    * @param {object} props As propriedades 
    * @param {object} props.resources Os recursos para realizar a montagem 
    * @param {ProductViewTab} props.tab A aba de montagem do produto 
    * @param {object | null} props.dataCart Os dados do produto caso for uma edição 
   */
   constructor({
      resources,
      tab,
      dataCart = {},
      cartAdapter
   }) {

      //Elementos
      this.container = new Div('SP__assembler')

      //Dados
      this.tab = tab
      this.resources = resources
      this.cartAdapter = cartAdapter

      //Estado
      this.formulasJSON = null
      this.isMounted = false
      this.useFastMode = false
      this.modelSelection = {}
      this.lastSlide = 0
      this.formSelection = {}
      this.formVariables = {}
      this.canceledAutoSelections = new Set()
      this.canceledDefaultSelections = new Set()
      this.compositionsRuleMessagesShown = new Set()
      this.optionalsRuleMessagesShown = new Set()
      this.groupSwiper = null
      this.lastTotal = 0
      this.openCompositions = new Set()

      // console.log(resources);
      // console.log(dataCart);
      // debugger
      
      
      //Objeto onde é armazenado todos os dados do produto montado
      this.dataCart = new DataCart({
         product: resources.product,
         registerCount: this.createRegisterCount(dataCart),
         ...dataCart
      })

      
      



      //O coordenador da montagem
      this.coordinator = new AssemblyCoordinator(
         this.resources,
         this.dataCart,
         this.cartAdapter
      )

      //Provedor de nomes
      this.namesProvider = new ResourceNamesProvider(this.resources)

      //Registrador de ações
      this.logger = new AssemblyLogger({
         product: this.resources.product.title
      })

      //Aba de verificação de regras
      this.rulesResultTab = new RulesResultTab({
         resources: this.resources,
         destroy: false,
         onOpen: (tab) => tab.rulesRender.enableRender(),
         onClose: (tab) => tab.rulesRender.disableRender(0)
      })

      //Abade ficha técnica
      this.datasheetTab = new DatasheetTab({
         destroy: false,
         onOpen: (tab) => tab.enableAllRenders(),
         onClose: (tab) => tab.disableAllRenders()
      })

      this.container.on('click', ({ altKey, ctrlKey, shiftKey }) => {
         if (altKey && shiftKey && ctrlKey) {
            console.log(this.dataCart)
         }
      })

      this.consoleInputInformation()
      this.init()


   }

   /**
    * Joga no console informações boas para o desenolvedor
    */
   consoleInputInformation() {      
      if (IS_DEVELOPER) {
         console.log(this.resources)
      }
   }

   /**
    * Incializa a aplicação
    */
   init() {
      if (!this.dataCart.getMeasuresAmount()) {
         this.addNewPiece()
      }

      if (!this.dataCart.getWarranty()) {
         this.selectWarranty(this.coordinator.getDefaultWarranty())
      }

      this.fetchFormulasJSON()
      this.refreshSimulatorTab()
      this.render()
   }

   /**
    * Renderiza a aplicação
    */
   render() {
      try {

         this.renderMeasuresSection()
         this.renderModelsSection()
         this.renderLinesSection()
         this.renderDeliverySection()
         this.renderInformationSection()
         this.renderWarrantySection()
         this.renderEnvironmentsSection()
         this.renderAdditionalsSection()
         this.renderGroupsSection()
         // this.renderQuantitySection()

         this.isMounted = true

      } catch (error) {

         console.error(error)

      }
   }


   /**
    * Abre a aba de ficha técnica
    */
   openDatasheetTab() {
      if (this.datasheetTab.isOpen()) {
         return
      }

      this.rulesResultTab.close()
      this.datasheetTab.open()
   }

   /**
    * Abre a tela de verificação de regras
    */
   openRuleResultsTab() {
      if (this.rulesResultTab.isOpen()) {
         return
      }

      this.datasheetTab.close()
      this.rulesResultTab.open()
   }

   /**
    * Busca o JSON de fórmulas para este produto
    */
   async fetchFormulasJSON() {
      const url = this.createProductsFormulaResourceUrl()
      const response = await APIManager.fetchJSON(url)
      const formulas = Utils.toHash(response, 'id')

      this.formulasJSON = formulas
   }

   /**
    * Cria a URL que se localiza as fórmulas do produto
    * @returns 
    */
   createProductsFormulaResourceUrl() {
      return STORAGE_URL + `portal/product/formula-${this.dataCart.getProductID()}.json?t=${crypto.randomUUID()}`
   }

   /**
    * Retorna o produto com seus dados
    */
   async getCart() {
      let totalAdditional = 0
      let totalDiscount = 0
      const namesProvider = new ResourceNamesProvider(this.resources)
      const datasheet = await Datasheet.process(this.dataCart, this.resources)
      const priceList = await PriceList.process(this.dataCart, this.resources)
      const measures = this.dataCart.getMeasures().map((piece) => {
         const condition = (groupID) =>
            groupID !== undefined && groupID !== null && !Number.isNaN(groupID)

         const { extract, groupID } = this.buildPieceSummation(piece, {
            priceList: piece,
            categories: priceList.categories
         })

         if (condition(groupID)) {
            piece.groupID = groupID
            piece.groupName = namesProvider.getGroupName(groupID)
         }

         const additional = Number(extract?.addition) || 0 
         const discount   = Number(extract?.discount) || 0

         totalAdditional += additional
         totalDiscount += discount

         return { 
            ...piece, 
            extract
         }
      })
 
          
      return { 
         product: this.getProductDataForCart(),
         daysToDeliver: this.getDeliveryDays(),
         daysToProduce: this.getProductionDays(),
         isFinished: this.isAssemblyComplete(),
         additional: this.getAdditionals(),
         compositions: this.dataCart.getConfirmedOptions(),
         identifier: this.dataCart.getIdentifier(),
         measures:measures,
         information: this.dataCart.getInformation(),
         warranty: this.dataCart.getWarranty(),
         line: this.dataCart.getLine(),
         model: this.dataCart.getModel(),
         classification: this.dataCart.getClassification(),
         environment: this.dataCart.getEnvironment(),
         time: this.dataCart.time,
         registerCount: this.dataCart.registerCount,
         datasheet,
         priceList:priceList,
         extract: {
            total: priceList.total,
            markuped: priceList.markupTotal,
            markup:priceList.markup,
            additional:totalAdditional,
            discount:totalDiscount
         }, 
         createdProduct:this.getTodayDateFormated() 
      }      
   } 

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
 
   // Thiago Cazuni - foi me passado assim.
   buildPieceSummation(piece, priceList){
      // const namesProvider = new ResourceNamesProvider(this.resources)
      const { identifier } = piece;
      const categories = priceList.categories ?? [];
      let groupID = null
      // const condition = (sumValues) => sumValues.hasOwnProperty('groupID') && sumValues.groupID !== undefined && sumValues.groupID !== null && !Number.isNaN(sumValues.groupID)
 
      let sumValues = {
         price: 0,
         markup: 0,
         discount: 0,
         addition: 0,
         total: 0,
         groupID : null
      };

       
      for(const cg of categories){
         for(const it of cg.items ?? []){
            
            if(it.pieceRelated === identifier){
               
               sumValues.price += it.price ?? 0;
               sumValues.markup += it.markupPrice ?? 0;
               sumValues.discount += it.discountValue ?? 0;
               sumValues.addition += it.markupAddition ?? 0;
               sumValues.total += it.markupPrice ?? 0;                  
               
               if (
                  it.groupID !== undefined &&
                  it.groupID !== null &&
                  !Number.isNaN(it.groupID)
               ) {
                  sumValues.groupID = it.groupID;
               } 
  
            } 
         }
      }

      // if(condition(sumValues)){
      //    sumValues.groupName = namesProvider.getGroupName(sumValues.groupID)
      // }
 
      groupID = sumValues.groupID
      delete sumValues.groupID

      return { extract:sumValues, groupID };
   }





   /**
    * Retorna os dados do produto para o carrinho
    * @returns {Record<string, string>} Os dados do produto 
    */
   getProductDataForCart() {
      const { id, title, brand, image } = this.coordinator.getProductInformation()

      return {
         id,
         title,
         brand,
         image
      }
   }

   /**
    * Retorna os index dos modais da montagem
    */
   getModalsIndex() {
      return this.tab.getZIndex() + 4
   }

   /**
    * Abre um modal para o usuário reportar um bug
    */
   openBugFoundModal() {

      const bugBlock = new Div('SP__assembler__block')
      const bugTextArea = new TextArea('SP__assembler__block__textarea')

      bugTextArea.attr('placeholder', 'Descrição do problema')
      bugTextArea.on('input', () => this.logger.setDescription(bugTextArea.val()))
      bugBlock.append(bugTextArea)

      new Modal({
         css: 'isBugFoundModal',
         autoOpen: true,
         zIndex: this.getModalsIndex(),
         icon: 'ic-question-circle',
         color: 'var(--orange)',
         title: 'Encontrou algum bug?',
         message: 'Escreva uma __breve descrição__ do problema encontrado.',
         appendToContent: [bugBlock],
         buttons: [{
            type: 'blank',
            text: 'Cancelar'
         }, {
            type: 'filled',
            text: 'Confirmar',
            color: 'var(--orange)',
            onClick: () => this.handleBugModalConfirmation()
         }]
      })
   }

   /**
    * Lida com a confirmação de um estado de bug
    */
   handleBugModalConfirmation() {
      const logData = this.logger.getDataToSave()
      const logView = new AssemblyLoggerView(this.logger)

      AssemblyLoggerStorage.save(logData)

      logView.build()
      logView.download()
   }

   /**
    * Renderiza a seção de medidas no template
    */
   renderMeasuresSection() {

      if (this.coordinator.isBothMeasureInputsHidden()) {
         return
      }

      const section = Section('SP__assembler__measures')
      const sectionTitle = H2('SP__assembler__measures__title')
      const sectionHeader = Header('SP__assembler__measures__header')
      const sectionList = Ul('SP__assembler__measures__list')
      const sectionTotal = Div('SP__assembler__measures__total')
      const sectionTotalWidth = Div('SP__assembler__measures__total__width')
      const sectionTotalArea = Div('SP__assembler__measures__total__area')
      const sectionFooter = Footer('SP__assembler__measures__footer')
      const sectionAdd = Button('SP__assembler__measures__footer__add')
      const sectionDelete = Button('SP__assembler__measures__footer__delete')
      const sectionMeasures = this.getMeasures().map(measure => this.createMeasureItem(measure))

      //Configurando
      sectionTitle.text(Translator.tC('common:measure_other'))
      sectionAdd.text(Translator.tC('actions:add'))
      sectionDelete.text(Translator.tC('actions:remove'))
      sectionHeader.css('grid-template-columns', this.getMeasuresGridValue())
      sectionTotal.css('grid-template-columns', this.getMeasuresGridValue())
      sectionAdd.append(Icon('ic-add'))
      sectionDelete.append(Icon('ic-minus'))
      sectionTotalWidth.text(this.dataCart.getTotalWidth())
      sectionTotalArea.text(this.dataCart.getTotalArea())
      sectionAdd.attr('type', 'button')
      sectionDelete.attr('type', 'button')

      console.log("Area total");
      console.log(this.dataCart.getTotalArea());

      //Desabilitando botões
      if (!this.canAddAPiece()) {
         sectionAdd.addClass('isDisabled', true)
      }

      if (!this.canDeleteAPiece()) {
         sectionDelete.addClass('isDisabled', true)
      }

      //Eventos
      sectionAdd.on('click', () => this.handlePiecesAddClick())
      sectionDelete.on('click', () => this.handlePieceDeleteClick())

      //Montando
      section.append(
         sectionTitle,
         sectionHeader,
         sectionList,
         sectionTotal
      )

      sectionHeader.append(
         this.getMeasuresHeaders()
      )

      sectionList.append(
         sectionMeasures
      )

      sectionTotal.append(
         !this.coordinator.isPiecesAmountHidden() ? Div() : '',
         !this.coordinator.isWidthInputHidden() ? sectionTotalWidth : '',
         !this.coordinator.isBothMeasureInputsHidden() ? Div() : '',
         !this.coordinator.isHeightInputHidden() ? Div() : '',
         !this.coordinator.isAreaInputHidden() ? sectionTotalArea : ''
      )

      sectionFooter.append(
         sectionAdd,
         sectionDelete
      )

      if (this.coordinator.getMaximumPiecesAmount() > 1) {
         section.append(
            sectionFooter
         )
      }

      this.container.children('.SP__assembler__measures').remove()
      this.container.append(section)
   }

   /**
    * Tenta adicionar uma nova peça
    */
   handlePiecesAddClick() {
      if (!this.canAddAPiece()) {
         PopUp.triggerFail('Você atingiu o limite de peças.', this.tab.getTab(), 'REMOVE_PIECE_BTN')

         this.logger.registerAddPieceFail(
            this.dataCart.getMeasuresAmount(),
            this.coordinator.getMaximumPiecesAmount()
         )

         return
      }

      this.cancelModelSelection()
      this.unselectLine()
      this.unselectCompositions()
      this.addNewPiece()
      this.renderMeasuresSection()
      this.renderModelsSection()
      this.renderLinesSection()
      this.renderDeliverySection()
      this.renderGroupsSection()
      this.refreshSimulatorTab()

      this.logger.registerPieceAddition(this.dataCart.getMeasuresAmount())
   }

   /**
    * Tenta remover a última peça
    */
   handlePieceDeleteClick() {
      if (!this.canDeleteAPiece()) {
         PopUp.triggerFail('Não é possível remover mais uma peça.', this.tab.getTab(), 'REMOVE_PIECE_BTN')
         this.logger.registerDeletePieceFail()
         return
      }


      this.cancelModelSelection()
      this.unselectLine()
      this.unselectCompositions()
      this.removeLastPiece()
      this.renderMeasuresSection()
      this.renderModelsSection()
      this.renderLinesSection()
      this.renderDeliverySection()
      this.renderGroupsSection()

      this.logger.registerPieceDeletion(this.dataCart.getMeasuresAmount())
   }

   /**
    * Deseleciona a seleção do modelo, classificação e subclassificação
    */
   cancelModelSelection() {
      this.unselectModel()
      this.unselectClassification()
      this.unselectSubclassification()
   }

   /**
   * Seleciona um modelo e adiciona na montagem
   * @param {object} model Um modelo
   */
   selectModel(model) {
      this.dataCart.model = model
   }

   /**
    * Deseleciona o modelo atualmente selecionado
    */
   unselectModel() {
      this.dataCart.model = null
   }

   /**
    * Seleciona uma classificação e adiciona na montagem
    * @param {object} classification A classificação  
    */
   selectClassification(classification) {
      this.dataCart.classification = classification
   }

   /**
    * Deseleciona a classificação da montagem
    */
   unselectClassification() {
      this.dataCart.classification = null
   }

   /**
    * Seleciona uma subclassificação e adiciona na montagem
    * @param {object} subclassification A subclassificação
    */
   selectSubclassification(subclassification) {
      this.dataCart.subclassification = subclassification
   }

   /**
    * Deseleciona a subclassificação da montagem
    */
   unselectSubclassification() {
      this.dataCart.subclassification = null
   }

   /**
    * Seleciona uma linha para o produto
    * @param {object} line A linha selecionada
    */
   selectLine(line) {
      this.dataCart.line = line
   }

   /**
    * Deseleciona uma linha para o produto
    */
   unselectLine() {
      this.dataCart.line = null
   }

   /**
    * Seleciona uma garantia
    * @param {object} warranty A garantia escolhida 
    */
   selectWarranty(warranty) {
      this.dataCart.setWarranty(warranty)
   }

   /**
    * Deseleciona a garantia escolhida atualmente
    */
   unselectWarranty() {
      this.dataCart.setWarranty(null)
   }

   /**
    * Deseleciona o ambiente selecionado
    */
   unselectEnvironment() {
      this.dataCart.setEnvironment(null)
   }

   /**
    * Deseleciona as composições
    */
   unselectCompositions() {
      this.dataCart.compositions = []
   }

   /**
    * Retorna se pode adicionar uma nova peça ao produto
    * @returns {boolean} Se pode adicionar
    */
   canAddAPiece() {
      return this.getMeasuresAmount() < this.coordinator.getMaximumPiecesAmount()
   }

   /**
    * Retorna se pode deletar uma peça
    * @returns {boolean} Se pode deletar
    */
   canDeleteAPiece() {
      return this.getMeasuresAmount() > 1
   }

   /**
    * Adiciona uma nova peça para o produto
    */
   addNewPiece() {
      this.getMeasures().push({
         identifier: Utils.generateUniqueToken('PCE'),
         id: this.getMeasuresAmount() + 1,
         width: 0,
         height: 0,
         area: 0,
         extract: {
            price: 0,
            markup: 0,
            discount: 0,
            addition: 0,
            total: 0
         }
      })
   }

   /**
    * Remove a última peça da lista de peças
    */
   removeLastPiece() {
      this.getMeasures().pop()
   }

   /**
    * Cria e retornoa o node de uma medida do produto
    * @param {object} measure Uma medida 
    * @returns {JQuery<HTMLLIElement>} O node da medida
    */
   createMeasureItem({ id, width, height, area }) {
      const itemContainer = Li('SP__assembler__measures__list__item')
      const itemPiece = Div('SP__assembler__measures__list__item__piece')
      const itemDivisor = Icon('SP__assembler__measures__list__item__divisor')
      const itemArea = Input('SP__assembler__measures__list__item__input')

      //Input de largura
      const itemWidth = this.createMeasureItemInput({
         value: width,
         select: this.coordinator.shouldUseWidthPredefinedMeasures(),
         measures: this.coordinator.getWidthPredefinedMeasures(),
         onEnter: () => this.handleMeasureBlur(),
         onChange: (value) => {
            this.updateMeasureWidthByID(id, Number(value))
            this.cancelModelSelection()
            this.unselectLine()
            this.unselectCompositions()

            itemArea.val(this.getMeasureByID(id).area)

            this.logger.registerPieceMeasureChange(
               id,
               Number(value),
               this.coordinator.getWidthNomenclature()
            )
         },
         onBlur: () => {
            this.handleMeasureBlur()
         }
      })

      //Input de altura
      const itemHeight = this.createMeasureItemInput({
         value: height,
         select: this.coordinator.shouldUseHeightPredefinedMeasures(),
         measures: this.coordinator.getHeightPredefinedMeasures(),
         onEnter: () => this.handleMeasureBlur(),
         onChange: (value) => {
            this.updateMeasureHeightByID(id, Number(value))
            this.cancelModelSelection()
            this.unselectLine()
            this.unselectCompositions()

            itemArea.val(this.getMeasureByID(id).area)

            this.logger.registerPieceMeasureChange(
               id,
               Number(value),
               this.coordinator.getHeightNomenclature()
            )
         },
         onBlur: () => {
            this.handleMeasureBlur()
         }
      })

      //Configurando
      itemDivisor.addClass('ic-close')
      itemContainer.css('grid-template-columns', this.getMeasuresGridValue())
      itemPiece.text(Utils.alphabet(true).at(id - 1))
      itemArea.val(area ? area : '')
      itemArea.attr({
         type: 'text',
         placeholder: '0,000',
         readonly: true,
         tabIndex: -1
      })

      //Montando
      if (!this.coordinator.isPiecesAmountHidden()) {
         itemContainer.append(itemPiece)
      }

      if (!this.coordinator.isWidthInputHidden()) {
         itemContainer.append(itemWidth)
      }

      if (!this.coordinator.isWidthInputHidden() && !this.coordinator.isHeightInputHidden()) {
         itemContainer.append(itemDivisor)
      }

      if (!this.coordinator.isHeightInputHidden()) {
         itemContainer.append(itemHeight)
      }

      if (!this.coordinator.isAreaInputHidden()) {
         itemContainer.append(itemArea)
      }

      return itemContainer
   }

   /**
    * Lida com o blur em uma medida
    */
   handleMeasureBlur() {
      this.renderMeasuresSection()
      this.renderModelsSection()
      this.renderLinesSection()
      this.renderDeliverySection()
      this.renderGroupsSection()

      if (this.canScrollToModel()) {
         this.scrollToElement($('.SP__assembler__models'))
      }
   }

   /**
    * Retorna se pode scrollar para a seção dos modelos
    * @returns 
    */
   canScrollToModel() {
      if (this.isAutoNavigationDisabled()) {
         return false
      }
      if (!this.isMeasuresFilledByUser()) {
         return false
      }
      if (!this.coordinator.getValidModels().length) {
         return false
      }

      return true
   }

   /**
    * Acha um elemento dentro da página de montagem e scrolla até ele 
    * @param {HTMLElement} element 
    */
   scrollToElement(element) {
      if (this.isAutoNavigationDisabled()) {
         return
      }

      const container = this.container[0]
      const scrollTop = container.scrollTop
      const containerBox = container.getBoundingClientRect()
      const elementBox = element[0].getBoundingClientRect()
      const scrollDistance = elementBox.top + scrollTop - containerBox.top
      const marginTop = 32

      container.scrollTo({
         top: scrollDistance - marginTop,
         behavior: 'smooth'
      })
   }

   /**
    * Retorna se o usuário desabilitou a navegação automática
    * @returns {Boolean}
    */
   isAutoNavigationDisabled() {
      return Session.get('disableAutoNavigation') == true
   }

   /**
    * Cria um input para a linha de medidas
    * @param {object} config A configuração do input
    * @returns {JQuery<HTMLInputElement> | JQuery<HTMLSelectElement>} O elemento do input 
    */
   createMeasureItemInput({ select, ...props }) {
      if (select) {

         return this.createSelectMeasureInput(props)

      } else {

         return this.createStandardMeasureInput(props)

      }
   }

   /**
    * Cria um select para a linha de medidas
    * @param {object} config A configuração do input
    * @returns {JQuery<HTMLSelectElement>} O elemento do input 
    */
   createSelectMeasureInput({ value, measures, onChange, onBlur }) {
      const select = Select('SP__assembler__measures__list__item__input')
      const options = ['', ...measures].map(measure => {
         const option = Option()

         option.attr('value', measure)
         option.text(measure)

         if (value === measure) {
            option.attr('selected', true)
         }

         return option
      })

      select.append(options)
      select.on('change', (event) => {
         onChange(event.target.value)
         onBlur()
      })

      return select
   }

   /**
    * Cria um input padrão para usar numa linha das medidas
    * @param {object} config A configuração 
    * @returns {JQuery<HTMLInputElement>} O elemento do input
    */
   createStandardMeasureInput({ value, onChange, onBlur, onEnter }) {
      const input = Input('SP__assembler__measures__list__item__input')

      input.val(value ? value : '')
      input.attr('type', 'text')
      input.attr('placeholder', '0,000')
      input.on('input', ({ target }) => onChange(target.value))
      input.on('keyup', (event) => event.which === 13 && onEnter(event))
      input.on('blur', () => onBlur())
      input.mask('0Z.000', {
         translation: {
            'Z': {
               pattern: /[0-9]/,
               optional: true
            }
         }
      })

      return input
   }

   /**
    * Retorna se todas as medidas foram preenchidas pelo usuário
    * @returns {boolean} Se as medidas estão preenchidas
    */
   isMeasuresFilledByUser() {
      return this.dataCart.getMeasures().every(measure => {
         const isWidthInputHidden = this.coordinator.isWidthInputHidden()
         const isHeightInputHidden = this.coordinator.isHeightInputHidden()

         if (!measure.width && !isWidthInputHidden) {
            return false
         }
         if (!measure.height && !isHeightInputHidden) {
            return false
         }

         return true
      })
   }

   /**
    * Retorna o valor CSS para ser usado no header das medidas
    * @returns {string} O valor CSS
    */
   getMeasuresGridValue() {
      const columns = []

      if (!this.coordinator.isPiecesAmountHidden()) {
         columns.push('35px')
      }

      if (!this.coordinator.isWidthInputHidden()) {
         columns.push('1fr')
      }

      if (!this.coordinator.isWidthInputHidden() && !this.coordinator.isHeightInputHidden()) {
         columns.push('14px')
      }

      if (!this.coordinator.isHeightInputHidden()) {
         columns.push('1fr')
      }

      if (!this.coordinator.isAreaInputHidden()) {
         columns.push('1fr')
      }

      return columns.join(' ')
   }

   /**
    * Retorna os headers da seção de medidas
    * @returns {JQuery<HTMLElement>} Os elementos do header
    */
   getMeasuresHeaders() {
      return this.getMeasuresHeaderLabels().map((label) => {
         return this.createMeasuresHeaderLabel(label)
      })
   }

   /**
    * Retorna a lista de textos que serão adicionados no header da seção de medidas
    * @returns {string[]} A lista de textos
    */
   getMeasuresHeaderLabels() {
      const labels = []

      if (!this.coordinator.isPiecesAmountHidden()) {
         labels.push(this.coordinator.getPieceNomenclature())
      }

      if (!this.coordinator.isWidthInputHidden()) {
         labels.push(this.coordinator.getWidthNomenclature())
      }

      if (!this.coordinator.isWidthInputHidden() && !this.coordinator.isHeightInputHidden()) {
         labels.push('')
      }

      if (!this.coordinator.isHeightInputHidden()) {
         labels.push(this.coordinator.getHeightNomenclature())
      }

      if (!this.coordinator.isAreaInputHidden()) {
         labels.push(this.coordinator.getAreaNomenclature())
      }

      return labels
   }

   /**
    * Cria uma label para colocar no headers da seção de medidas
    * @param {string} label O valor da coluna
    * @returns {JQuery<HTMLElement>} A label
    */
   createMeasuresHeaderLabel(text) {
      const label = Div('SP__assembler__measures__header__label')

      label.text(text)
      label.attr('title', text)

      return label
   }

   /**
    * Renderiza a parte de modelos
    */
   renderModelsSection() {
      const section = Section('SP__assembler__models')
      const sectionTitle = Div('SP__assembler__models__title')
      const sectionButton = Button('SP__assembler__models__button')
      const sectionQuantity = Span('SP__assembler__models__button__quantity')
      const sectionMessage = Div('SP__assembler__models__message')

      //Configurando
      sectionQuantity.text(Translator.t('messages:x-models-available', { count: this.coordinator.getValidModels().length }))
      sectionMessage.text(this.decideModelMessageText())
      sectionTitle.text(this.coordinator.getModelNomenclature())
      sectionButton.text(Translator.tC('messages:click-to-select'))
      sectionButton.append(sectionQuantity)
      sectionMessage.prepend(Icon('ic-info-circle'))

      //Montando      
      section.append(
         sectionTitle
      )

      //Eventos
      sectionButton.on('click', () => {
         this.openModelSelectorModal()
      })

      //Decidindo a visualização
      if (this.dataCart.hasModelSelected()) {

         section.append(this.createModelSelectedView())

      } else if (this.coordinator.getValidModels().length && this.isMeasuresFilledByUser()) {

         section.append(sectionButton)

      } else {

         section.append(sectionMessage)

      }

      this.container.children('.SP__assembler__models').remove()
      this.container.append(section)
   }

   /**
    * Cria a visualização do modelo selecionado
    */
   createModelSelectedView() {
      const selection = Div('SP__assembler__models__selection')
      const selectionImage = Img('SP__assembler__models__selection__image')
      const selectionInfo = Div('SP__assembler__models__selection__info')
      const selectionTitle = Div('SP__assembler__models__selection__info__title')
      const selectionDesc = Div('SP__assembler__models__selection__info__description')
      const selectionCancel = Button('SP__assembler__models__selection__cancel')

      selectionTitle.text(this.dataCart.getModel().title)
      selectionDesc.text(this.getTextForModelDescription())
      selectionCancel.append(Icon('ic-close'))

      selectionCancel.on('click', () => {
         this.cancelModelSelection()
         this.unselectLine()
         this.unselectCompositions()
         this.renderModelsSection()
         this.renderLinesSection()
         this.renderDeliverySection()
         this.renderGroupsSection()

         this.logger.registerModelCancel()
      })

      selection.append(
         selectionInfo,
         selectionCancel
      )

      selectionInfo.append(
         selectionTitle
      )

      if (this.dataCart.getClassification()) {
         selectionInfo.append(selectionDesc)
      }

      if (this.dataCart.getModel().image) {
         selectionImage.attr('src', STORAGE_URL + this.dataCart.getModel().image)
         selection.prepend(selectionImage)
      }

      return selection
   }

   /**
    * Retorna o texto descritivo do modelo selecionado
    * @returns {string} A descrição
    */
   getTextForModelDescription() {
      const text = []

      if (this.dataCart.getClassification()) {
         text.push(this.dataCart.getClassification().title)
      }

      if (this.dataCart.getSubclassification()) {
         text.push(this.dataCart.getSubclassification().title)
      }

      return text.join(' / ')
   }

   /**
    * Abre a seção de selecionar o modelo
    */
   openModelSelectorModal() {
      this.logger.registerModelModalOpening()

      this.clearTemporaryModelSelection()

      const models = this.coordinator.getValidModels()
      const showArrows = models.length > 1

      this.selectModelTemporarily({
         model: models[0]
      })

      this.openMultipleSelectionModal({
         css: 'isModelsSwiper',
         arrows: showArrows,
         items: models,
         createFunc: (model, index) => this.createModelCardSelection(model, index),
         onConfirm: () => this.handleModelSelection(),
         onSlide: (index) => this.selectModelTemporarily({ model: models[index] })
      })
   }

   /**
    * Deseleciona todas as Checkboxes do selecionador de modelos
    */
   unselectModelCheckboxes() {
      new Checkbox({
         radioKey: 'classifications'
      }).deactivateRadioSiblings()
   }

   /**
    * Cria um card de seleção do modelo
    * @param {object} model O modelo
    * @returns {JQuery<HTMLElement>}
    */
   createModelCardSelection({ title, image }) {
      return this.createSimpleBlock({
         title: title,
         image: image,
         desc: this.coordinator.getModelNomenclature(),
         fit: 'contain',
         css: 'isModelBlock',
         children: this.getModelSubSelections(arguments[0])
      })
   }

   /**
    * Retorna as sub-seleções de um modelo
    * @param {number} model O ID do modelo
    * @returns {JQuery<HTMLElement>} O os elementos
    */
   getModelSubSelections(model) {
      return this.coordinator.getValidClassificationsForModel(model.id)
         .sort((classA, classB) => classA.sort - classB.sort)
         .map(classification => {
            const subClassifications = this.coordinator.getValidSubclassificationsForClassification(classification.id)
            const hasSubclassifications = subClassifications.length > 0

            return hasSubclassifications
               ? this.createClassificationDropdown(model, classification, subClassifications)
               : this.createClassificationButton(model, classification)
         })
   }


   /**
    * Cria um dropdown de uma classificação para selecionar uma subclassificação
    * @param {object} model O modelo
    * @param {object} classification A classificação
    * @param {object} subClassifications As subclassficações
    * @returns {JQuery<HTMLElement>} O node do dropdown
    */
   createClassificationDropdown(model, classification, subClassifications) {
      const dropdown = new Dropdown({
         css: 'isClassificationDropdown',
         titleSize: 16,
         gap: '0.75rem',
         title: classification.title,
         appendToContent: subClassifications.map(subClassif => this.createSubclassificationSelector(model, classification, subClassif)),
         onToggle: () => {
            setTimeout(() => dropdown.getView().closest('.swiper')[0].swiper.updateAutoHeight(100), 150)
            setTimeout(() => dropdown.getView().closest('.swiper')[0].swiper.updateAutoHeight(50), 250)
         }
      })

      return dropdown.getView()
   }

   /**
    * Cria item de seleção para uma subclassificação
    * @param {object} model O modelo
    * @param {object} classification A classificação
    * @param {object} subclassification  subclassficação
    * @returns {JQuery<HTMLElement>} O node da seleção
    */
   createSubclassificationSelector(model, classification, subclassification) {
      const button = new Button('SP__assembler__classification isSubclassification')
      const buttonTitle = new Div('SP__assembler__classification__title')
      const buttonCheckbox = new Checkbox({
         active: false,
         radioKey: 'classifications',
         background: 'var(--secondary)',
         onUnactive: () => this.clearTemporaryModelSelection(),
         onActive: () => this.selectModelTemporarily({
            model,
            classification,
            subclassification
         })
      })

      buttonTitle.text(subclassification.title)
      button.on('click', () => buttonCheckbox.toggle())

      button.append(
         buttonCheckbox.getView(),
         buttonTitle
      )

      return button
   }

   /**
    * Cria um botão de classificação
    * @param {object} model O modelo da classificação
    * @param {object} classification A classificação
    * @returns {JQuery<HTMLButtonElement>} O elemento da classificação
    */
   createClassificationButton(model, classification) {
      const button = new Button('SP__assembler__classification')
      const buttonTitle = new Div('SP__assembler__classification__title')
      const buttonCheckbox = new Checkbox({
         active: false,
         radioKey: 'classifications',
         background: 'var(--secondary)',
         onUnactive: () => this.clearTemporaryModelSelection(),
         onActive: () => this.selectModelTemporarily({
            model,
            classification
         })
      })

      buttonTitle.text(classification.title)
      button.on('click', (e) => {if(!$(e.target).closest("label").length) buttonCheckbox.toggle()})

      button.append(
         buttonCheckbox.getView(),
         buttonTitle
      )

      return button
   }

   /**
    * Lida com a confirmação do modelo
    */
   handleModelSelection() {
      const { model, classification, subclassification } = this.getTemporaryModelSelection()

      const needClassification = this.coordinator.getValidClassificationsForModel(model?.id).length > 0
      const needSubclassification = this.coordinator.getValidSubclassificationsForClassification(classification?.id).length > 0

      if (!model) {
         PopUp.triggerFail('Selecione uma opção para continuar.', null, 'MODEL_CHOOSE')
         return false
      }

      if (!classification && needClassification) {
         PopUp.triggerFail('Selecione uma opção para continuar.', null, 'MODEL_CHOOSE')
         return false
      }

      if (!subclassification && needSubclassification) {
         PopUp.triggerFail('Selecione uma opção para continuar.', null, 'MODEL_CHOOSE')
         return false
      }

      console.log("classification");
      console.log(classification);


      this.selectModel(model)
      this.selectClassification(classification)
      this.selectSubclassification(subclassification)
      this.renderModelsSection()
      this.renderLinesSection()
      this.renderDeliverySection()
      this.renderGroupsSection()
      this.refreshSimulatorTab()

      this.logger.registerModelConfirm(model, classification, subclassification)

      if (this.canScrollToLine()) {
         this.scrollToElement($('.SP__assembler__lines'))
      }
   }

   /**
    * Retorna se pode scrollar para as linhas
    * @returns {boolean} Se pode ou não
    */
   canScrollToLine() {
      if (this.isAutoNavigationDisabled()) {
         return false
      }
      if (!this.coordinator.getValidLines().length) {
         return false
      }

      return true
   }

   /**
    * Retorna a seleção atual do modal de modelos
    * @returns {object} A seleção atual
    */
   getTemporaryModelSelection() {
      return this.modelSelection
   }

   /**
    * Seleciona um modelo, classificação e subclassificação temporáriamente
    * @param {object} selection A seleção 
    */
   selectModelTemporarily(selection) {
      this.modelSelection = selection
   }

   /**
    * Limpa a seleção temporária dos modelos
    */
   clearTemporaryModelSelection() {
      this.modelSelection = {
         model: null,
         classification: null,
         subclassification: null
      }
   }

   /**
    * Decide o texto da mensagem do modelo
    * @returns {string} A mensagem
    */
   decideModelMessageText() {
      if (!this.isMeasuresFilledByUser()) {
         return Translator.tC('messages:fill-the-measures-to-proceed')
      }

      return Translator.tC('messages:no-model-found')
   }

   /**
    * Renderiza a seção das linhas
    */
   renderLinesSection() {
      const section = Section('SP__assembler__lines')
      const sectionTitle = Div('SP__assembler__lines__title')
      const sectionMessage = Div('SP__assembler__lines__message')
      const sectionLines = this.coordinator.getValidLines().map(line => this.createLineSelection(line))

      sectionTitle.text(this.coordinator.getLinesNomenclature())
      sectionMessage.text(this.decideLinesMessage())
      sectionMessage.prepend(Icon('ic-info-circle'))

      section.append(
         sectionTitle
      )

      if (this.hasLineSelected()) {

         section.append(this.createLineSelectedView())

      } else if (this.coordinator.getValidLines().length) {

         section.append(sectionLines)

      } else {

         section.append(sectionMessage)

      }

      this.container.children('.SP__assembler__lines').remove()
      this.container.append(section)
   }

   /**
    * Cria a visualização de uma linha selecionada
    * @returns {JQuery<HTMLDivElement>} O elemento
    */
   createLineSelectedView() {
      const selection = Div('SP__assembler__lines__selected')
      const selectionTitle = Div('SP__assembler__lines__selected__title')
      const selectionCancel = Button('SP__assembler__lines__selected__cancel')

      selectionTitle.text(this.dataCart.getLine().title)
      selectionCancel.append(Icon('ic-close'))

      selectionCancel.on('click', () => {
         this.unselectLine()
         this.unselectCompositions()
         this.renderLinesSection()
         this.renderDeliverySection()
         this.renderGroupsSection()

         this.logger.registerLineCancel()
      })

      selection.append(
         selectionTitle,
         selectionCancel
      )

      return selection
   }

   /**
    * Cria uma linha que pode ser selecionada
    * @param {object} line A linha
    * @returns {JQuery<HTMLElement>} O node da linah  
    */
   createLineSelection(line) {
      const selection = Div('SP__assembler__lines__selection')
      const selectionTitle = Div('SP__assembler__lines__selection__title')
      const selectionCheckbox = new Checkbox({
         active: false,
         radioKey: 'lines',
         background: 'var(--secondary)'
      })

      selectionTitle.text(line.title)
      selection.on('click', () => {
         this.selectLine(line)
         this.renderLinesSection()
         this.renderDeliverySection()
         this.renderGroupsSection()

         this.logger.registerLineConfirm(line)

         if (this.canScrollToGroups()) {
            this.scrollToElement($('.SP__assembler__groups'))
         }
      })

      selection.append(
         selectionCheckbox.getView(),
         selectionTitle
      )

      return selection
   }

   /**
    * Retorna se o usuário pode scrollar para a seção de grupos
    * @returns {boolean} Se pode ou não
    */
   canScrollToGroups() {
      if (this.isAutoNavigationDisabled()) {
         return false
      }
      if (!this.coordinator.getValidGroups().length) {
         return false
      }

      return true
   }

   /**
    * Decide o texto que será colocado na mensagem da seção de linhas
    * @returns {string} A mensagem
    */
   decideLinesMessage() {
      if (!this.dataCart.hasModelSelected()) {
         return Translator.tC('messages:fill-the-previous-informations')
      }

      return Translator.tC('mesages:x-lines-available', { count: 0 })
   }

   /**
    * Renderiza a seção de tempo de entrega
    */
   renderDeliverySection() {
      const section = Section('SP__assembler__delivery')
      const sectionTitle = Div('SP__assembler__delivery__title')
      const sectionIcon = Icon('SP__assembler__delivery__icon')
      const sectionDescription = Div('SP__assembler__delivery__days')

      sectionIcon.addClass('ic-delivery')
      sectionDescription.text(this.getDeliveryDays() ? this.getDeliveryDaysMessage() : Translator.tC('empty:information'))
      sectionTitle.text(Translator.tT('business:delivery-forecast'))

      section.append(
         sectionTitle,
         sectionDescription,
         sectionIcon
      )

      this.container.children('.SP__assembler__delivery').remove()
      this.container.append(section)
   }

   /**
    * Retorna a mensagem amigável de tempo entrega
    * @returns {string} A mensagem
    */
   getDeliveryDaysMessage() {
      const days = this.getDeliveryDays()

      return Translator.t('amount:days', { count: days })
   }

   /**
    * Retorna o tempo de delivery mínimo para este produto // Mudei para "production" todos menos o model que e o principal.
    * @returns {number} O número de dias
    */
   getDeliveryDays() {
      const days = []

      const model = this.dataCart.getModel()
      const line = this.dataCart.getLine()
      const classification = this.dataCart.getClassification()
      const options = this.dataCart.getConfirmedOptions()      

      days.push(
         model?.additionalDays?.delivery,
         line?.additionalDays?.production,
         classification?.additionalDays?.production,
      )

      // composition
      // line
      // model
      // classification

      options.forEach(option => {
         if (option.type === 'input') {
            const combination = this.coordinator.getParentCombinationForCommodity(option)
            const optional = this.coordinator.getParentOptionalForCombination(combination)
            const composition = this.coordinator.getParentCompositionForOptional(optional)

            days.push(composition?.additionalDays?.production)
            days.push(optional?.additionalDays?.production)

         } else {

            const composition = this.coordinator.getParentCompositionForOptional(option)

            days.push(composition?.additionalDays?.production)
            days.push(option?.additionalDays?.production)

         }
      })

      return days
         .filter(Boolean)
         .reduce((total, day) => total + day, 0)
   }

   /**
    * Retorna os dias de produção do produto
    */
   getProductionDays() {
      const days = []

      const model = this.dataCart.getModel()
      const line = this.dataCart.getLine()
      const classification = this.dataCart.getClassification()
      const options = this.dataCart.getConfirmedOptions()

      days.push(
         model?.additionalDays?.production,
         line?.additionalDays?.production,
         classification?.additionalDays?.production,
      )

      options.forEach(option => {
         if (option.type === 'input') {
            const combination = this.coordinator.getParentCombinationForCommodity(option)
            const optional = this.coordinator.getParentOptionalForCombination(combination)
            const composition = this.coordinator.getParentCompositionForOptional(optional)

            days.push(composition?.additionalDays?.production)
            days.push(optional?.additionalDays?.production)

         } else {

            const composition = this.coordinator.getParentCompositionForOptional(option)

            days.push(composition?.additionalDays?.production)
            days.push(option?.additionalDays?.production)

         }
      })


      return days
         .filter(Boolean)
         .reduce((total, day) => total + day, 0)
   }

   /**
    * Renderiza a seção de informações do produto
    */
   renderInformationSection() {
      if (this.coordinator.isInformationSectionHidden()) {
         return
      }

      const section = Section('SP__assembler__information')
      const sectionTitle = Div('SP__assembler__information__title')
      const sectionInput = TextArea('SP__assembler__information__textarea')

      const handleInput = (event) => {
         this.dataCart.setInformation(event.target.value)
      }

      sectionInput.val(this.dataCart.getInformation())
      sectionTitle.text('Informações')
      sectionInput.attr('placeholder', 'Digite as informações adicionais aqui')
      section.append(sectionTitle, sectionInput)
      sectionInput.on('input', event => handleInput(event))

      this.container.children('.SP__assembler__information').remove()
      this.container.append(section)
   }

   /**
    * Renderezia a seção de quantidade
    */
   renderQuantitySection() {
      const section = Section('SP__assembler__quantity')
      const sectionTitle = Div('SP__assembler__quantity__title')
      const sectionContent = Div('SP__assembler__quantity__content')
      const sectionQuantity = Input('SP__assembler__quantity__content__input')
      const sectionPlus = Button('SP__assembler__quantity__content__button')
      const sectionMinus = Button('SP__assembler__quantity__content__button')

      sectionQuantity.val(this.dataCart.getQuantity())
      sectionTitle.text('Quantidade')
      sectionPlus.append(Icon('ic-add'))
      sectionMinus.append(Icon('ic-minus'))
      sectionPlus.attr('type', 'button')
      sectionMinus.attr('type', 'button')

      sectionQuantity.mask('#', {
         recursive: true
      })

      sectionQuantity.on('input', () => {
         const newValue = Number(sectionQuantity.val())
         const isValid = !Number.isNaN(newValue)

         if (!isValid) {
            return
         }

         this.dataCart.setQuantity(newValue)
      })

      sectionQuantity.on('blur', () => {
         this.renderQuantitySection()
      })

      sectionPlus.on('click', () => {
         this.dataCart.addQuantity(1)
         this.renderQuantitySection()
      })

      sectionMinus.on('click', () => {
         this.dataCart.reduceQuantity(1)
         this.renderQuantitySection()
      })

      section.append(
         sectionTitle,
         sectionContent
      )

      sectionContent.append(
         sectionMinus,
         sectionQuantity,
         sectionPlus
      )

      this.container.children('.SP__assembler__quantity').remove()
      this.container.append(section)
   }

   /**
    * Renderiza a seção de garantia denovo
    */
   renderWarrantySection() {

      const warranties = [this.coordinator.getDefaultWarranty(), ...this.coordinator.getWarranties()]

      const section = Section('SP__assembler__warranty')
      const sectionTitle = Div('SP__assembler__warranty__title')
      const sectionList = Ul('SP__assembler__warranty__list')
      const sectionOptions = warranties.map(warranty => {
         return this.createWarrantySelection(warranty)
      })

      sectionTitle.text(Translator.tC('common:warranty'))
      section.append(sectionTitle, sectionList)
      sectionList.append(sectionOptions)

      this.container.children('.SP__assembler__warranty').remove()
      this.container.append(section)
   }

   /**
    * Cria um item de garantia que pode ser selecionado
    * @param {object} warranty A garantia
    * @returns {JQuery<HTMLLIElement>} O elemento 
    */
   createWarrantySelection({ id, addition, title, days }) {
      const item = Li('SP__assembler__warranty__list__item')
      const itemInfo = Div('SP__assembler__warranty__list__item__info')
      const itemTitle = Div('SP__assembler__warranty__list__item__info__title')
      const itemDescription = Div('SP__assembler__warranty__list__item__info__description')

      //Marcador
      const itemCheckbox = new Checkbox({
         active: this.dataCart.getWarranty()?.id === id,
         radioKey: 'warranty',
         propagate: false,
         onUnactive: () => this.unselectWarranty(),
         onActive: () => {
            this.selectWarranty(arguments[0])
            this.refreshSimulatorTab()
         }
      })

      const warrantyPrice = this.calculateWarrantyPrice(this.lastTotal, addition)

      //O valor do dinheiro
      const itemMoney = new MoneyViewer({
         value: warrantyPrice,
         css: 'isWarrantyMoney'
      })

      itemTitle.text(title)
      itemDescription.text(convertDaysToFriendlyTime(days))
      item.on('click', () => {
         if (!this.coordinator.hasAdditionalWarranties()) {
            return
         }

         itemCheckbox.toggle()
      })

      item.append(
         itemInfo
      )

      itemInfo.append(
         itemTitle,
         itemDescription
      )

      if (this.coordinator.hasAdditionalWarranties()) {
         item.prepend(itemCheckbox.getView())
      }

      if (addition > 0) {
         item.append(itemMoney.getView())
      }

      return item
   }

   /**
    * Calcula o preço de um garantia baseado no total do produto
    * @param {number} productPrice O preço do produto
    * @param {number} warrantyAddition A "adição" da garantia
    * @returns {number} O valor da garantia
    */
   calculateWarrantyPrice(productPrice, warrantyAddition) {
      return Number(((productPrice / 100) * Number(warrantyAddition)).toFixed(2))
   }

   /**
    * Renderiza a seção de ambientes
    */
   renderEnvironmentsSection() {
      const section = Section('SP__assembler__environments')
      const sectionTitle = Div('SP__assembler__environments__title')
      const sectionButton = Button('SP__assembler__environments__button')
      const sectionQuantity = Span('SP__assembler__environments__button__quantity')
      const sectionMessage = Div('SP__assembler__environments__message')
      const enviromentsAmount = this.coordinator.getEnvironments().length

      //Configurando
      sectionQuantity.text(Translator.t('messages:x-environments-available', { count: enviromentsAmount }))
      sectionTitle.text(Translator.tC('common:environment'))
      sectionButton.text(Translator.tC('messages:click-to-select'))
      sectionButton.append(sectionQuantity)
      sectionMessage.append(Icon('ic-info-circle'), Translator.t('messages:x-environments-available', { count: 0 }))

      sectionButton.on('click', () => {
         this.openEnvironmentsSelectionModal()
      })

      section.append(
         sectionTitle
      )

      if (this.dataCart.getEnvironment()) {
         section.append(this.createEnvironmentSelectionView())
      } else if (this.coordinator.getEnvironments().length) {
         section.append(sectionButton)
      } else {
         section.append(sectionMessage)
      }

      this.container.children('.SP__assembler__environments').remove()
      this.container.append(section)
   }

   /**
    * Cria a visualização do ambiente selecionado
    * @returns {JQuery<HTMLElement>} O elemento
    */
   createEnvironmentSelectionView() {
      const environment = this.dataCart.getEnvironment()

      const selection = Div('SP__assembler__environments__selection')
      const selectionImage = Img('SP__assembler__environments__selection__image')
      const selectionInfo = Div('SP__assembler__environments__selection__info')
      const selectionTitle = Div('SP__assembler__environments__selection__info__title')
      const selectionCancel = Button('SP__assembler__environments__selection__cancel')
      const selectionDetails = TextArea('SP__assembler__environments__selection__details')

      selectionTitle.text(environment.title)
      selectionCancel.append(Icon('ic-close'))
      selectionDetails.attr('placeholder', 'Informações adicionais...')
      selectionDetails.val(environment?.information ?? '')

      selectionCancel.on('click', () => {
         this.unselectEnvironment()
         this.renderEnvironmentsSection()
      })

      selectionDetails.on('input', ({ target }) => {
         environment.information = target.value
      })

      selection.append(
         selectionInfo,
         selectionCancel,
         selectionDetails
      )

      selectionInfo.append(
         selectionTitle
      )

      if (environment.image) {
         selectionImage.attr('src', STORAGE_URL + environment.image)
         selection.prepend(selectionImage)
      }

      return selection
   }

   /**
    * Abre um modal de seleção de ambiente
    */
   openEnvironmentsSelectionModal() {
      this.openMultipleSelectionModal({
         items: this.coordinator.getEnvironments(),
         onConfirm: (index) => {
            this.handleEnvironmentSubmit(this.coordinator.getEnvironments()[index])
            this.renderEnvironmentsSection()
         },
         createFunc: (environment) => this.createSimpleBlock({
            title: environment.title,
            image: environment.image,
         })
      })
   }

   /**
    * Lida com o confirmar de um ambieten
    * @param {object} environment O ambiente selecionado 
    */
   handleEnvironmentSubmit(environment) {
      this.dataCart.setEnvironment(environment)
   }

   /**
    * Renderiza a seção de valores adicionais
    */
   renderAdditionalsSection() {
      const section = Section('SP__assembler__additionals')
      const sectionTitle = Div('SP__assembler__additionals__title')
      const sectionList = Ul('SP__assembler__additionals__list')
      const sectionButton = Button('SP__assembler__additionals__button')
      const sectionMessage = Div('SP__assembler__additionals__message')
      const sectionItems = this.getAdditionals().map(additional => {
         return this.createAdditionalItem(additional)
      })

      sectionMessage.prepend(Icon('ic-info-circle'), Translator.tC('messages:no-additiona-value-registered'))
      sectionTitle.text(Translator.tT('business:additional-values'))
      sectionButton.append(Translator.tC('actions:add'), Icon('ic-add'))
      sectionButton.on('click', () => {
         this.addNewAdditional()
         this.renderAdditionalsSection()
      })

      section.append(
         sectionTitle,
         sectionList,
         sectionMessage,
         sectionButton
      )

      sectionList.append(
         sectionItems
      )

      this.container.children('.SP__assembler__additionals').remove()
      this.container.append(section)
   }

   /**
    * Retorna a lista de valores adicionais
    * @returns {object[]} A lista de adicionais
    */
   getAdditionals() {
      return this.dataCart.additionals
   }

   /**
    * Retorna o total dos adicionais do produto
    * @returns {number} Os totais
    */
   getAdditionalsTotalPrice() {
      return this.getAdditionals().reduce((total, additional) => {
         return total + Number(additional.price ?? 0)
      }, 0)
   }

   /**
    * Adiciona um novo adicional a lista de adicionais
    */
   addNewAdditional() {
      this.getAdditionals().push({
         id: crypto.randomUUID(),
         name: '',
         price: 0
      })
   }

   /**
    * Deleta um adicional do produto
    * @param {string} id O ID do adicional 
    */
   deleteAdditional(id) {
      this.dataCart.additionals = this.getAdditionals().filter(additional => {
         return additional.id !== id
      })
   }

   /**
   * Cria um item de um adicional
   * @param {object} additional O adicional
   * @returns {JQuery<HTMLLIElement>} O elemento do adicional
   */
   createAdditionalItem({ id, title, price }) {
      const addittional = Li('SP__assembler__additionals__list__item')
      const additionalTitle = Input('SP__assembler__additionals__list__item__title')
      const additionalPrice = Input('SP__assembler__additionals__list__item__price')
      const additionalCancel = Button('SP__assembler__additionals__list__item__cancel')

      additionalTitle.val(title)
      additionalPrice.val(price ? price : '')
      additionalCancel.append(Icon('ic-close'))

      additionalTitle.attr({
         type: 'text',
         placeholder: Translator.tC('common:description'),
      })

      additionalPrice.attr({
         type: 'text',
         placeholder: `${CURRENCY} 0,00`,
      })

      additionalPrice.mask('#.##0,00', {
         reverse: true
      })

      additionalTitle.on('input', () => {
         this.updateAdditionalTitle(id, additionalTitle.val())
      })

      additionalPrice.on('input', () => {
         this.updateAdditionalPrice(id, Number(additionalPrice.val()))
      })

      additionalPrice.on('blur', () => {
         this.refreshSimulatorTab()
      })

      additionalCancel.on('click', () => {
         this.deleteAdditional(id)
         this.renderAdditionalsSection()
         this.refreshSimulatorTab()
      })

      addittional.append(
         additionalTitle,
         additionalPrice,
         additionalCancel
      )

      return addittional
   }

   /**
    * Atualiza o título de um adicional
    * @param {string} id O ID do adicional 
    * @param {string} title O título novo do adicional
    */
   updateAdditionalTitle(id, title) {
      this.getAdditionalByID(id).title = title
   }

   /**
    * Atualiza o preço de um adicional
    * @param {string} id O ID do adicional 
    * @param {string} price O preço novo do adicional
    */
   updateAdditionalPrice(id, price) {
      this.getAdditionalByID(id).price = price
   }

   /**
    * Retorna um adicional buscado por um ID
    * @param {string} id O ID do adicional 
    * @returns {object | null} O adicional se foi achado
    */
   getAdditionalByID(id) {
      return this.getAdditionals().find(additional => {
         return additional.id === id
      })
   }

   /**
    * Renderiza as seções dos grupos
    */
   renderGroupsSection() {
      this.clearSavedRuleChecks()

      const section = Section('SP__assembler__groups')
      const sectionTitle = Div('SP__assembler__groups__title')
      const sectionMessage = Div('SP__assembler__groups__message')
      const sectionContent = Div('SP__assembler__groups__content swiper')
      const sectionRow = Div('SP__assembler__groups__content__row swiper-wrapper')
      const sectionPagination = Div('SP__assembler__groups__content__pagination swiper-pagination')

      // console.log(this.coordinator.getGroupsNomenclature());

      sectionTitle.text(this.coordinator.getGroupsNomenclature())
      sectionMessage.append(Icon('ic-info-circle'), Translator.tC('messages:fill-the-previous-informations'))

      section.append(
         sectionTitle,
         sectionContent
      )

      sectionContent.append(
         sectionPagination,
         sectionRow,
      )


      if (this.dataCart.getModel() && this.dataCart.getLine()) {

         sectionRow.append(this.coordinator.getValidGroups().map(group => this.createGroupSlide(group)))
         section.append(sectionContent)

      } else {

         section.append(sectionMessage)

      }

      //Ativando swiper
      queueMicrotask(() => {
         const swiper = new Swiper(sectionContent[0], {
            init: true,
            slidesPerView: 1,
            initialSlide: this.lastSlide,
            modules: [Pagination],
            pagination: {
               clickable: true,
               bulletClass: 'SP__assembler__groups__content__pagination__bullet',
               bulletActiveClass: 'isActive',
               el: '.swiper-pagination',
               renderBullet: (...args) => this.createGroupPaginationItem(...args)
            },
         })

         this.groupSwiper = swiper

         swiper.on('slideChange', () => this.lastSlide = swiper.activeIndex)
      })

      this.updateRulesTab()

      this.container.children('.SP__assembler__groups').remove()
      this.container.append(section)
   }

   /**
    * Cria um item de paginação dos grupos
    * @param {number} index O índice da bullet 
    * @returns {HTMLElement} A bullet
    */
   createGroupPaginationItem(index, className) {
      const groups = this.coordinator.getValidGroups()
      const target = groups[index]

      return new Div()
         .text(target?.title)
         .addClass(className)
         .prop('outerHTML')
   }

   /**
    * Limpa as regras
    */
   clearSavedRuleChecks() {
      this.coordinator.clearCompositionRuleChecks()
      this.coordinator.clearOptionalRuleChecks()
   }

   /**
    * Atualiza a aba de regras
    */
   updateRulesTab() {
      this.rulesResultTab.update([
         ...this.coordinator.getCompositionRuleChecks(),
         ...this.coordinator.getOptionalRuleChecks(),
      ])
   }

   /**
    * Cria o slide de um grupo
    * @param {object} group O grupo 
    * @returns {JQuery<HTMLElement>} O node 
    */
   createGroupSlide(group) {

      const slide = Div('SP__assembler__groups__content__row__group swiper-slide')

      const confirmedOptions = this.dataCart.getConfirmedOptionsForGroup(group.id)
      const visibleCompositions = this.coordinator.getVisibleCompositionsForGroup(group.id)

      // console.log(group);

      const slideConfirmed = confirmedOptions.map(option => {
         return this.createConfirmedOptionItem(option)
      })

      const slideOptions = visibleCompositions.map((composition, index, array) => {
         if (this.isCompositionAvailableForDefaultSelection(composition)) {
            return this.createDefaultSelectionItem(composition)
         }

         return this.createCompositionItem(composition, index, array)
      })

      slide.append(
         ...slideConfirmed,
         ...slideOptions
      )

      return slide
   }

   /**
    * Cria a visualização da seleção padrão de uma composição
    * @param {object} composition A composição 
    * @returns {JQuery<HTMLElement>} A visualização
    */
   createDefaultSelectionItem(composition) {

      const defaultOption = this.coordinator.getDefaultOptionForComposition(composition)
      const optionInformation = this.getDefaultOptionDisplayInformation(defaultOption)


      const optContainer = new Div('SP__assembler__dropdown')
      const optHeader = Header('SP__assembler__dropdown__header')
      const optImage = Img('SP__assembler__dropdown__header__image')
      const optInfo = Div('SP__assembler__dropdown__header__info')
      const optTitle = Div('SP__assembler__dropdown__header__info__title')
      const optDescription = Div('SP__assembler__dropdown__header__info__description')
      const optCancel = Button('SP__assembler__dropdown__header__cancel')

      optTitle.text(optionInformation.title)
      optDescription.text(composition.title)
      optCancel.append(Icon('ic-close'))
      optContainer.append(optHeader)
      optHeader.append(optInfo, optCancel)
      optInfo.append(optTitle, optDescription)

      optHeader.on('click', () => {
         this.logger.registerDefaultSelectionClick(composition, optionInformation.title)
         this.handleCompositionRuleMessages(composition, () => {
            this.handleOptionalRuleMessage(defaultOption, () => {
               optionInformation.onClick(defaultOption)
            })
         })
      })

      optCancel.on('click', (event) => {
         event.stopPropagation()

         this.logger.registerDefaultSelectionCancel(composition, optionInformation.title)

         this.cancelCompositionDefaultSelection(composition)
         this.renderGroupsSection()
      })

      if (optionInformation.image) {
         optImage.attr('src', STORAGE_URL + optionInformation.image)
         optHeader.prepend(optImage)
      }

      return optContainer
   }

   /**
    * Define uma composição como a composição cancelada
    * @param {object} composition A composição cancelada
    */
   cancelCompositionDefaultSelection(composition) {
      this.canceledDefaultSelections.add(composition.id)
   }

   /**
    * Retorna os dados de layou de uma opção que é uma seleção padrão
    * @param {object} optional O opcional 
    * @returns {object} Os dados
    */
   getDefaultOptionDisplayInformation(optional) {
      if (this.coordinator.isOptionalWithForms(optional)) {
         return {
            title: optional.title,
            image: this.getImageToUse(optional),
            onClick: () => this.handleFormsClick(optional)
         }
      }

      if (this.coordinator.isOptionalWithoutCombinations(optional)) {
         return {
            title: optional.title,
            image: this.getImageToUse(optional),
            onClick: () => this.handleNoCombinationClick(optional)
         }
      }

      if (this.coordinator.isOptionalWithHiddenCombinations(optional)) {
         return {
            title: optional.title,
            image: this.getImageToUse(optional),
            onClick: () => this.handleHiddenCombinationsClick(optional)
         }
      }

      if (this.isOptionalAvailableForAutomaticColorSelection(optional)) {
         const optimalCombination = this.coordinator.getOptimalCombinationForOptional(optional)
         const finalName = this.decideOptionalCombinationName(optional, optimalCombination)
         const finalImage = this.getImageToUse(optional, optimalCombination)

         return {
            title: finalName,
            image: finalImage,
            onClick: () => this.handleCombinationClick(optimalCombination)
         }
      }

      const combination = this.coordinator.getCombinationsForOptional(optional.id)[0]
      const finalName = this.decideOptionalCombinationName(optional, combination)
      const finalImage = this.getImageToUse(optional, combination)

      return {
         title: finalName,
         image: finalImage,
         onClick: () => this.handleCombinationClick(combination)
      }
   }

   /**
    * Retorna se uma composição teve sua seleção padrão cancelada
    * @param {object} composition A composição
    * @returns {boolean} Se foi cancelada a seleção padrão
    */
   isCompositionDefaultSelectionCanceled(composition) {
      return this.canceledDefaultSelections.has(composition.id)
   }

   /**
    * Retorna se uma composição está disponível para a seleção padrão
    * @param {object} composition A composição em questão
    * @returns {boolean} Se está disponível  
    */
   isCompositionAvailableForDefaultSelection(composition) {
      if (this.isCompositionDefaultSelectionCanceled(composition)) {
         return false
      }

      const defaultOption = this.coordinator.getDefaultOptionForComposition(composition)
      const isAvailable = Boolean(defaultOption)

      return isAvailable
   }


   /**
    * Cria a visualização de uma opção confirmada 
    * @param {object} item O item confirmado, um insumo ou opcional 
    * @returns {JQuery<HTMLElement>} O elemento da opção confirmada
    */
   createConfirmedOptionItem(item) {
      const optContainer = Div('SP__assembler__dropdown isConfirmed')
      const optHeader = Header('SP__assembler__dropdown__header')
      const optImage = Img('SP__assembler__dropdown__header__image')
      const optInfo = Div('SP__assembler__dropdown__header__info')
      const optTitle = Div('SP__assembler__dropdown__header__info__title')
      const optDescription = Div('SP__assembler__dropdown__header__info__description')
      const optForms = Div('SP__assembler__dropdown__header__info__forms')
      const optCancel = Button('SP__assembler__dropdown__header__cancel')

      optCancel.append(Icon('ic-close'))
      optTitle.text(item.view.title)
      optCancel.on('click', () => this.promptOptionCancel(item))
      optDescription.text(item.view.description)

      optContainer.append(
         optHeader
      )

      optHeader.append(
         optInfo,
         optCancel
      )

      optInfo.append(
         optTitle,
         optDescription
      )

      if (item.showImage && item.view.image) {
         optImage.attr('src', STORAGE_URL + item.view.image)
         optHeader.prepend(optImage)
      }

      if (this.getFirstFormImage(item.forms)) {
         optImage.attr('src', this.getFirstFormImage(item.forms))
         optHeader.prepend(optImage)
      }

      if (item.view.forms?.length) {
         optInfo.append(optForms)
         optForms.append(item.view.forms.map(form => this.createFormDetails(form)))
      }

      return optContainer
   }

   /**
    * Retorna a imagem do primeiro formulário de upload que ele encontrar
    * @param {object[]} forms Os formulários 
    * @returns {string | null} Nulo ou a imagem do formulário
    */
   getFirstFormImage(forms = []) {
      return forms.find(form => form.type === 3 && form.value?.image)?.value?.image
   }

   /**
    * Cria os detalhes de um formulário confirmado
    * @param {object} form O formulário confirmado
    * @returns {JQuery<HTMLElement>} O elemento HTML
    */
   createFormDetails(form) {
      const detailsTypes = {
         1: () => this.createSimpleFormDetails(form),
         2: () => this.createSimpleFormDetails(form),
         3: () => null,
         4: () => this.createPantoneFormDetails(form),
         5: () => this.createSimpleFormDetails(form),
         6: () => this.createSimpleFormDetails(form) /* TODO */,
         7: () => this.createSimpleFormDetails(form)
      }

      return detailsTypes[form.type]()
   }

   /**
    * Cria uma linah de detalhes de um formulário confirmado
    * @param {object} form O formulário confirmado 
    * @returns {JQuery<HTMLElement>} O elemento
    */
   createSimpleFormDetails(form) {
      const details = new Div('SP__assembler__dropdown__header__info__forms__simple')

      details.text(form.value)

      return details
   }

   /**
    * Cria uma linha de detalhes de um formulário de pantones
    * @param {object} form O formulário 
    * @returns {JQuery<HTMLElement>} O elemento dos detalhes
    */
   createPantoneFormDetails(form) {
      const details = new Div('SP__assembler__dropdown__header__info__forms__pantone')

      details.text(`${form.value?.pan ?? 'Indefinido'} | ${form.value?.hex ?? 'Indefinido'}`)
      details.css('backgroundColor', form.value?.hex ?? 'var(--fifth)')

      return details
   }

   /**
    * Mostra uma mensagem perguntando se o usuário deseja remover uma opção
    * @param {object} item O item do carrinho 
    */
   async promptOptionCancel(item) {
      const canDelete = await this.promptModal({
         icon: 'ic-warning',
         color: 'var(--red)',
         title: 'Aviso!',
         message: this.getMessageForOptionCancel(item)
      })

      if (!canDelete) {
         return
      }

      this.clearColorAutomaticCancelFor(item)
      this.cancelOption(item)
      this.renderGroupsSection()
      this.renderDeliverySection()
      this.renderWarrantySection()
      this.refreshSimulatorTab()

      this.logger.registerOptionCancel(item)
   }

   /**
    * Cancela uma opção e suas opções consequentes
    * @param {object} item Um item da montagem já selecionado
    */
   cancelOption(item) {
      this.dataCart.getConfirmedOptions().splice(this.getConfirmedOptionIndex(item))
   }

   /**
    * Limpa o cancelamento de uma cor automática para um item
    * @param {object} item O item em questão 
    */
   clearColorAutomaticCancelFor(item) {
      this.clearColorAutomaticCancelForOption(item)
      this.clearColorAutomaticCancelForVisibleOptions()
   }

   /**
    * Limpa o registro de cancelamento de uma opção
    * @param {object} item A opção
    */
   clearColorAutomaticCancelForOption(item) {
      if (item.type === 'input') {

         const combination = this.coordinator.getParentCombinationForCommodity(item)
         const optional = this.coordinator.getParentOptionalForCombination(combination)

         this.canceledAutoSelections.delete(optional.id)

      } else {

         this.canceledAutoSelections.delete(item.id)

      }
   }

   /**
    * Limpa o canelamento de cor automática para as opções visíveis não confirmadas
    */
   clearColorAutomaticCancelForVisibleOptions() {
      const groups = this.coordinator.getValidGroups()

      const compositions = groups.flatMap(group => {
         return this.coordinator.getVisibleCompositionsForGroup(group.id)
      })

      const optionals = compositions.flatMap(composition => {
         return this.coordinator.getVisibleOptionalsForComposition(composition)
      })

      optionals.forEach(optional => {
         this.clearColorAutomaticCancelForOption(optional)
      })
   }

   /**
    * Retorna a mensagem que deve ser mostrado no modal de cancelar uma opção
    * @param {object} item O item do carrinho 
    * @returns {string} A mensagem para o carrinho
    */
   getMessageForOptionCancel(item) {
      const afterItems = this.getConfirmedOptionsAfter(item)
      const compositionNames = [item, ...afterItems].map(item => '__' + item.view.description + '__')

      return `Tem certeza que deseja __remover__ esta seleção? Isso removerá os componentes ${compositionNames.join(', ')}. Continuar?`
   }

   /**
    * Retorna as opções confirmadas após um item específico da montagem
    * @param {object} item O item da montagem sendo um insumo ou opcional 
    * @returns {object[]} As opções localizadas após um insumo ou opcional
    */
   getConfirmedOptionsAfter(item) {
      const optionIndex = this.getConfirmedOptionIndex(item)
      const afterOptions = this.dataCart.getConfirmedOptions().slice(optionIndex + 1)

      return afterOptions
   }

   /**
    * Retorna o índice de uma composição no carrinho
    * @param {object} item O item da montagem 
    * @returns {number} O índice deste item no carrinho
    */
   getConfirmedOptionIndex(item) {
      return this.dataCart.getConfirmedOptions().findIndex(option => {
         return option.id === item.id
      })
   }

   /**
    * Mostra um modal para o usuário que ele pode confirmar
    * @param {object} config A configuração do modal 
    * @returns {Promise<boolean>} Uma promessa se o usuário confirmou ou fechou o modal
    */
   promptModal(config) {
      return new Promise(resolve => {
         new Modal({
            onClose: () => resolve(false),
            autoOpen: true,
            zIndex: this.getModalsIndex(),
            icon: 'ic-info-circle',
            color: 'var(--fifth)',
            title: 'Aviso!',
            content: 'Tem certeza de que deseja continuar?',
            buttons: [{
               text: 'Cancelar',
               type: 'blank',
               onClick: () => resolve(false)
            }, {
               text: 'Confirmar',
               type: 'filled',
               color: config.color,
               onClick: () => resolve(true)
            }],
            ...config
         })
      })
   }

   /**
    * Atualiza a aba de simulador
    */
   async refreshSimulatorTab() {
      const commodities = await Datasheet.process(this.dataCart, this.resources)
      const priceList = await PriceList.process(this.dataCart, this.resources)
      const summary = this.organizeSummaryInformation(priceList)
      const components = this.organizeComponentsFormulasInformation()

      this.updateTotalPriceRelatedViews(Number(priceList.total))

      this.datasheetTab.update({
         inputs: commodities,
         components: components,
         priceList: priceList,
         summary: summary
      })
   }

   /**
    * Organiza as formulas de componentes para a ficha técnica
    */
   organizeComponentsFormulasInformation() {
      const variables = this.dataCart.getVariables()

      const options = this.dataCart
         .getConfirmedOptions()
         .filter(option => option.formulas)
         .flatMap(option => option.formulas.map(formula => ({
            title: option.view.title,
            description: option.view.description,
            formula: {
               consumn: {
                  ...formula.consumn,
                  calculation: FormulaParser.calculate(formula.consumn?.formula, variables)
               },
               weight: {
                  ...formula.weight,
                  calculation: FormulaParser.calculate(formula.weight?.formula, variables)
               }
            }
         })))

      return options
   }

   /**
    * Organiza a informação para a seção de resumo da ficha técnica
    * @param {object} priceList O resultado da tabela de preço
    * @returns {object[]} A lista de items do resumo
    */
   organizeSummaryInformation(priceList) {
      return [
         {
            title: 'Tabela de Preço',
            value: priceList.total
         },
         {
            title: 'Garantia',
            value: this.calculateWarrantyPrice(priceList.total, this.dataCart.getWarranty().addition)
         },
         {
            title: 'Adicionais',
            value: this.getAdditionalsTotalPrice()
         }
      ]
   }

   /**
    * Atualiza os items que dependem do preço total do carrinho
    * @param {number} total O total do produto 
    */
   updateTotalPriceRelatedViews(total) {
      this.lastTotal = total
      this.tab.updateTabMoney(total)
      this.renderWarrantySection()
   }

   /**
    * Retorna a visualização da composição
    * @param {object} composition A composição
    * @param {number} index O índice da composição
    * @param {object[]} array A lista de componentes visíveis
    * @returns {JQuery<HTMLElement>} A composição
    */
   createCompositionItem(composition) {
      const compContainer = Div('SP__assembler__dropdown')
      const compHeader = Header('SP__assembler__dropdown__header')
      const compInfo = Div('SP__assembler__dropdown__header__info')
      const compTitle = Div('SP__assembler__dropdown__header__info__title')
      const compMenu = Div('SP__assembler__dropdown__menu')
      const compOptions = Div('SP__assembler__dropdown__header__options')
      const compArrow = Icon('SP__assembler__dropdown__header__options__arrow')
      const compInfoButton = Icon('SP__assembler__dropdown__header__options__icon')
      const compSearch = Button('SP__assembler__dropdown__header__options__search')

      const visibleOptionals = this.coordinator.getVisibleOptionalsForComposition(composition)

      const compOptionals = Utils.sortAlphabeticaly(visibleOptionals, 'title')
      const compOptionalNodes = compOptionals.flatMap(optional => this.createOptionalItem(optional))

      if (this.openCompositions.has(composition.id)) {
         compContainer.addClass('isOpen')
      }

      compTitle.append(composition.title)
      compArrow.addClass('ic-down')
      compInfoButton.addClass('ic-info-circle')
      compSearch.append(Icon('ic-search'))
      compHeader.on('click', () => {
         const isOpen = compContainer.hasClass('isOpen')

         if (isOpen) {
            compContainer.removeClass('isOpen')
            this.openCompositions.delete(composition.id)
            return
         }

         this.handleCompositionRuleMessages(composition, () => {
            compContainer.addClass('isOpen')
            this.openCompositions.add(composition.id)
         })
      })

      compSearch.on('click', event => {
         event.stopPropagation()
         this.openCompositionSearchModal(composition)
      })

      compContainer.append(
         compHeader,
         compMenu
      )

      compHeader.append(
         compInfo,
         compOptions
      )

      compInfo.append(
         compTitle
      )

      compOptions.append(
         compArrow
      )

      compMenu.append(
         compOptionalNodes
      )

      if (this.isCompositionSearchEnabled(composition)) {
         compOptions.prepend(compSearch)
      }

      if (this.isCompositionHelpEnabled(composition)) {
         compOptions.prepend(compInfoButton)
      }

      return compContainer
   }

   /**
    * Lida com a mensagem de uma composição
    * @param {object} composition A composição
    * @param {() => unknown} callback O callback caso der certo
    */
   async handleCompositionRuleMessages(composition, callback) {
      if (!this.coordinator.hasRuleMessageForComposition(composition.id)) {
         callback()
         return
      }

      const validRuleGroup = this.coordinator.getValidCheckedRulesForComposition(composition.id)[0]
      const wasShownBefore = this.wasCompositionRuleShown(validRuleGroup.id)

      if (!validRuleGroup || wasShownBefore) {
         callback()
         return
      }

      const confirmed = await this.promptModal({
         icon: 'ic-warning',
         color: 'var(--orange)',
         title: 'Aviso!',
         message: validRuleGroup.message,
      })

      if (!confirmed) {
         return
      }

      this.setCompositionRuleAsShown(validRuleGroup)

      callback()
   }

   async handleOptionalRuleMessage(optional, callback) {
      if (!this.coordinator.hasRuleMessageForOptional(optional.id)) {
         callback()
         return
      }

      const validRuleGroup = this.coordinator.getValidCheckedRulesForOptional(optional.id)[0]
      const wasShownBefore = this.wasOptionalRuleShown(validRuleGroup.id)

      if (!validRuleGroup || wasShownBefore) {
         callback()
         return
      }

      const confirmed = await this.promptModal({
         icon: 'ic-warning',
         color: 'var(--orange)',
         title: 'Aviso!',
         message: validRuleGroup.message,
      })

      if (!confirmed) {
         return
      }

      this.setOptionalRuleAsShown(validRuleGroup)

      callback()
   }

   /**
    * Define uma mensagem de regra como já mostrada
    * @param {object} ruleGroup O grupo de regra 
    */
   setCompositionRuleAsShown(ruleGroup) {
      this.compositionsRuleMessagesShown.add(ruleGroup.id)
   }

   /**
    * Retorna se um grupo de regra de uma composição já teve sua mensagem mostrada
    * @param {number} ruleGroupID O ID do grupo de regras 
    * @returns {boolean} Se foi mostrado ou não
    */
   wasCompositionRuleShown(ruleGroupID) {
      return this.optionalsRuleMessagesShown.has(ruleGroupID)
   }

   /**
    * Define uma mensagem de regra como já mostrada
    * @param {object} ruleGroup O grupo de regra 
    */
   setOptionalRuleAsShown(ruleGroup) {
      this.optionalsRuleMessagesShown.add(ruleGroup.id)
   }

   /**
   * Retorna se um grupo de regra de um opcional já teve sua mensagem mostrada
   * @param {number} ruleGroupID O ID do grupo de regras 
   * @returns {boolean} Se foi mostrado ou não
   */
   wasOptionalRuleShown(ruleGroupID) {
      return this.optionalsRuleMessagesShown.has(ruleGroupID)
   }

   /**
    * Retorna se a composição tem a pesquisa ativa
    * @param {object} composition A composição em questão 
    * @returns {boolean} Se a pesquisa está ativa ou não
    */
   isCompositionSearchEnabled(composition) {
      return Boolean(composition.search.enabled)
   }

   /**
    * Abre um modal para pesquisar opcionais dentro de uma composição
    * @param {object} composition A composição em questão 
    */
   openCompositionSearchModal(composition) {
      const handleSubmit = () => {
         searchModal.closeModal()
         this.handleSearchSubmit(composition, searchBar.getSearch())
      }


      const searchBar = new SearchBar({
         label: '',
         width: '80%',
         css: 'isAssemblySearch',
         onEnter: () => handleSubmit()
      })

      const searchModal = new Modal({
         icon: 'ic-search',
         color: 'var(--orange)',
         title: 'Buscar',
         zIndex: this.getModalsIndex(),
         hasMessage: false,
         appendToContent: searchBar.getView(),
         buttons: [{
            text: 'Voltar',
            type: 'blank',
         }, {
            text: 'Confirmar',
            type: 'filled',
            onClick: () => handleSubmit()
         }]
      })

      searchModal.openModal()
   }

   /**
    * Lida com a pesquisa
    * @param {object} composition A composição 
    * @param {string} search A pesquisa
    */
   handleSearchSubmit(composition, search) {
      if (composition.search.type === AssemblyView.SEARCH_TYPES.INPUTS) {

         this.handleInputsSearch(composition, Utils.normalizeString(search))

      } else {

         this.handleOptionalsSearch(composition, Utils.normalizeString(search))

      }
   }

   /**
    * Lida com a pesquisa de insumos
    * @param {object} composition A composição
    * @param {string} search A pesquisa do usuário
    */
   handleInputsSearch(composition, search) {

      const commodities = this.getValidCommoditiesInsideComposition(composition)
      const matchingCommodities = commodities.filter(commodity => this.isCommodityMatchingSearch(commodity, search))
      const sortedCommodities = Utils.sortAlphabeticaly(matchingCommodities, 'title')

      if (!sortedCommodities.length) {
         this.openNoInputFoundModal()
         return
      }

      this.openMultipleSelectionModal({
         items: sortedCommodities,
         onConfirm: (index) => this.confirmCommodity(sortedCommodities[index]),
         createFunc: (commodity) => this.createSimpleCommodityBlock(commodity)
      })
   }

   /**
    * Retorna se um insumo bate com uma pesquisa do usuário
    * @param {object} commodity O insumo em questão 
    * @param {string} search A pesquisa 
    */
   isCommodityMatchingSearch(commodity, search) {
      const title = Utils.normalizeString(commodity.title ?? '')
      const code = Utils.normalizeString(commodity.code ?? '')

      return title.includes(search) || code.includes(search)
   }

   /**
    * Retorna todos os insumos válidos dentro de uma composição
    * @param {object} composition A composição 
    * @returns {object[]} A lista de insumos
    */
   getValidCommoditiesInsideComposition(composition) {
      const optionals = this.coordinator.getVisibleOptionalsForComposition(composition)

      const combinations = optionals.flatMap(optional => {
         return this.coordinator.getCombinationsForOptional(optional.id)
      })

      const commodities = combinations.flatMap(combination => {
         return this.coordinator.getValidCommoditiesForCombination(combination.id)
      })

      return commodities
   }

   /**
    * Lida com a pesquisa de opcionais
    * @param {object} composition A composição em questão
    * @param {string} search A pesquisa do usuário
    */
   handleOptionalsSearch(composition, search) {
      const optionals = this.coordinator.getVisibleOptionalsForComposition(composition)
      const matchingOptionals = optionals.filter(optional => this.isOptionalMatchingSearch(optional, search))
      const sortedOptionals = Utils.sortAlphabeticaly(matchingOptionals, 'title')

      if (!sortedOptionals.length) {
         this.openNoOptionalFoundModal()
         return
      }

      //Qunado confirmar o opcional
      const onGroupConfirm = (index) => {
         const chosenOptional = sortedOptionals[index]
         const combinations = this.coordinator.getCombinationsForOptional(chosenOptional.id)

         if (this.coordinator.isOptionalWithForms(chosenOptional)) {
            this.handleFormsClick(chosenOptional)
            return
         }

         if (this.coordinator.isOptionalWithoutCombinations(chosenOptional)) {
            this.confirmOptional(chosenOptional)
            return
         }

         //Quando confirmar uma combinação
         const onCombinationConfirm = (index) => {
            const chosedCombination = combinations[index]
            const firstInput = this.coordinator.getValidCommoditiesForCombination(chosedCombination.id)[0]
            const willHideInputs = Boolean(+chosenOptional.hdCommodity)

            //Caso for esconder os insumos
            if (willHideInputs) {
               this.confirmCommodity(firstInput)
               return
            }

            this.handleCombinationClick(chosenOptional, chosedCombination)
         }

         //Caso tiver combinações e não for nenhuma das opções acima
         this.openMultipleSelectionModal({
            items: combinations,
            onConfirm: (index) => onCombinationConfirm(index),
            createFunc: (combination) => this.createSimpleBlock({
               title: this.decideOptionalCombinationName(chosenOptional, combination),
               desc: composition.title,
               image: this.getImageToUse(chosenOptional, combination)
            })
         })
      }

      //Caso achar apenas um opcional
      if (sortedOptionals.length === 1) {
         onGroupConfirm(0)
         return
      }

      //Abrindo o modal dos opcionais
      this.openMultipleSelectionModal({
         items: sortedOptionals,
         createFunc: (optional) => this.createSimpleOptionalBlock(optional),
         onConfirm: (index) => onGroupConfirm(index)
      })
   }

   /**
    * Cria um bloco simples de visualização de um opcional
    * @param {object} optional O opcional 
    * @returns {JQuery<HTMLElement>} A visualização
    */
   createSimpleOptionalBlock(optional) {
      const parentComposition = this.coordinator.getParentCompositionForOptional(optional)

      return this.createSimpleBlock({
         title: optional.title,
         desc: parentComposition.title,
         image: this.getImageToUse(optional)
      })
   }

   /**
    * Retorna se um opcional está batendo com uma pesquisa
    * @param {object} optional O opcional
    * @param {string} search A pesquisa
    * @returns {boolean} Se bate com a pesquisa
    */
   isOptionalMatchingSearch(optional, search) {
      return Utils.normalizeString(optional.title).includes(search)
   }

   /**
    * Retorna se a composição tem informações de ajuda
    * @param {object} composition A composição em questão 
    * @returns {boolean} Se está ativo 
    */
   isCompositionHelpEnabled(composition) {
      return Boolean(composition.help.enabled)
   }

   /**
    * Cria a visualização de um opcional dependendo de suas configurações
    * @param {object} optional O opcional a ser criado
    * @returns {JQuery<HTMLElement>} O elemento
    */
   createOptionalItem(optional) {
      if (this.coordinator.isOptionalWithHiddenLevel(optional)) {
         return this.createHiddenLevelOptional(optional)
      }

      if (this.coordinator.isOptionalWithForms(optional)) {
         return this.createTriggerOptional(optional, () => {
            this.logger.registerOptionalWithFormsClick(optional)
            this.handleFormsClick(optional)
         })
      }

      if (this.coordinator.isOptionalWithoutCombinations(optional)) {
         return this.createTriggerOptional(optional, () => {
            this.logger.registerOptionalWithoutCombinationsClick(optional)
            this.handleNoCombinationClick(optional)
         })
      }

      if (this.coordinator.isOptionalWithHiddenCombinations(optional)) {
         return this.createTriggerOptional(optional, () => {
            this.logger.registerOptionalWithHiddenCombinations(optional)
            this.handleHiddenCombinationsClick(optional)
         })
      }

      if (this.isOptionalAvailableForAutomaticColorSelection(optional)) {
         return this.createColorAutomaticOptional(optional)
      }


      return this.createStandardOptionalItem(optional)
   }

   /**
    * Cria um opcional com uma cor pré-selecionada
    * @param {object} optional O opcional 
    * @returns {JQuery<HTMLElement>} O elemento
    */
   createColorAutomaticOptional(optional) {

      const matchedCombination = this.coordinator.getOptimalCombinationForOptional(optional)
      const displayName = this.decideOptionalCombinationName(optional, matchedCombination)

      const optContainer = new Div('SP__assembler__dropdown')
      const optHeader = Header('SP__assembler__dropdown__header')
      const optInfo = Div('SP__assembler__dropdown__header__info')
      const optTitle = Div('SP__assembler__dropdown__header__info__title')
      const optCancel = Button('SP__assembler__dropdown__header__cancel')

      optCancel.append(Icon('ic-close'))
      optTitle.text(displayName)
      optContainer.append(optHeader)
      optHeader.append(optInfo, optCancel)
      optInfo.append(optTitle)

      optHeader.on('click', () => {
         this.logger.registerColorAutomaticClick(displayName)

         this.handleOptionalRuleMessage(optional, () => {
            this.handleCombinationClick(matchedCombination)
         })
      })

      optCancel.on('click', (event) => {
         event.stopPropagation()

         this.logger.registerColorAutomaticCancel(displayName)

         this.cancelOptionalAutoSelection(optional)
         this.renderGroupsSection()
      })

      return optContainer
   }

   /**
    * Define o opcional como sua seleção padrão cancelada
    * @param {object} optional O opcional
    */
   cancelOptionalAutoSelection(optional) {
      this.canceledAutoSelections.add(optional.id)
   }

   /**
    * Retorna se a seleção padrão do opcional foi cancelada ou não
    * @param {number} optionalID O ID do opcional
    * @returns {boolean} Se foi cancelada ou não
    */
   isOptionalAutoSelectionCanceled(optionalID) {
      return this.canceledAutoSelections.has(optionalID)
   }

   /**
    * Retorna se o opcional está disponível para realizar o tratamento de cor automática
    * @param {object} optional O opcional
    * @returns {boolean} Se está disponível 
    */
   isOptionalAvailableForAutomaticColorSelection(optional) {
      if (!this.coordinator.isOptionalColorAutomaticOn(optional)) {
         return false
      }
      if (this.isOptionalAutoSelectionCanceled(optional.id)) {
         return false
      }

      const optimalCombination = this.coordinator.getOptimalCombinationForOptional(optional)
      const isAvailable = Boolean(optimalCombination)

      return isAvailable
   }

   /**
    * Retorna a visualização de um opcional com seus níveis escondidos
    * @param {object} optional O opcional em questão
    * @returns {JQuery<HTMLElement>[]}
    */
   createHiddenLevelOptional(optional) {
      return this.coordinator.getCombinationsForOptional(optional.id).map(combination => {
         return this.createCombinationItem(combination)
      })
   }

   /**
    * Cria um opcional como um botão
    * @param {object} optional O opcional 
    * @returns {JQuery<HTMLElement>} O elemento
    */
   createTriggerOptional(optional, onClick) {
      const optContainer = new Div('SP__assembler__dropdown')
      const optHeader = Header('SP__assembler__dropdown__header')
      const optInfo = Div('SP__assembler__dropdown__header__info')
      const optTitle = Div('SP__assembler__dropdown__header__info__title')

      optHeader.on('click', onClick)
      optTitle.text(optional.title)

      optContainer.append(optHeader)
      optHeader.append(optInfo)
      optInfo.append(optTitle)

      return optContainer
   }

   /**
    * Cria a visualização padrão de um opcional estilo dropdown
    * @param {object} optional O opcional em questão 
    * @returns {JQuery<HTMLElement>}
    */
   createStandardOptionalItem(optional) {
      const optContainer = new Div('SP__assembler__dropdown')
      const optHeader = Header('SP__assembler__dropdown__header')
      const optTitle = Div('SP__assembler__dropdown__header__title')
      const optMenu = Div('SP__assembler__dropdown__menu')
      const optOptions = Div('SP__assembler__dropdown__header__options')
      const optArrow = Icon('SP__assembler__dropdown__header__options__arrow')
      const optCombinations = this.coordinator.getCombinationsForOptional(optional.id).map(combination => {
         return this.createCombinationItem(combination)
      })

      optTitle.append(optional.title)
      optArrow.addClass('ic-down')
      optHeader.on('click', () => {
         this.handleOptionalRuleMessage(optional, () => {
            optContainer.toggleClass('isOpen')
         })
      })

      optContainer.append(
         optHeader,
         optMenu
      )

      optHeader.append(
         optTitle,
         optOptions
      )

      optOptions.append(
         optArrow
      )

      optMenu.append(
         optCombinations
      )

      return optContainer
   }

   /**
    * Cria a visualização de uma combinação
    * @param {object} combination Uma combinação
    * @returns {JQuery<HTMLElement>} Um elemento 
    */
   createCombinationItem(combination) {
      let titleToUse = combination.title

      const combContainer = new Div('SP__assembler__dropdown')
      const combHeader = Header('SP__assembler__dropdown__header')
      const combInfo = Div('SP__assembler__dropdown__header__info')
      const combTitle = Div('SP__assembler__dropdown__header__info__title')

      if (this.isAllColorsCombination(combination)) {
         const parentOptional = this.coordinator.getParentOptionalForCombination(combination)
         const firstDependant = this.coordinator.getOptionalDependents(parentOptional)[0]
         const colorName = this.namesProvider.getCombinationName(firstDependant?.selectedColorID)

         if (colorName) {
            titleToUse = colorName
         }
      }

      combTitle.text(titleToUse)
      combContainer.append(combHeader)
      combHeader.append(combInfo)
      combInfo.append(combTitle)
      combContainer.on('click', () => {
         const parentOptional = this.coordinator.getParentOptionalForCombination(combination)

         this.logger.registerCombinationClick(combination, parentOptional)

         this.handleCombinationClick(combination)
      })


      return combContainer
   }

   /**
    * Lida com o clique em uma combinação
    * @param {object} combination A combinação 
    */
   handleCombinationClick(combination) {

      const commodities = this.coordinator.getValidCommoditiesForCombination(combination.id)
      const optional = this.coordinator.getParentOptionalForCombination(combination)
      const composition = this.coordinator.getParentCompositionForOptional(optional)

      //Caso não possuir nenhum insumo e não for esconder os insumos
      if (!commodities.length) {
         this.openNoInputFoundModal()
         return
      }

      //Caso estiver ativado o modo rapido
      if (this.isFastModeActive()) {
         this.confirmCommodity(commodities[0])
         return
      }

      //Caso for ocultar os insumos
      if (optional.options.hideCommodity) {
         this.openSimpleSelectionModal({
            title: this.decideOptionalCombinationName(optional, combination),
            image: this.getImageToUse(optional, combination),
            desc: composition.title,
            onConfirm: () => this.confirmCommodity(commodities[0])
         })
         return
      }

      //Caso não for esconder os insumos
      this.openMultipleSelectionModal({
         items: commodities,
         createFunc: (commodity) => this.createSimpleCommodityBlock(commodity),
         onConfirm: (index) => this.confirmCommodity(commodities[index])
      })
   }

   /**
    * Retorna se o modo rapido está ativo
    * @returns {boolean} Se está ativo
    */
   isFastModeActive() {
      return Boolean(this.useFastMode)
   }

   /**
    * Abre um modal dizendo que nenhum insumo foi encontrado
    * @returns {Modal} O modal que se abre automaticamente
    */
   openNoInputFoundModal = () => {
      return new Modal({
         onEnter: (modal) => modal.closeModal(),
         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         uniqueToken: 'SEARCH_INPUT_NOT_FOUND',
         title: 'Aviso',
         icon: 'ic-warning',
         zIndex: this.getModalsIndex(),
         color: 'var(--orange)',
         autoOpen: true,
         message: 'Nenhum insumo foi encontrado.',
         buttons: [{ type: 'filled', text: 'Fechar', color: 'var(--orange)' }]
      })
   }
 
   /**
    * Cria a contagem de registro do produto
    */
   createRegisterCount(dataCart) {
      const priceAmount = 0//TODO:
      const datasheetAmount = (dataCart?.datasheet ?? []).length
      const piecesAmount = (dataCart?.measures ?? []).length
      const optionsAmount = (dataCart?.compositions ?? []).length

      return {
         price: priceAmount,
         datasheet: datasheetAmount,
         prices: piecesAmount,
         optionals: optionsAmount
      }
   }

   /**
    * Decide qual o nome mostrado para o usuário quando o opcioanl tem insumos escondidos 
    * @param {object} optional O opcional
    * @param {object} combination  A combinação
    * @returns {boolean} A combinação
    */
   decideOptionalCombinationName(optional, combination) {
      const informations = [optional.title]

      //Caso esconda as cores
      if (this.isHideColorsOptional(optional)) {
         return informations.join(' ')
      }

      //Caso for combinação todas as cores:
      if (this.isAllColorsCombination(combination)) {
         const firstDependant = this.coordinator.getOptionalDependents(optional)[0]
         const colorName = this.namesProvider.getCombinationName(firstDependant?.selectedColorID)

         if (colorName) {
            informations.push(
               colorName
            )
         }
      } else {
         informations.push(
            combination.title
         )
      }

      return informations.join(' ')
   }

   /**
    * Retorna se uma combinação vale para todas as cores
    * @param {object} combination A combinação em questão
    * @returns {boolean} Se vale para todas as cores
    */
   isAllColorsCombination(combination) {
      return Boolean(combination.isAllColors)
   }

   /**
    * Retorna se um opcional é um opcional que esconde as cores
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se esconde as cores ou não
    */
   isHideColorsOptional(optional) {
      return Boolean(optional.options.hideColors)
   }

   /**
    * Lida com o clique em um opcional com combinações escondidas
    * @param {object} optional Os opcionais 
    */
   handleHiddenCombinationsClick(optional) {
      const combinations = this.coordinator.getCombinationsForOptional(optional.id)
      const commodities = combinations.flatMap(combination => this.coordinator.getValidCommoditiesForCombination(combination.id))
      const sortedCommodities = Utils.sortAlphabeticaly(commodities, 'title')

      this.openMultipleSelectionModal({
         items: sortedCommodities,
         onConfirm: (index) => this.confirmCommodity(sortedCommodities[index]),
         createFunc: (commodity) => this.createSimpleCommodityBlock(commodity)
      })
   }

   /**
    * Cria a visualização de um card dos insumos
    * @param {object} commodity O insumo em questão 
    * @returns {JQuery<HTMLElement>} A visualização do card do insumo
    */
   createSimpleCommodityBlock(commodity) {
      const combination = this.coordinator.getParentCombinationForCommodity(commodity)
      const optional = this.coordinator.getParentOptionalForCombination(combination)
      const composition = this.coordinator.getParentCompositionForOptional(optional)

      return this.createSimpleBlock({
         title: this.decideCommodityTitle(commodity),
         image: this.getImageToUse(optional, combination, commodity),
         desc: composition.title,
      })
   }

   /**
    * Confirma um insumo e adiciona ele na montagem do produto
    * @param {object} commodity O insumo escolhido
    */
   confirmCommodity(commodity) {
      const parentCombination = this.coordinator.getParentCombinationForCommodity(commodity)
      const parentOptional = this.coordinator.getParentOptionalForCombination(parentCombination)
      const parentComposition = this.coordinator.getParentCompositionForOptional(parentOptional)
      const parentGroup = this.coordinator.getParentGroupForComposition(parentComposition)

      const viewInformation = {
         title: parentOptional.options.hideCommodity ? this.decideOptionalCombinationName(parentOptional, parentCombination) : this.decideCommodityTitle(commodity),
         groupName: parentGroup.title,
         image: this.getImageToUse(parentOptional, parentCombination, commodity),
         description: parentComposition.title,
      }

      const confirmedCommodity = structuredClone({
         ...commodity,
         type: 'input',
         view: viewInformation,
         optionChildren: parentOptional.children,
         groupID: parentComposition.groupID,
         relatedProducts: parentOptional.relatedProducts ?? ''
      })
   
 
      //tt
      if(!confirmedCommodity.hasOwnProperty('piece') && confirmedCommodity.groupID == parentGroup.id){
         confirmedCommodity.piece = parentGroup.piece
      }
       

      if (parentOptional.formulas) {
         const formulaReferences = parentOptional.formulas
         const formulas = formulaReferences
            .map(formula => this.mapFormulaIdsToFormula(formula))
            .filter(Boolean)

         confirmedCommodity.formulas = formulas
      }

      this.clearColorAutomaticCancelFor(commodity)

      this.dataCart.getConfirmedOptions().push(confirmedCommodity)
      this.logger.registerCommodityConfirm(confirmedCommodity, parentComposition)

      this.renderGroupsSection()
      this.renderDeliverySection()
      this.renderWarrantySection()
      this.refreshSimulatorTab()
      this.tryToSwipeToNextGroupSlide()
      this.handleProductCompletePopup()
   }

   /**
    * Mapeia uma formula e seus IDS para fórmulas correspondentes
    * @param {Record<string, string>} formula Os cadastros dessa fórmula 
    */
   mapFormulaIdsToFormula(formula) {
      if (!this.isFormulasJSONLoaded()) {
         return null
      }

      const consumFormula = this.formulasJSON[formula.formulaID] ?? null
      const weightFormula = this.formulasJSON[formula.weight] ?? null

      return {
         consumn: consumFormula,
         weight: weightFormula
      }
   }

   /**
    * Retorna se as fórmulas associadas a este produtos estão carregadas
    * @returns {boolean} Se foi carregado ou não
    */
   isFormulasJSONLoaded() {
      return Boolean(this.formulasJSON)
   }

   /**
    * Lida com o popup de montagem concluída
    */
   handleProductCompletePopup() {
      if (!this.isAssemblyComplete()) {
         return
      }

      PopUp.triggerSuccess('Montagem concluída!', this.tab.getTab())
   }

   /**
    * Retorna se a montagem do produto foi concluída
    * @returns {boolean} Se foi compelta ou não
    */
   isAssemblyComplete() {
      if (this.coordinator.getValidModels() && !this.dataCart.getModel()) {
         return false
      }
      if (this.coordinator.getValidLines() && !this.dataCart.getLine()) {
         return false
      }

      return this.coordinator.getValidGroups().every(group => {
         return !this.coordinator.hasVisibleCompositionsInGroup(group.id)
      })
   }

   /**
    * Decide o título que deve ser mostrado em um insumo
    * @param {object} commodity O insumo em si 
    * @returns {string} O título do insumo
    */
   decideCommodityTitle(commodity) {
      if (this.isAcessoryColorsCommodity(commodity)) {
         return this.coordinator.getParentCombinationForCommodity(commodity).title
      }

      const informations = [
         commodity.title,
         commodity.code
      ]

      return informations.join(' ')
   }

   /**
    * Retorna se um insumo é um insumo do cor dos acessórios
    * @param {object} commodity O insumo em questão 
    * @returns {boolean} Se é um item do cor dos acessórios
    */
   isAcessoryColorsCommodity(commodity) {
      return commodity.id === null
   }

   /**
    * Lida com o clique em um opcional sem combinações e sem formulário
    * @param {object} optional O opcional que foi clicado 
    */
   handleNoCombinationClick(optional) {
      const parentComposition = this.coordinator.getParentCompositionForOptional(optional)

      if (this.isFastModeActive()) {
         this.confirmOptional(optional)
         return
      }

      this.openSimpleSelectionModal({
         title: optional.title,
         desc: parentComposition.title,
         image: this.getImageToUse(optional),
         onConfirm: () => this.confirmOptional(optional)
      })
   }

   /**
    * Retorna qual imagem usar quando se abre a seleção de algum destes items
    * @param {object | null} optional O opcional
    * @param {object | null} combination A combinação
    * @param {object | null} commodity O insumo
    * @returns {string | null} A imagem ou nulo
    */
   getImageToUse(optional = {}, combination = {}, commodity = {}) {
      if (commodity.showImage && commodity.image) {
         return commodity.image
      }
      if (combination.showImage && combination.image) {
         return combination.image
      }
      if (optional.showImage && optional.image) {
         return optional.image
      }

      return null
   }

   /**
    * Lida com o clique em um formlulário
    * @param {object} optional O opcional em questão 
    */
   handleFormsClick(optional) {
      try {

         this.clearFormSelection()

         const forms = this.getFormsViewsForOptional(optional.id)
         const modal = this.createFormsModal(optional)

         modal.appendToContent(forms)
         modal.openModal()

      } catch (error) {

         console.error(error)

      }
   }

   /**
    * Limpa a seleção do formulário
    */
   clearFormSelection() {
      this.formSelection = {}
   }

   /**
    * Define uma chave nas seleções dos formulários
    * @param {string} key A chave
    * @param {any} value O valor do formulário
    */
   setFormSelectionValue(key, value) {
      this.formSelection[key] = value
   }

   /**
    * Retorna a seleção de um formulário para uma chave
    * @returns {any} O valor
    */
   getFormSelectionFor(key) {
      return this.formSelection[key]
   }

   /**
    * Cria a visualização de um formulário 
    * @param {object} form A configuração do formulário
    * @returns {JQuery<HTMLElement>} O formulário criado
    */
   createForm(form) {
      return {

         [AssemblyView.FORM_TYPES.TEXT]: () => this.createTextForm(form),
         [AssemblyView.FORM_TYPES.OPTION]: () => this.createOptionForm(form),
         [AssemblyView.FORM_TYPES.UPLOAD]: () => this.createUploadForm(form),
         [AssemblyView.FORM_TYPES.PANTONE]: () => this.createPantoneForm(form),
         [AssemblyView.FORM_TYPES.SLIDER]: () => this.createSliderForm(form),
         [AssemblyView.FORM_TYPES.PIECES]: () => this.createProductsPieceForm(form),
         [AssemblyView.FORM_TYPES.FIXED]: () => this.createFixedValueForm(form)

      }[form.type]()
   }

   /**
    * Cria um formulário de texto simples
    * @param {object} form A configuração do formulário 
    * @returns {JQuery<HTMLDivElement>} O elemento do formulário
    */
   createTextForm(form) {
      const inputToken = new IDToken().getToken()
      const inputWrapper = new Div('SP__assembler__formModal__text')
      const inputText = new Input('SP__assembler__formModal__text__input')
      const inputLabel = new Label('SP__assembler__formModal__text__label')

      inputText.attr('type', 'text')
      inputText.attr('placeholder', 'Digite aqui...')
      inputText.attr('id', inputToken)
      inputLabel.attr('for', inputToken)
      inputLabel.text(form.name || 'Texto')
      inputWrapper.append(inputLabel, inputText)
      inputText.on('input', ({ target }) => this.setFormSelectionValue(form.id, target.value))

      return inputWrapper
   }

   /**
    * Cria um formulário de opções
    * @param {object} form A configuração do formulário
    * @returns {JQuery<HTMLElement>} Os elementos do formulário
    */
   createOptionForm(form) {

      const { predefineds, defaultValue } = this.getPredefineds(form)
      const optionWrapper = new Div('SP__assembler__formModal__options')
      const optionLabel = new Div('SP__assembler__formModal__options__label')

      optionLabel.text(form.name)
      optionWrapper.append(optionLabel)
      predefineds.forEach(value => {
         const optionInner = new Button('SP__assembler__formModal__options__option')
         const optionName = new P('SP__assembler__formModal__options__option__name')
         const optionCheck = new Checkbox({
            active: false,
            radioKey: 'form' + form.id,
            propagate: false,
            background: 'var(--secondary)',
            onUnactive: () => this.setFormSelectionValue(form.id, null),
            onActive: () => this.setFormSelectionValue(form.id, value)
         })

         //Configurando
         optionName.text(value)
         optionInner.append(optionCheck.getView(), optionName)
         optionWrapper.append(optionInner)

         //Caso for o valor padrão
         if (value === defaultValue) {
            optionCheck.activate()
         }

         //Quando clique
         optionInner.click(() => {
            optionCheck.toggle()
         })
      })

      return optionWrapper
   }


   /**
    * Cria um formulário de upload
    * @param {object} form O formulário
    * @returns {JQuery<HTMLElement>} O elemento do formulário
    */
   createUploadForm(form) {
      const uploadWrapper = new Div('SP__assembler__formModal__upload')
      const uploadCancel = new Icon('SP__assembler__formModal__upload__cancel')
      const uploadImage = new Img('SP__assembler__formModal__upload__image')

      const removePlaceholder = (event) => {
         event.stopPropagation()
         uploadWrapper.removeClass('hasImage')
         uploadImage.attr('src', '')
         this.setFormSelectionValue(form.id, null)
      }

      const placePlaceholder = (image, extension) => {
         uploadWrapper.addClass('hasImage')
         uploadImage.attr('src', image)

         this.setFormSelectionValue(form.id, {
            image,
            extension
         })
      }

      const readFile = async (file) => {
         return new Promise(resolve => {
            const fileReader = new FileReader()
            fileReader.onload = ({ target }) => resolve(target.result)
            fileReader.onerror = () => PopUp.triggerError('Houve um erro ao ler seu arquivo.')
            fileReader.readAsDataURL(file)
         })
      }

      const tryToImportFile = async (file) => {
         const bytesAmountInOneMB = 1048576
         const isTypeValid = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)
         const isSizeValid = file.size <= (30 * bytesAmountInOneMB)
         const isFileValid = isTypeValid && isSizeValid

         if (!isFileValid) {
            PopUp.triggerFail('O arquivo enviado é invalido. Cerifique-se que o mesmo é uma imagem e possui menos de 30Mb.')
            return
         }

         const imageAsBase64 = await readFile(file)
         const fileExtension = file.name.split('.').pop()
         placePlaceholder(imageAsBase64, fileExtension)
      }

      const openFileImportMenu = () => {
         new Input()
            .attr('type', 'file')
            .on('change', function () { tryToImportFile(this.files[0]) })
            .trigger('click')
      }

      uploadCancel.addClass('ic-close')
      uploadWrapper.append(uploadCancel, uploadImage)
      uploadWrapper.click(() => openFileImportMenu())
      uploadCancel.click((event) => removePlaceholder(event))

      return uploadWrapper
   }

   /**
    * Cria um formulário de cor
    * @param {object} form O formulário 
    * @returns {JQuery<HTMLElement>} O elemento HTML
    */
   createPantoneForm(form) {

      const FPS_AMOUNT = 24
      let colorHEX = (this.getFormSelectionFor(form.id)?.hex ?? '#000000')
      let canChange = true

      const pickerLabel = new Div('SP__assembler__formModal__picker__label')
      const pickerWrapper = new Div('SP__assembler__formModal__picker')
      const colorPicker = colorjoe.rgb(new Div()[0], colorHEX)
      const pantoneSearch = new Input('SP__assembler__formModal__picker__search')
      const pantoneResults = new Div('SP__assembler__formModal__picker__results')
      const pickerColor = new Div('SP__assembler__formModal__picker__color')
      const divisorLine = new Div('SP__assembler__formModal__picker__divisor')

      const createPantone = ({ hex, name }) => {
         const pantoneWrapper = new Div('SP__assembler__formModal__picker__results__item')
         const pantoneTitle = new P('SP__assembler__formModal__picker__results__item__title')
         const pantoneColor = new Div('SP__assembler__formModal__picker__results__item__color')

         pantoneWrapper.attr('title', `${name} - ${hex}`)
         pantoneTitle.text(name)
         pantoneColor.css('background-color', hex)
         pantoneWrapper.append(pantoneTitle, pantoneColor)
         pantoneWrapper.click(() => {
            pantoneWrapper.siblings().removeClass('isSelected')
            pantoneWrapper.addClass('isSelected')
            pickerColor.attr('hex', hex)
            pickerColor.css('background-color', hex)

            this.setFormSelectionValue(form.id, {
               pan: name,
               hex: hex
            })

            canChange = false
            setTimeout(() => canChange = true, 25)
            colorPicker.set(hex)
         })

         return pantoneWrapper
      }

      const createClosestPantones = () => {
         const closestPantones = this.getClosestPantones(colorHEX)
         const allPantoneNodes = closestPantones.map(createPantone)

         pantoneResults.empty()
         pantoneResults.append(allPantoneNodes)
      }

      pantoneSearch.on('input', ({ target }) => {
         if (!target.value) {
            createClosestPantones()
            return
         }

         const typedText = target.value.trim().toLowerCase()
         const isHexValue = typedText.charAt(0) === '#'
         const matchPantones = Pantones.filter(({ name, hex }) => (isHexValue ? hex : name).toLowerCase().includes(typedText))
         const slicedPantones = matchPantones.slice(0, 80)
         const allMatchNodes = slicedPantones.map(createPantone)

         this.setFormSelectionValue(form.id, null)

         pantoneResults.empty()
         pantoneResults.append(allMatchNodes)
      })

      colorPicker.on('change', (color) => {
         if (!canChange) return
         canChange = false
         setTimeout(() => canChange = true, 1000 / FPS_AMOUNT)

         colorHEX = color.hex()

         this.setFormSelectionValue(form.id, null)

         pantoneSearch.val('')
         pickerColor.attr('hex', colorHEX)
         pickerColor.css('background-color', colorHEX)

         createClosestPantones()
      })

      pickerColor.on('click', () => {
         navigator.clipboard.writeText(colorHEX)
         PopUp.triggerCopy('Cor copiada.')
      })

      pickerLabel.text(form.name)
      pantoneSearch.attr('placeholder', 'Pesquise cores...')
      pickerWrapper.append(pickerLabel, colorPicker.e, pickerColor, pantoneSearch, divisorLine, pantoneResults)

      createClosestPantones()

      return pickerWrapper
   }

   /**
    * Cria um formulário de slider
    * @param {object} form Os dados do formulário 
    * @returns {JQuery<HTMLElement>} O elemento do formulário
    */
   createSliderForm(form) {
      const { predefineds, defaultValue, limitValue, limitOperation } = this.getPredefineds(form)

      //Caso não tenha nenhum valor predeinido para criar
      if (!predefineds.length) {
         this.openNoPredefinedsModal(limitValue, limitOperation)
         throw new Error('Sem valores predefinidos para criar oformulário')
      }

      return this.createSlider(form, predefineds, defaultValue)
   }

   /**
    * Abre uma mensagem dizendo que nenhum valor predinido válido foi encontrado
    * @param {number | null} limitValue O valor limitante
    * @param {number} limitOperation O tipo de restrição
    */
   openNoPredefinedsModal(limitValue, limitOperation) {
      new Modal({
         title: 'Erro!',
         icon: 'ic-close',
         autoOpen: true,
         zIndex: this.getModalsIndex(),
         color: 'var(--red)',
         message: `Parece que não há __nenhum valor predefinido__ para criar o formulário. ${limitValue !== null ? `A fórmula de limitação foi aplicada e manteve apenas os resultados __${limitOperation === 2 ? 'ABAIXO' : 'ACIMA'}__ do valor __${limitValue}__` : ''}`,
         buttons: [{
            type: 'filled',
            text: 'Entendi',
            color: 'var(--red)'
         }]
      })
   }

   /**
    * Cria um slider para um formulário
    * @param {object} form A configuração do formulário 
    * @param {number[]} predefineds Os valores predefinidos 
    * @param {number | null} defaultValue O valor padrão 
    * @returns {JQuery<HTMLElement>} O slider
    */
   createSlider(form, predefineds, defaultValue) {

      const sliderWrapper = new Div('SP__assembler__formModal__slider')
      const sliderLabel = new Div('SP__assembler__formModal__slider__label')
      const sliderInput = new Input('SP__assembler__formModal__slider__input')
      const sliderDiv = new Div('SP__assembler__formModal__slider__slider')
      const sliderChips = new Div('SP__assembler__formModal__slider__chips')

      const updateChips = (fromIndex) => {
         const closests = this.getClosestPredefineds(predefineds, fromIndex)
         const allChips = closests.map(value => {
            const chip = new Button('SP__assembler__formModal__slider__chips__chip')
            const valueIndex = predefineds.findIndex(predefined => predefined === Number(value))

            if (Number(value) === this.getFormSelectionFor(form.id)) chip.addClass('isActive')

            chip.text(value)
            chip.click(() => {
               this.setFormSelectionValue(form.id, Number(value))
               sliderInput.val(value)
               sliderWrapper.removeClass('hasError')
               sliderDiv.slider('value', valueIndex)
               updateChips(valueIndex)
            })

            return chip
         })

         sliderChips.empty()
         sliderChips.append(allChips)
      }

      sliderInput.val((this.getFormSelectionFor(form.id) || defaultValue || predefineds[0]).toFixed(2))
      sliderWrapper.append(sliderLabel, sliderDiv, sliderInput, sliderChips)
      sliderLabel.text(form.name)
      sliderInput.on('input', ({ target }) => {

         this.maskSliderValue(target)

         const maskedValue = isNaN(Number(target.value)) ? 0 : Number(target.value)
         const closestPredefined = this.findClosestPredefined(predefineds, maskedValue)
         const closestIndex = predefineds.findIndex(predefined => predefined === closestPredefined)
         const isValueValid = predefineds.includes(maskedValue)

         sliderDiv.slider('value', closestIndex)

         this.setFormSelectionValue(form.id, maskedValue)

         isValueValid
            ? sliderWrapper.removeClass('hasError')
            : sliderWrapper.addClass('hasError')

         updateChips(closestIndex)
      })

      sliderDiv.slider({
         range: 'min',
         value: predefineds.findIndex(predefined => predefined === Number(this.getFormSelectionFor(form.id) || defaultValue)),
         min: 0,
         max: predefineds.length - 1,
         steps: 1,
         slide: (event, { value }) => {
            this.setFormSelectionValue(form.id, predefineds[value])
            sliderInput.val(predefineds[value].toFixed(2))
            sliderWrapper.removeClass('hasError')
            updateChips(value)
         }
      })

      this.setFormSelectionValue(form.id, (this.getFormSelectionFor(form.id) || defaultValue || predefineds[0]))
      updateChips(predefineds.findIndex(predefined => predefined === Number(this.getFormSelectionFor(form.id) || defaultValue)))
      sliderInput.focus()

      return sliderWrapper[0]
   }

   /**
    * 
    * @param {object} form O formulário de peças 
    */
   createProductsPieceForm(form) {
      const piecesValidation = {}
      const validProducts = this.getValidProductsForPieceForm(form)

      validProducts.forEach(validProduct => {
         piecesValidation[validProduct.identifier] = new Set()
      })

      const formWrapper = new Div('SP__assembler__formModal__pieces')
      const productNodes = validProducts.map((product, index) => this.createPieceSelectionCard(product, index, ({
         productID,
         productTitle,
         pieceTitle,
         productIdentifier,
         pieceIdentifier
      }) => {
         const pieceKey = `#${productID + 1} ${productTitle} - ${pieceTitle}`
         const isPieceAdded = selectedProducts.get(pieceKey)
         const canAdd = (productsCount + 1) <= (form.maxQuantity ?? Infinity)

         if (!isPieceAdded && !canAdd) {
            PopUp.triggerFail(`Não é possível adicionar mais peças pois o limite de ${form.maxQuantity} foi atingido.`, null, 'ADD_PIECE_FORM_ERROR')
            return
         }

         isPieceAdded
            ? piecesValidation[productIdentifier].delete(pieceIdentifier)
            : piecesValidation[productIdentifier].add(pieceIdentifier)

         isPieceAdded
            ? selectedProducts.delete(pieceKey)
            : selectedProducts.set(pieceKey, true)

         isPieceAdded
            ? productsCount--
            : productsCount++

         form.pieces = piecesValidation
         form.value = Array.from(selectedProducts.keys()).join(',')
      }))

      let selectedProducts = new Map()
      let productsCount = 0

      formWrapper.append(...productNodes)

      return formWrapper
   }

   /**
    * Cria um cartão que permite selecionar as peças de um produto
    * @param {object} product O produto
    * @param {number} index O índice do produto 
    * @param {() => void} onClick O evento de clique  
    * @returns {JQuery<HTMLElement>}
    */
   createPieceSelectionCard(product, index, onClick) {
      const dataCart = new DataCart(product)

      const productWrapper = new Div('SP__assembler__formModal__pieces__product')
      const productItem = new CartItem({ dataCart, index })

      const pieceItems = dataCart.getMeasures().map(measure => {
         const pieceTitle = `Peça ${Utils.alphabet(true)[measure.id - 1]}`
         const checkbox = new Checkbox()

         const item = new Item({
            columns: ['min-content', '1fr'],
            left: checkbox.getView(),
            center: Item.title(pieceTitle),
            style: {
               item: {
                  width: '80%',
                  marginLeft: 'auto',
                  marginBottom: '0.5rem',
                  marginTop: '0.5rem'
               }
            },
            onClick: () => {
               onClick({
                  productID: product.id,
                  pieceIdentifier: measure.identifier,
                  productIdentifier: product.identifier,
                  productTitle: product.title,
                  pieceTitle: `Peça ${Utils.alphabet(true)[measure.id - 1]}`
               })
               checkbox.toggle()
            }
         })

         return item.getView()
      })


      productWrapper.append(productItem.getView(), ...pieceItems)

      return productWrapper
   }

   /**
    * Retorna os produtos válidos para um formulário de peças
    * @param {object} form O formulário 
    * @returns {object[]} A lista de produtos válidos
    */
   getValidProductsForPieceForm(form) {
      if (!this.cartAdapter) {
         return []
      }

      const matchingProducts = []
      const optionalsList = Utils.parseNumbersString(form.optional)
      const commoditiesList = Utils.parseNumbersString(form.commodity)

      if (!optionalsList.length && !commoditiesList.length) {
         return
      }

      this.cartAdapter.getProducts().forEach((product, index) => {
         const relatedProducts = this.dataCart.getModelRelatedProductIds()
         const needsRelation = relatedProducts.length > 0
         const isRelated = relatedProducts.includes(product.product.id)

         const optionalIds = product.compositions.map(option => {
            return Number(option.optionChildren ?? option.children)
         })

         const commodityIds = product.datasheet.map(commodity => {
            return Number(commodity.id)
         })

         if (needsRelation && !isRelated) {
            return
         }

         if (optionalsList.length && !optionalIds.some(optionalId => optionalsList.includes(optionalId))) {
            return false
         }

         if (commoditiesList.length && !commodityIds.some(commodityId => commoditiesList.includes(commodityId))) {
            return false
         }

         matchingProducts.push({
            ...product,
            id: index
         })
      })

      return matchingProducts
   }

   /**
    * Cria o modal que será usado pelos formulários
    * @param {object} optional O opcional
    */
   createFormsModal(optional) {
      return new Modal({
         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         css: 'isFormModal',
         hasIcon: false,
         shouldDetach: true,
         zIndex: this.getModalsIndex(),
         title: optional.title,
         message: this.coordinator.getParentCompositionForOptional(optional).title,
         buttons: [
            {
               type: 'blank',
               text: 'Cancelar',
            },
            {
               type: 'filled',
               text: 'Confirmar',
               closeOnClick: false,
               onClick: (modal) => this.tryToConfirmForm(optional, modal)
            }
         ]
      })
   }

   /**
    * Cria um formulário de valor fixo calculado por uma fórmula
    * @param {object} form O formulário
    * @returns {JQuery<HTMLElement>} O elemento do formulário
    */
   createFixedValueForm(form) {
      const formWrapper = new Div('SP__assembler__formModal__fixed')
      const formTitle = new Div('SP__assembler__formModal__fixed__title')
      const formValue = new Div('SP__assembler__formModal__fixed__value')
      
      const formulaResponse = FormulaParser.calculate(form.formulas.default, this.getAllVariables())

      formWrapper.append(formTitle, formValue)
      formTitle.append(form.name)
      formValue.text(formulaResponse?.result ?? 'Fórmula sem retorno')

      const openFormulaTab = () => {
         new FormulaTestTab({
            zIndex: 10000,
            autoOpen: true,
            formula: [
               '//Váriaveis;',
               this.getAllVariablesAsFormulaDeclarations(),
               '//Fórmula;',
               form.formulas.default
            ].join('\n\n')
         })
      }

      if (formulaResponse.result !== null) {
         this.setFormSelectionValue(form.id, formulaResponse.result)
      }

      if (formulaResponse.code !== 0) {
         formValue.addClass('hasError')
         formValue.text('Erro no cálculo da fórmula. Clique para detalhes')
         formValue.prepend(new Icon('ic-close'))
         formValue.click(() => openFormulaTab())
      }

      return formWrapper
   }

   /**
    * Tenta confirmar os formulários desta opção
    * @param {object} optional O opcional que tem formulários 
    */
   async tryToConfirmForm(optional, modal) {

      const forms = structuredClone(this.coordinator.getFormsForOptional(optional.id))
      const validations = await Promise.all(forms.map(form => this.validateForm(form)))
      const isEveryFormValid = validations.every(Boolean)

      if (!isEveryFormValid) {
         PopUp.triggerFail('Formulário inválido, verifique os dados e tente novamente.', null, 'INVALID_FORM')
         return false
      }

      if (modal) {
         modal.closeModal()
      }

      forms.forEach(form => {
         form.value = this.getFormSelectionFor(form.id)
      })

      this.setOptionalFormVariables(optional)
      this.confirmOptional({ ...optional, forms })

      return true
   }

   /**
    * Define as váriaveis de formulário
    * @param {object} optional O opcional com formulários 
    */
   setOptionalFormVariables(optional) {
      this.coordinator.getFormsForOptional(optional)
         .filter(form => this.isFormWithVariable(form))
         .forEach(form => this.setFormVariable(form.variable, this.getFormSelectionFor(form.id)))
   }

   /**
    * Define uma váriavel de formulário
    * @param {string} key O nome da variável
    * @param {unknown} value O valor da variável
    */
   setFormVariable(key, value) {
      this.formVariables[key] = value
   }

   /**
    * Remove uma váriavel de formulário
    * @param {string} key O nome da váriavel
    */
   unsetFormVariable(key) {
      delete this.formVariables[key]
   }


   /**
    * Checa se todos os formulários dentro de uma certa composição tem apenas um valor predefinido
    * Nem mais nem menos 
    */
   everyFormHasOnlyOnePredefined(option) {
      return this.coordinator.getFormsForOptional(option).every(form => {
         const { predefineds } = this.getPredefineds(form, { showWarnings: false })

         return predefineds.length === 1
      })
   }


   /**
    * Retorna se pode prosseguir com o formulário de peças
    * @param {object} optional O opcional em questão 
    * @returns {boolean} Se pode prosseguir ou não
    */
   canProceedWithPiecesForm(optional) {

      const forms = this.coordinator.getFormsForOptional(optional.id)
      const hasPieceForm = forms.some(form => form.typeField === 6)
      const matchingProducts = forms.flatMap(form => this.getValidProductsForPieceForm(form))

      if (!hasPieceForm) {
         return true
      }

      const isCreatingDraft = Session.get('currentDraftID')
      const cartProducts = this.getCartProducts()

      if (!isCreatingDraft) {
         new Modal({
            autoOpen: true,
            icon: 'ic-close',
            zIndex: this.getModalsIndex(),
            color: 'var(--red)',
            title: 'Não é possível prosseguir',
            message: 'Você __não__ está dentro de um __orçamento__ e este formulário precisa __acessar__ itens de um carrinho.',
            buttons: [{ type: 'filled', color: 'var(--red)', text: 'Entendi' }]
         })
         return false
      }

      if (hasPieceForm && matchingProducts.length === 0) {
         new Modal({
            autoOpen: true,
            icon: 'ic-close',
            color: 'var(--red)',
            zIndex: this.getModalsIndex(),
            title: 'Não é possível prosseguir',
            message: 'Parece que você não possui __nenhum__ item em seu carrinho que é __compatível__ com esta opção.',
            buttons: [{ type: 'filled', color: 'var(--red)', text: 'Entendi' }]
         })
         return false
      }

      if (cartProducts.length === 0) {
         new Modal({
            autoOpen: true,
            icon: 'ic-close',
            zIndex: this.getModalsIndex(),
            color: 'var(--red)',
            title: 'Não é possível prosseguir',
            message: 'Parece que você não possui __nenhum__ item em seu carrinho para continuar a montagem deste produto.',
            buttons: [{ type: 'filled', color: 'var(--red)', text: 'Entendi' }]
         })
         return false
      }

      if (this.hasUnfinishedProductOnCart()) {
         new Modal({
            autoOpen: true,
            zIndex: this.getModalsIndex(),
            icon: 'ic-close',
            color: 'var(--red)',
            title: 'Não é possível prosseguir',
            message: 'Parece que você possui um produto __não finalizado__ em seu carrinho. Não é possível prosseguir com este formulário.',
            buttons: [{ type: 'filled', color: 'var(--red)', text: 'Entendi' }]
         })
         return false
      }

      return true
   }








   getAllVariablesAsFormulaDeclarations() {
      return Object.entries(this.getAllVariables()).map(([key, value]) => `[${key}] = ${value};`).join('\n')
   }

   /**
    * Retorna se tem uma linha selecionada
    * @returns {boolean} Se tem uma linha selecionada
    */
   hasLineSelected() {

      // console.log("getLine");
      // console.log(this.dataCart.getLine());

      return this.dataCart.getLine()?.id
   }

   /**
    * Retorna a lista de produtos no carrinho do usuário
    * @returns {object[]} A lista de produtos no carrinho
    */
   getCartProducts() {
      return this.cartProducts
   }

   /**
    * Retorna a lista de IDS dos produtos do carrinho
    * @returns {number[]} A lista de IDS presentes no carrinho
    */
   getCartProductIDS() {
      return this.getCartProducts().map(({ product }) => Number(product.id))
   }

   /**
    * Retorna se tem algum produto no carrinho que não teve a montagem finalizada
    * @returns {boolean} Se tem um produto não finalizado ou não
    */
   hasUnfinishedProductOnCart() {
      return this.getCartProducts().some(product => product.isFinished === false)
   }

   /**
    * Retorna as medidas do produto atualmente
    * @returns {object[]} A lista de medidas do produto
    */
   getMeasures() {
      return this.dataCart.getMeasures()
   }

   /**
    * Retorna a quantidade de medidas atuais no carrinho
    * @returns {number} A quantidade de medidas
    */
   getMeasuresAmount() {
      return this.getMeasures().length
   }

   /**
    * Retorna uma medida por um ID
    * @param {number} id O id da medida
    * @returns {object | null} A medida ou nulo
    */
   getMeasureByID(id) {
      return this.getMeasures().find(measure => measure.id === id)
   }

   /**
    * Atualiza o tamanho de largura de uma medida
    * @param {number} id O ID da medida em questão
    * @param {number} newWidth O novo valor da medida
    */
   updateMeasureWidthByID(id, newWidth) {
      this.getMeasureByID(id).width = newWidth
      this.updateMeasureAreaByID(id)
   }

   /**
    * Atualiza o tamanho de altura de uma medida
    * @param {number} id O ID da medida em questão
    * @param {number} newHeight O novo valor da medida
    */
   updateMeasureHeightByID(id, newHeight) {
      this.getMeasureByID(id).height = newHeight
      this.updateMeasureAreaByID(id)
   }

   /**
    * Atualiza a medida de área de uma medida
    * @param {number} id O ID da medida
    */
   updateMeasureAreaByID(id) {
      const measure = this.getMeasureByID(id)

      if (!measure.width) {
         measure.area = 0
         return
      }
      if (!measure.height) {
         measure.area = 0
         return
      }

      measure.area = measure.width * measure.height
   }

   /**
    * Retorna os formulários pertencentes a um opcional
    * @param {number} optionalID O ID do opcional 
    * @returns {JQuery<HTMLElement>[]} O lista de opcionais para este produt
    */
   getFormsViewsForOptional(optionalID) {
      return this.coordinator.getFormsForOptional(optionalID)
         .map(form => this.createForm(form))
   }

   /**
    * Confirma um opcional para a montagem
    * @param {object} optional O opcional
    */
   confirmOptional(optional) {
      const parentComposition = this.coordinator.getParentCompositionForOptional(optional)
      const parentGroup = this.coordinator.getParentGroupForComposition(parentComposition)

      const viewInformation = {
         title: optional.title,
         description: parentComposition.title,
         groupName: parentGroup.title,
         image: optional.image,
         forms: optional.forms ?? []
      }

      const confirmedOptional = structuredClone({
         ...optional,
         type: 'optional',
         view: viewInformation,
      })

      if (optional.formulas) {
         const formulaReferences = optional.formulas
         const formulas = formulaReferences
            .map(formula => this.mapFormulaIdsToFormula(formula))
            .filter(Boolean)

         confirmedOptional.formulas = formulas
      }

      this.clearColorAutomaticCancelFor(optional)

      this.dataCart.getConfirmedOptions().push(confirmedOptional)
      this.logger.registerOptionalConfirm(confirmedOptional, parentComposition)

      this.renderGroupsSection()
      this.renderDeliverySection()
      this.renderWarrantySection()
      this.refreshSimulatorTab()
      this.tryToSwipeToNextGroupSlide()
      this.handleProductCompletePopup()
   }

   /**
    * Tenta mudar o slide para o próximo grupo se for possível
    */
   tryToSwipeToNextGroupSlide() {
      if (this.isAutoNavigationDisabled()) {
         return
      }
      if (!this.groupSwiper) {
         return
      }

      const activeGroupID = this.dataCart.getConfirmedOptions().at(-1).groupID
      const isUnfinished = this.coordinator.hasVisibleCompositionsInGroup(activeGroupID)

      if (isUnfinished) {
         return
      }

      const otherGroups = this.coordinator.getValidGroups().filter(group => group.id !== activeGroupID)
      const unfinishedGroups = otherGroups.filter(group => this.coordinator.hasVisibleCompositionsInGroup(group.id))
      const firstUnfinished = unfinishedGroups[0]

      if (!firstUnfinished) {
         return
      }

      setTimeout(() => {
         this.groupSwiper.slideTo(this.coordinator.getValidGroups().indexOf(firstUnfinished))
      }, 100)
   }

   /**
    * Abre um modal dizendo que não encontrou um opcional na pesquisa
    */
   openNoOptionalFoundModal() {
      new Modal({
         onEnter: (modal) => modal.closeModal(),
         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         uniqueToken: 'SEARCH_OPTIONAL_NOT_FOUND',
         title: 'Aviso',
         zIndex: this.getModalsIndex(),
         icon: 'ic-warning',
         color: 'var(--orange)',
         autoOpen: true,
         message: 'Nenhum opcional foi encontrado.',
         buttons: [{ type: 'filled', text: 'Fechar', color: 'var(--orange)' }]
      })
   }

   /**
    * Tenta carregar uma imagem
    * @param {string} imageLink O link do imagem 
    * @returns {Promise<boolean>} Se coseguiu carregar a mensagem
    */
   tryToLoadImage(imageLink) {
      return new Promise(resolve => {
         const image = new Image(imageLink)
         image.onload = () => resolve(true)
         image.onerror = () => resolve(false)
         image.src = imageLink
      })
   }

   /**
    * Funciona calculando a distância de duas cores
    * utilizando o algorítmo DeltaE.
    * 
    * 0 = Cores idênticas
    * 100 = Cores opostas
    */
   getClosestPantones(hex) {
      const colorToCompare = new Color(hex)

      return Pantones.filter(({ hex }) => {
         return colorToCompare.deltaE(hex, '2000') < 10
      })
   }

   /**
    * Função que válida um formulário
    * @param {object} form O formulário
    * @returns {Promise<boolean> | boolean} Se é válido ou não
    */
   validateForm(form) {
      if (!this.isFormRequired(form)) {
         return true
      }

      const validations = {
         1: () => this.validateTextForm(form),
         2: () => this.validateOptionForm(form),
         3: () => this.validateUploadForm(form),
         4: () => this.validatePantoneForm(form),
         5: () => this.validateSliderForm(form),
         6: () => true,
         7: () => this.validateFixedValueForm(form)
      }

      return validations[form.type]()
   }

   /**
    * Retorna se um formulário precisa ser preenchido
    * @param {object} form O formulário 
    * @returns {boolean} Se é obrigatório
    */
   isFormRequired(form) {
      return Boolean(form.required)
   }

   /**
    * Retorna se um formulário tem váriaveis para definir
    * @param {object} form O formulário 
    * @returns {boolean} Se tem váriaveis
    */
   isFormWithVariable(form) {
      return Boolean(form.variable)
   }

   /**
    * Retorna se um formulário de texto é válido
    * @param {object} form O formulário em questão 
    * @returns {boolean} Se é válido
    */
   validateTextForm(form) {
      const typedText = this.getFormSelectionFor(form.id)
      const isFormValid = typedText.length > 0

      return isFormValid
   }

   /**
    * Retorna se um formulário de opções é válido
    * @param {object} form O formulário em questão 
    * @returns {boolean} Se é válido
    */
   validateOptionForm(form) {
      const formValue = this.getFormSelectionFor(form.id)
      const predefineds = this.getPredefineds(form, { showWarnings: false }).predefineds
      const isFormValid = predefineds.includes(formValue)

      return isFormValid
   }

   /**
    * Retorna se um formulário de imagem é válido
    * @param {object} form O formulário em questão 
    * @returns {boolean} Se é válido
    */
   async validateUploadForm(form) {

      const { image, extension } = this.getFormSelectionFor(form.id)

      const currentDraftID = Session.get('currentDraftID')

      const loadingModal = new LoadingModal({
         title: 'Um momento',
         message: 'Estamos realizando seu upload',
         zIndex: this.getModalsIndex(),
      })

      const isUserOnDraft = !!currentDraftID

      let wasUploadSuccess = false

      if (!image) {
         return false
      }
      if (!extension) {
         return false
      }
      if (!isUserOnDraft) {
         return true
      }

      loadingModal.openModal()

      try {

         const fileName = new IDToken().getToken()
         const onlyBase64 = image.split(',')[1]

         const folderManager = new FolderManager(`${DRAFTS_FOLDER_PATH}/${currentDraftID}`, 'uploads')
         const response = await folderManager.uploadByURL(fileName, onlyBase64, extension)

         this.setFormSelectionValue(form.id, response)

         wasUploadSuccess = true

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um erro ao salvar sua imagem.')
         wasUploadSuccess = false

      } finally {

         loadingModal.closeModal()

      }

      return wasUploadSuccess
   }

   /**
    * Retorna se um formulário de pantones é válido
    * @param {object} form O formulário em questão 
    * @returns {boolean} Se é válido
    */
   validatePantoneForm(form) {
      const formValues = this.getFormSelectionFor(form.id)
      const hasSomeHexChosen = !!formValues['hex']
      const hasSomePantoneChosen = !!formValues['pan']
      const isPantoneFormValid = hasSomeHexChosen && hasSomePantoneChosen

      return isPantoneFormValid
   }

   /**
    * Retorna se um formulário de slider é válido
    * @param {object} form O formulário em questão 
    * @returns {boolean} Se é válido
    */
   validateSliderForm(form) {
      const valueToCheck = this.getFormSelectionFor(form.id)
      const formPredefineds = this.getPredefineds(form, { showWarnings: false }).predefineds
      const isFormValid = formPredefineds.includes(valueToCheck)

      return isFormValid
   }

   /**
    * Retorna se um formulário de valor fíxo é válido
    * @param {object} form O formulário em questão 
    * @returns {boolean} Se é válido
    */
   validateFixedValueForm(form) {
      return !!this.getFormSelectionFor(form.id)
   }

   addLinkedPiecesInfo(forms = []) {
      forms.forEach(form => {
         if (form.typeField === 6) {
            if (form.value) {

               this.linkedPiecesInfo[form.id] = form.pieces ?? []

            }
         }
      })
   }


   getPredefineds(form, { showWarnings = true } = {}) {
      if (!form.predefined) return { predefineds: [], defaultValue: null }

      //Pegando os dados
      const allVariables = { ...Datasheet.lastVariables, ...this.getAllVariables() }
      const formPredefinedsArr = form.predefined.split('\n')
      const predefinedsParsed = formPredefinedsArr.map(Number).filter(value => !isNaN(value))
      const hasLimitFormula = form.formula && form.formula.replaceAll('\n', '') !== ''
      const hasDefaultFormula = form.formulas.default && form.formulas.default.replaceAll('\n', '') !== ''
      const hasBetweenFormula = form.formulaFrom && form.formulaTo


      //Caso não houver formula 
      if (!hasLimitFormula && !hasDefaultFormula && !hasBetweenFormula) return {
         predefineds: predefinedsParsed,
         defaultValue: null,
         limitValue: null,
         limitOperation: null
      }

      //Dados que serão retornados
      let predefinedsAfterFormula = [...predefinedsParsed]
      let defaultValue = null
      let limitValue = null

      if (hasBetweenFormula) {

         const formulaFromResponse = FormulaParser.calculate(form.formulaFrom, allVariables)
         const formulaToResponse = FormulaParser.calculate(form.formulaTo, allVariables)

         const fromResult = formulaFromResponse.result
         const toResult = formulaToResponse.result

         //De 
         if (formulaFromResponse.code !== 0) {
            if (showWarnings) {
               this.triggerBetweenFormulaError(formulaFromResponse.formula, formulaFromResponse.message)
            }
         } else {
            if (fromResult !== null) {

               predefinedsAfterFormula = predefinedsAfterFormula.filter(value => value >= Number(fromResult))

            } else {

               this.triggerNoReturnOnFormulaWarning(formulaFromResponse.formula, 1)

            }
         }

         //Até
         if (formulaToResponse.code !== 0) {
            if (showWarnings) {
               this.triggerBetweenFormulaError(formulaToResponse.formula, formulaToResponse.message)
            }
         } else {
            if (toResult !== null) {

               predefinedsAfterFormula = predefinedsAfterFormula.filter(value => value <= Number(toResult))

            } else {

               this.triggerNoReturnOnFormulaWarning(formulaToResponse.formula, 1)

            }
         }


      } else if (hasLimitFormula) {

         const limitationFormula = FormulaParser.calculate(form.formula, allVariables)
         const limitResult = limitationFormula.result
         const limitOperation = Number(form.operation)
         const someErrorOcurred = Number(limitationFormula.code) !== 0

         if (someErrorOcurred) {
            if (showWarnings) {

               this.triggerFormulaErrorWarning(form.formula, limitationFormula.message, 1)

            }
         } else {
            if (limitResult !== null) {

               predefinedsAfterFormula = predefinedsAfterFormula.filter(value => limitOperation === 2 ? (value <= limitResult) : (value >= limitResult))
               limitValue = limitResult

            } else if (showWarnings) {


               this.triggerNoReturnOnFormulaWarning(form.formula, 1)
            }
         }
      }

      //Formula de valor padrão
      if (hasDefaultFormula) {
         const defaultFormula = FormulaParser.calculate(form.formulas.default, allVariables)
         const defaultResult = defaultFormula.result
         const someErrorOcurred = Number(defaultFormula.code) !== 0

         if (someErrorOcurred) {
            if (showWarnings) {

               this.triggerFormulaErrorWarning(form.formulas.default, defaultFormula.message, 2)

            }
         } else {
            if (defaultResult !== null) {

               defaultValue = predefinedsAfterFormula.includes(defaultResult) ? defaultResult : null

            } else if (showWarnings) {

               this.triggerNoReturnOnFormulaWarning(form.formulas.default, 2)

            }
         }
      }

      return {
         predefineds: predefinedsAfterFormula,
         defaultValue: defaultValue,
         limitValue: limitValue,
         limitOperation: Number(form.operation)
      }
   }

   /**
    * Mostra um modal dizendo que a formula possui erro de sintaxe. 
    */
   triggerFormulaErrorWarning(formula, errorMessage, type) {
      new Modal({
         onEnter: (modal) => modal.closeModal(),
         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         uniqueToken: `FORMULA_ERROR_MODAL_${type}`,
         title: 'Erro na fórmula de limitação!',
         icon: 'ic-close',
         color: 'var(--red)',
         zIndex: this.getModalsIndex(),
         message: `Não foi possivel calcular uma fórmula. __${errorMessage}__`,
         appendToContent: this.createFormulaWindow(formula, type),
         buttons: [{ type: 'filled', text: 'Entendi', color: 'var(--red)', }],
         autoOpen: true,
      })
   }

   /**
    * Mostra um modal dizendo que a formula possui erro. 
    */
   triggerBetweenFormulaError(formula, errorMessage) {
      new Modal({
         onEnter: (modal) => modal.closeModal(),
         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         uniqueToken: 'FORMULA_ERROR_MODAL',
         title: 'Erro na fórmula de limitação!',
         icon: 'ic-close',
         zIndex: this.getModalsIndex(),
         color: 'var(--red)',
         message: `Não foi possivel calcular uma fórmula. __${errorMessage}__`,
         appendToContent: this.createFormulaWindow(formula),
         buttons: [{ type: 'filled', text: 'Entendi', color: 'var(--red)', }],
         autoOpen: true,
      })
   }

   /**
    * Faz um modal aparecer para dizer que a formula não possui retorno
    * Type -> 1 = Fórmula de limitação
    * Type -> 2 = Fórmula de valor padrão
    */
   triggerNoReturnOnFormulaWarning(formula, type) {
      new Modal({
         onEnter: (modal) => modal.closeModal(),
         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         uniqueToken: `NO_FORMULA_RETURN_MODAL_${type}`,
         title: 'Aviso!',
         icon: 'ic-warning',
         color: 'var(--orange)',
         zIndex: this.getModalsIndex(),
         message: 'Parece que uma fórmula foi calculada, mas __não retornou__ nenhum resultado.',
         appendToContent: this.createFormulaWindow(formula),
         buttons: [{ type: 'filled', text: 'Entendi', color: 'var(--orange)', }],
         autoOpen: true,
      })
   }

   /**
    * Cria uma janela para mostrar uma fórmula
    * @param {string} formula A fórmula 
    * @returns {JQuery<HTMLElement>} A janela
    */
   createFormulaWindow(formula) {

      //Elementos
      const formulaWindow = new Div('SP__formula')
      const formulaNumbers = new Div('SP__formula__numbers')
      const formulaValue = new Div('SP__formula__lines')

      //Dados
      const formulaText = String(formula).trim()
      const formulaLines = formulaText.split('\n')
      const formatedLines = this.filterEmptyStartAndFormulaEndLines(formulaLines)

      let validLineCount = 1

      //Linhas
      formatedLines.forEach(line => {
         const lineEl = new Div('SP__formula__lines__line')
         const numberEl = new Div('SP__formula__numbers__number')
         const isLineComment = line.startsWith('//')
         const isLineEmpty = line.trim() === ''

         //Colocando numero quandoa linha fnor válida
         if (!isLineEmpty && !isLineComment) {
            numberEl.text(validLineCount)
            validLineCount++
         }

         //Caso for um comentário
         if (isLineComment) {
            lineEl.addClass('isComment')
         }

         //Configurando
         lineEl.text(line)
         lineEl.attr('title', line)

         //Adicionando
         formulaValue.append(lineEl)
         formulaNumbers.append(numberEl)
      })

      //Evento
      formulaWindow.click(() => {
         navigator.clipboard.writeText(formula)
         PopUp.triggerInfo('Fórmula copiada.', null, 'FORMULA_COPY')
      })

      //Montando
      formulaWindow.append(formulaNumbers, formulaValue)

      return formulaWindow
   }

   /**
    * Filtra o começo e o fim das linahs das fórmulas 
    * @param {string[]} lines A lista de linhas 
    * @returns {string[]} A lista de linhas válidas
    */
   filterEmptyStartAndFormulaEndLines(lines) {
      return lines.filter((line, index) => {
         const isLineEmpty = !String(line).trim()
         const isLineFirstOrLast = index === 0 || index === lines.length - 1

         if (!isLineEmpty || !isLineFirstOrLast) return true

         return false
      })
   }

   /**
    * Retorna todas as váriaveis para usar
    * @returns {object} As váriáveis
    */
   // getAllVariables() {
   //    return {}
   // }

   getAllVariables() {
      return {
         ...this.dataCart.getVariables()
      }      
 
      // versão antiga 
      // return {}
   } 
   /**
    * Retorna as váriaveis provenientes de composições
    * @returns {Record<string, unknown>} As váriaveis 
    */
   getCompositionFormVariables() {
      const allCompositions = this.getEveryGroupCompositions()
      const allCompsWithForm = allCompositions.filter(comp => comp.form?.length)
      const compVariables = {}

      allCompsWithForm.forEach(comp => {
         comp.form.forEach(form => {
            if (!form.variable) return
            compVariables[form.variable] = form.value
         })
      })

      return compVariables
   }

   /**
    * Retorna as váriaveis provenientes da ficha técnica
    * @returns {Record<string, unknown>} AS váriaveis
    */
   getVariablesFromDatasheet() {
      const datasheetItems = this.config.datasheet ?? []
      const itemsWithVariable = datasheetItems.filter(item => !!item.variable)

      return Object.fromEntries(itemsWithVariable.flatMap(item => {
         return item.variable.map(variable => {
            return [variable.var, Number(variable.value)]
         })
      }))

   }

   /**
    * Acha a lista de predefinidos mais perto deste predefinido
    * @param {number[]} predefineds Os predefinidos 
    * @param {number} number O número
    * @returns {number} O número mais próximo
    */
   findClosestPredefined(predefineds, number) {
      if (Number.isNaN(Number(number))) return predefineds[0]

      const closestSmall = [...predefineds].reverse().find(predefined => predefined <= number)
      const closestBigger = [...predefineds].find(predefined => predefined >= number)

      if (!closestSmall) return closestBigger
      if (!closestBigger) return closestSmall

      const smallerDifference = number - closestSmall
      const biggestDifference = closestBigger - number

      if (smallerDifference === biggestDifference) return closestSmall
      if (smallerDifference < biggestDifference) return closestSmall
      if (biggestDifference < smallerDifference) return closestBigger
   }

   /**
    * Retorna os predefinidos mais próximos
    * @param {number[]} predefineds A lista de valores predefinidos
    * @param {number} fromIndex O índice que se baseia a procura 
    * @returns {number[]} Os predefinidos mais próximos 
    */
   getClosestPredefineds(predefineds, fromIndex) {
      const closestPredefineds = []
      const indexToUse = fromIndex === undefined ? 0 : fromIndex
      let distance = 1

      closestPredefineds.push(predefineds[indexToUse])

      while (closestPredefineds.length < 4 && (indexToUse - distance !== -1 || indexToUse + distance < predefineds.length)) {
         const leftItem = predefineds[indexToUse - distance]
         const rightItem = predefineds[indexToUse + distance]

         if (rightItem !== undefined && closestPredefineds.length < 4) closestPredefineds.push(rightItem)
         if (leftItem !== undefined && closestPredefineds.length < 4) closestPredefineds.unshift(leftItem)

         distance++
      }

      return closestPredefineds.map(value => Number(value).toFixed(2))
   }


   /**
    * Mascara o valor de um slider
    * @param {HTMLInputElement} target O input 
    */
   maskSliderValue(target) {
      const typedValue = target.value
      const pastSelection = target.selectionStart

      const onlyNumbers = typedValue.replace(/[^\.\d]/gi, '')
      const max3Char = onlyNumbers.slice(0, 4)
      const withDot = max3Char.split('').map((char, index) => index === 1 && char !== '.' ? '.' + char : char).join('')
      const onlyOneDot = withDot.split('').filter((char, index, array) => {
         if (char !== '.') return true
         if (index === array.indexOf('.')) return true
         return false
      }).join('')
      const typedIllegalChar = typedValue.length > onlyOneDot.length

      target.value = onlyOneDot

      if (typedIllegalChar) {
         target.setSelectionRange(pastSelection - 1, pastSelection - 1)
      }
   }

   /**
    * Cria um bloco simples de visualização
    * @param {object} config A configuração
    * @returns {JQuery<HTMLDivElement>} O bloco
    */
   createSimpleBlock({ title, desc, additional, image, fit, css, children }) {

      const block = new Div('SP__modal__block')
      const blockTitle = new P('SP__modal__block__title')
      const blockDesc = new P('SP__modal__block__desc')
      const blockImage = new Div('SP__modal__block__image')
      const blockAdditional = new P('SP__modal__block__desc')
      const viewImageButton = new Icon('SP__modal__block__image__expand')

      viewImageButton.click(() => window.open(STORAGE_URL + image))
      viewImageButton.addClass('ic-eye-open')
      blockImage.addClass('isLoading')
      blockImage.css('background-size', fit ?? 'cover')
      blockAdditional.css('color', 'var(--green)')
      blockTitle.text(title ?? '[Sem título]')
      blockDesc.text(desc ?? '[Sem descrição]')
      blockAdditional.text(`+ ${CURRENCY} ${(additional ?? 0).toFixed(2)}`)

      if (css) {
         block.addClass(css)
      }

      //Pegando a imagem
      if (image) {
         this.tryToLoadImage(STORAGE_URL + image).then(wasSucess => {
            if (wasSucess) {

               blockImage.css('background-image', `url(${STORAGE_URL + image})`)
               blockImage.addClass('isLoaded')
               blockImage.append(viewImageButton)

            } else {

               blockImage.addClass('hasError')

            }

            blockImage.removeClass('isLoading')
         })
      }

      if (image) block.append(blockImage)
      if (title) block.append(blockTitle)
      if (desc) block.append(blockDesc)
      if (additional) block.append(blockAdditional)

      if (children) {
         block.append(children)
      }

      return block
   }

   /**
    * Abre um modal de seleção múltipla
    * @param {object} config A configuração
    */
   openMultipleSelectionModal({ items, createFunc, onConfirm, onClose, onSlide, css, arrows = true }) {

      let selectedIndex = 0

      const swiperWrapper = new Div('SP__assembler__swiper swiper')
      const swiperRow = new Div('SP__assembler__swiper__row swiper-wrapper')
      const swiperPagination = new Div('SP__assembler__swiper__pagination swiper-pagination')
      const swiperItems = items.map((item, index, array) => createFunc(item, index, array))
      const multipleSelectionModal = this.getMultipleSelectionModal(() => onConfirm(selectedIndex), onClose ? () => onClose(selectedIndex) : null)
      const leftArrow = new Icon('SP__assembler__swiper__arrow isLeft ic-chevron-left')
      const rightArrow = new Icon('SP__assembler__swiper__arrow isRight ic-chevron-right')

      //Adicionando a classe de slide
      swiperItems.forEach(item => item.addClass('swiper-slide'))

      //Configurando css
      swiperWrapper.css('box-shadow', 'none')
      swiperWrapper.addClass(css ?? '')

      //Montando
      swiperWrapper.append(swiperRow)
      swiperRow.append(swiperItems)
      swiperWrapper.append(swiperPagination)

      //Setas
      // if (arrows) swiperWrapper.append(leftArrow, rightArrow)

      //Eventos dos swiper
      const swiperEvents = {
         slideChange: function () {
            selectedIndex = this.activeIndex
            if (onSlide) onSlide(selectedIndex)
         }
      }

      //Ativando Swiper
      const swiper = new Swiper(swiperWrapper[0], {
         loop: false,
         slidesPerView: 1,
         grabCursor: true,
         autoHeight: true,
         centeredSlides: true,
         on: swiperEvents,
         modules: [Pagination],
         pagination: {
            el: swiperPagination[0],
            type: 'bullets',
            bulletClass: 'SP__assembler__swiper__pagination__bullet',
            bulletActiveClass: 'isActive',
            clickable: true
         },
      })

      //Eventos
      rightArrow.click(() => swiper.slideNext())
      leftArrow.click(() => swiper.slidePrev())

      //Inicializando
      multipleSelectionModal.appendToContent(swiperWrapper)
      multipleSelectionModal.openModal()
      swiper.init()
   }

   /**
    * Retorna um modal configurado para o seletor múltiplo
    * @param {() => void} onConfirm Ao confirmar 
    * @param {() => void} onClose Ao fechar
    * @returns {Modal} O modal 
    */
   getMultipleSelectionModal(onConfirm, onClose) {
      return new Modal({
         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         onClose: () => onClose && onClose(),
         css: 'noMinHeight',
         hasTitle: false,
         zIndex: this.getModalsIndex(),
         hasIcon: false,
         hasMessage: false,
         buttons: [{
            text: Translator.tC('actions:cancel'),
            type: 'blank'
         }, {
            text: Translator.tC('actions:confirm'),
            type: 'filled',
            closeOnClick: false,
            onClick: (modal) => {
               const canCloseModal = onConfirm()
               if (canCloseModal === false) return
               modal.closeModal()
            }
         }]
      })
   }

   /**
    * Abre um modal de seleção simples
    * @param {object} config A configuração
    */
   openSimpleSelectionModal({ title, desc, image, additional, onConfirm, onClose }) {
      new Modal({
         onClose: onClose,
         uniqueToken: 'SIMPLE_SELECTION_MODAL',
         css: 'isSelectorModal',
         hasTitle: false,
         hasMessage: false,
         zIndex: this.getModalsIndex(),
         hasIcon: false,
         appendToContent: this.createSimpleBlock({ title, desc, image, additional }),
         autoOpen: true,
         buttons: [{
            text: Translator.tC('actions:cancel'),
            type: 'blank'
         }, {
            text: Translator.tC('actions:confirm'),
            type: 'filled',
            onClick: () => onConfirm()
         }]
      })
   }

   /**
    * Retorna a visualização deste componente
    * @returns {JQuery<HTMLDivElement>} O node
    */
   getView() {
      return this.container
   }
}