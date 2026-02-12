import APIManager from '../../api/APIManager.js'
import { CURRENCY, STORAGE_URL } from '../../api/Variables.js'
import Colors from '../../core/Colors.js'
import Tab from '../../components/Tab.js'
import Modal from '../../core/Modal.js'
import PopUp from '../../core/PopUp.js'
import Sheet from '../../core/Sheet.js'
import Utils from '../../core/Utils.js'
import PriceList from '../../system/PriceList.js'
import SearchBar from '../../core/SearchBar.js'
import DotsMenu from '../../core/DotsMenu.js'
import { Canvas, Col, Colgroup, Div, Footer, Header, Icon, Img, P, Span, TBody, THead, Table, Td, Th, Tr } from '../../utils/Prototypes.js'
import UserStorage from '../../core/UserStorage.js'
import LoadingModal from './LoadingModal.js'
import FolderManager from '../../core/FolderManager.js'
import InputForm from '../../core/InputForm.js'
import Badge from '../../core/Badge.js'
import { ResourcesService } from '../../system/resources/ResourcesService.js'
import { ResourcesMapper } from '../../system/resources/ResourcesMapper.js'
import { ResourceNamesProvider } from '../../system/resources/ResourcesNamesProvider.js'
import * as htmlToImage from 'html-to-image'
import $ from 'jquery'
import { jsPDF } from 'jspdf'
import Translator from '../../translation/Translator.js'

export default class ProductPriceListTab extends Tab {
   constructor(config) {
      super({
         title: config.product.title,
         desc: Translator.tC('areas:description:pricing-tab'),
         css: 'hasContentSidePadding isProductPriceListTab isFull',
         hasFooter: false,
         openAnimation: 'slide-up',
         contentScroll: true,
         closeIcon: 'ic-down',
         ...config
      })

      //Elementos
      this.sheetWrapper = new Div('SP__salesWrapper')
      this.downloadMenu = new DotsMenu({
         icon: 'ic-download',
         iconSize: 32,
         color: 'var(--fifth)',
         options: [
            {
               color: 'var(--primary)',
               text: Translator.tC('actions:download-pdf'),
               onClick: () => this.openPDFModal()
            }
         ]
      })

      //Estado
      this.search = ''
      this.type = null
      this.method = null
      this.markup = 0

      //A barra de pesquisa
      this.searchBar = new SearchBar({
         css: 'isPriceListTabSearch',
         onInput: ({ target }) => {
            this.search = target.value.trim()
            this.priceSheet.render.renderItems()
         },
         onClear: () => {
            this.search = ''
            this.priceSheet.render.renderItems()

         },
         options: [
            {
               onChange: (state) => {
                  this.type = state.value
                  this.priceSheet?.render.renderItems()
               },
               type: 'select',
               label: Translator.tC('common:type'),
               options: [
                  {
                     text: Translator.tC('common:all'),
                     value: null
                  },
                  {
                     text: Translator.tC('common:collection_other'),
                     value: PriceList.TYPE_COLLECTION
                  },
                  {
                     text: Translator.tC('common:model_other'),
                     value: PriceList.TYPE_MODEL
                  },
                  {
                     text: Translator.tC('common:commodity_other'),
                     value: PriceList.TYPE_INPUT
                  },
                  {
                     text: Translator.tC('common:component_other'),
                     value: PriceList.TYPE_COMPONENT
                  },
                  {
                     text: Translator.tC('common:optional_other'),
                     value: PriceList.TYPE_OPTIONAL
                  },
               ]
            },
            {
               onChange: (state) => {
                  this.method = state.value
                  this.priceSheet?.render.renderItems()
               },
               type: 'select',
               label: Translator.tT('business:charge-type'),
               options: [
                  {
                     text: Translator.tC('common:all'),
                     value: null
                  },
                  {
                     text: Translator.tC('common:width'),
                     value: PriceList.WIDTH_BILLING
                  },
                  {
                     text: Translator.tC('common:height'),
                     value: PriceList.HEIGHT_BILLING
                  },
                  {
                     text: Translator.tC('common:area'),
                     value: PriceList.AREA_BILLING
                  },
                  {
                     text: Translator.tC('common:unit'),
                     value: PriceList.UNIT_BILLING
                  }
               ]
            },
            {
               onInput: (event) => setTimeout(() => {
                  this.markup = parseInt(event.target.value)
                  this.priceSheet?.render.renderItems()
               }),
               type: 'text',
               label: Translator.tC('common:markup'),
               mask: '##0,00%',
               maskOptions: {
                  reverse: true
               }
            }
         ]
      })

      //Tabela de preço do produto
      this.priceSheet = new Sheet({
         css: 'isBordered',
         scrollabe: true,
         render: {
            filterFunc: (items) => this.filterItems(items)
         },
         layout: [
            {
               label: Translator.tC('common:referent'),
               keys: ['name', 'category', 'print', 'allPrint'],
               align: 'left',
               size: '25%',
               css: { fontSize: '14px' },
               transform: (name, category, print, allPrint) => {

                  const items = []
                  const itemName = Sheet.bold(name)
                  const categoryName = new P().text(category)
                  const printRow = new Div()

                  categoryName.css('color', 'var(--fifth)')
                  printRow.css('display', 'flex')
                  printRow.css('gap', '0.25rem')
                  printRow.css('flex-wrap', 'wrap')
                  printRow.css('margin', '0.25rem 0')
                  
                  items.push(categoryName, itemName)

                  if (print || allPrint) {
                     if (allPrint) {

                        items.push(Translator.tC('business:all-prints'))

                     } else {

                        items.push(print.filter(Boolean).join(', '))
                     }

                     items.push(printRow)
                  }

                  return items
               }
            },
            {
               label: Translator.tC('business:charge-type'),
               keys: ['billing'],
               size: '7%',
               transform: (billing) => PriceList.getBillingName(billing)
            },
            {
               label: Translator.tC('common:model_one'),
               keys: ['model'],
               size: '15%',
               css: { paddingLeft: '1rem', paddingRight: '1rem' },
               transform: (model) => model ? model.filter(Boolean).join(', ') : 'Todos'
            },
            {
               label: Translator.tC('common:classification'),
               keys: ['classif'],
               size: '15%',
               css: { paddingLeft: '1rem', paddingRight: '1rem' },
               transform: (classif) => classif ? classif.filter(Boolean).join(', ') : 'Todas'
            },
            {
               label: Translator.tC('common:line_one'),
               keys: ['line'],
               size: '15%',
               css: { paddingLeft: '1rem', paddingRight: '1rem' },
               transform: (line) => line ? line.filter(Boolean).join(', ') : 'Todas'
            },
            {
               label: Translator.tC('common:measure_other'),
               keys: ['measures'],
               size: '15%',
               css: { paddingLeft: '1rem', paddingRight: '1rem' },
               transform: (measures) => {
                  if (!measures) return 'Sem regra'

                  const hasWidthRule = Number(measures.minWidth ?? 0) !== 0 || Number(measures.maxWidth ?? 0) !== 0
                  const hasHeightRule = Number(measures.minHeight ?? 0) !== 0 || Number(measures.maxHeight ?? 0) !== 0
                  const hasAreaRule = Number(measures.minArea ?? 0) !== 0 || Number(measures.maxArea ?? 0) !== 0

                  if (!hasWidthRule && !hasHeightRule && !hasAreaRule) return 'Sem regra'

                  const widthDesc = `${Utils.formatDecimals(measures.minWidth || '0')}m á ${Utils.formatDecimals(measures.maxWidth || '0')}m`
                  const heightDesc = `${Utils.formatDecimals(measures.minHeight || '0')}m á ${Utils.formatDecimals(measures.maxHeight || '0')}m`
                  const areaDesc = `${Utils.formatDecimals(measures.minArea || '0')}m á ${Utils.formatDecimals(measures.maxArea || '0')}m`

                  const widthBlock = Sheet.block(Sheet.bold('Largura:'), widthDesc)
                  const heightBlock = Sheet.block(Sheet.bold('Altura:'), heightDesc)
                  const areaBlock = Sheet.block(Sheet.bold('Área:'), areaDesc);

                  [widthBlock, heightBlock, areaBlock].forEach(block => block.css({
                     display: 'flex',
                     padding: '0.25rem 0.5rem',
                     backgroundColor: 'var(--secondary)',
                     border: '1px solid var(--fourth)',
                     borderRadius: '4px',
                     color: 'var(--primary)',
                     marginBottom: '0.25rem',
                     alignItems: 'center',
                     justifyContent: 'space-between',
                     width: '100%'
                  }))

                  return [
                     hasWidthRule ? widthBlock : null,
                     hasHeightRule ? heightBlock : null,
                     hasAreaRule ? areaBlock : null
                  ]
               }
            },
            {
               label: Translator.tC('common:total'),
               keys: ['price'],
               align: 'right',
               css: { whiteSpace: 'nowrap' },
               size: '8%',
               transform: (price) => {
                  if (this.markup) {

                     return [
                        Sheet.bold(`${CURRENCY} ${Utils.formatCurrency(Number(price) + ((Number(price) / 100) * this.markup))}`),
                        Sheet.block(`(Orig: ${CURRENCY} `.replaceAll(".",",") + Utils.formatCurrency(price) + ' )').css('color', 'var(--fifth)').css('font-size', '14px')
                     ]

                  } else {

                     return Sheet.bold(`${CURRENCY} ${Utils.formatCurrency(price)}`.replaceAll(".",","))

                  }
               }
            }
         ]
      })


      //Inicializando
      this.sheetWrapper.append(this.priceSheet.getView())
      this.prependToOptions(this.downloadMenu.getView())
      this.appendToContent(this.searchBar.getView(), this.sheetWrapper)
      this.initialize()
   }

   /**
    * Inicializa a aba de 
    */
   async initialize() {
      try {

         //Inicializando o Worker
         let [priceList, inputNames, resources] = await Promise.all([
            APIManager.fetchJSON(`${STORAGE_URL}portal/tariff/${this.config.product.id}.json?t=${crypto.randomUUID()}`),
            APIManager.fetchJSON(`${STORAGE_URL}portal/product/commodity-name-${this.config.product.id}.json?t=${new Date().getTime()}`),
            ResourcesService.fetch(this.config.product.id)
         ]);

         //Salvando dados para usar depois
         [this.sellerName, this.sellerID, this.resellerName, this.resellerImage, this.resellerID] = await Promise.all([
            UserStorage.getSellerInfo('name'),
            UserStorage.getSellerInfo('id'),
            UserStorage.getMemberInfo('name'),
            UserStorage.getMemberInfo('image'),
            UserStorage.getMemberInfo('id'),
         ])

         inputNames = Utils.toHash(inputNames, 'id')
         resources = ResourcesMapper.map(resources)         
         
         const namesProvider = new ResourceNamesProvider(resources)
         const items = []

         console.log(resources)
         console.log(namesProvider)
         
         

         //Coleções
         priceList.collection.forEach(collection => items.push({
            id: collection.id,
            type: PriceList.TYPE_COLLECTION,
            category: 'Coleções',
            name: namesProvider.getOptionalNameByChildrenId(Number(collection.optional)),
            billing: collection.billing,
            price: collection.price,
            allPrint: collection.allPrint,
            // print: collection.print ? Utils.parseIDS(collection.print).map(printID => productInfo.names.prints[printID]).filter(Boolean) : null,
            model: collection.model ? Utils.parseNumbersString(collection.model).map(modelID => namesProvider.getModelName(modelID)).filter(Boolean) : null,
            line: collection.line ? Utils.parseNumbersString(collection.line).map(lineID => namesProvider.getLineName(lineID)).filter(Boolean) : null,
            classif: collection.class ? Utils.parseNumbersString(collection.class).map(classID => namesProvider.getClassificationNameWithModel(classID)).filter(Boolean) : null,
            measures: {
               maxWidth: collection.maxWidth,
               maxHeight: collection.maxHeight,
               maxArea: collection.maxArea,
               minWidth: collection.minWidth,
               minHeight: collection.minHeight,
               minArea: collection.minArea,
            }
         }))

         //Modelos
         priceList.model.forEach(model => items.push({
            type: PriceList.TYPE_MODEL,
            category: 'Modelos',
            name: model.name,
            price: model.price,
            billing: model.billing,
            model: model.model ? Utils.parseNumbersString(model.model).map(modelID => namesProvider.getModelName(modelID)).filter(Boolean) : null,
            line: model.line ? Utils.parseNumbersString(model.line).map(lineID => namesProvider.getLineName(lineID)) : null,
            classif: model.class ? Utils.parseNumbersString(model.class).map(classID => namesProvider.getClassificationNameWithModel(classID)) : null,
            measures: {
               maxWidth: model.maxWidth,
               maxHeight: model.maxHeight,
               maxArea: model.maxArea,
               minWidth: model.minWidth,
               minHeight: model.minHeight,
               minArea: model.minArea,
            }
         }))

         //Insumos
         priceList.commodity.forEach(input => items.push({
            type: PriceList.TYPE_INPUT,
            category: Translator.tC('common:commodity_other'),
            name: inputNames[input.commodity]?.name ?? Translator.tC('empty:name'),
            price: input.price,
            billing: input.billing,
            model: input.model ? Utils.parseNumbersString(input.model).map(modelID => namesProvider.getModelName(modelID)).filter(Boolean) : null,
            line: input.line ? Utils.parseNumbersString(input.line).map(lineID => namesProvider.getLineName(lineID)) : null,
            classif: input.class ? Utils.parseNumbersString(input.class).map(classID => namesProvider.getClassificationNameWithModel(classID)) : null,
            measures: {
               maxWidth: input.maxWidth,
               maxHeight: input.maxHeight,
               maxArea: input.maxArea,
               minWidth: input.minWidth,
               minHeight: input.minHeight,
               minArea: input.minArea,
            }
         }))

         //Opcionais
         priceList.optional.forEach(optional => items.push({
            type: PriceList.TYPE_OPTIONAL,
            category: Translator.tC('common:optional_other'),
            model: optional.model ? Utils.parseNumbersString(optional.model).map(modelID => namesProvider.getModelName(modelID)).filter(Boolean) : null,
            line: optional.line ? Utils.parseNumbersString(optional.line).map(lineID => namesProvider.getLineName(lineID)) : null,
            classif: optional.class ? Utils.parseNumbersString(optional.class).map(classID => namesProvider.getClassificationNameWithModel(classID)) : null,
            billing: optional.billing,
            name: namesProvider.getOptionalNameByChildrenId(optional.optional) ?? Translator.tC('empty:name'),
            price: optional.price,
            measures: {
               maxWidth: optional.maxWidth,
               maxHeight: optional.maxHeight,
               maxArea: optional.maxArea,
               minWidth: optional.minWidth,
               minHeight: optional.minHeight,
               minArea: optional.minArea,
            }
         }))

         //Componentes
         priceList.component.forEach(component => items.push({
            type: PriceList.TYPE_COMPONENT,
            category: Translator.tC('common:component_other'),
            model: component.model ? Utils.parseNumbersString(component.model).map(modelID => namesProvider.getModelName(modelID)).filter(Boolean) : null,
            line: component.line ? Utils.parseNumbersString(component.line).map(lineID => namesProvider.getLineName(lineID)) : null,
            classif: component.class ? Utils.parseNumbersString(component.class).map(classID => namesProvider.getClassificationNameWithModel(classID)) : null,
            billing: component.billing,
            // name: productInfo.names.component[component.component] ?? '[Componente sem nome]',
            price: component.price,
            measures: {
               maxWidth: component.maxWidth,
               maxHeight: component.maxHeight,
               maxArea: component.maxArea,
               minWidth: component.minWidth,
               minHeight: component.minHeight,
               minArea: component.minArea,
            }
         }))

         this.priceSheet.render.setItems(items)

      } catch (error) {

         console.error(error)
         PopUp.triggerFail(Translator.tC('errors:when:loading-product-pricing'))

      }
   }

   /**
    * Filtra os items
    */
   filterItems(items) {
      return items.filter(item => {

         const isTypeValid = this.type ? item.type === this.type : true
         const isSearchValid = Utils.normalizeString(item.name ?? '').includes(Utils.normalizeString(this.search))
         const isMethodValid = this.method ? item.billing === this.method : true

         return isTypeValid && isSearchValid && isMethodValid

      })
   }

   /**
    * Abre um Modal dizendo o erro que aconteceu durante a montagem
    * @param {string} message A mensagem a ser mostrada 
    */
   openErrorModal(message) {
      new Modal({
         onEnter: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         onEscape: (modal) => modal.closeModal(),
         onClose: () => this.close(),
         icon: 'ic-close',
         color: 'var(--red)',
         title: Translator.tC('common:error') + '!',
         autoOpen: true,
         message: message,
         buttons: [{ type: 'filled', color: 'var(--red)', text: Translator.tC('actions:close') }]
      })
   }

   /**
    * Abre o modal de aviso prosseguir com o download do PDF
    */
   async openPDFModal() {
      new Modal({
         autoOpen: true,
         color: 'var(--red)',
         title: 'Atenção!',
         message: 'Estas informações são __confidenciais__ e não devem ser __compartilhadas externamente__. Violar estes termos pode resultar em __penalizações__.',
         icon: 'ic-warning',
         buttons: [
            { type: 'blank', text: Translator.tC('actions:go-back') },
            { type: 'filled', text: Translator.tC('messages:i-understand'), color: 'var(--red)', onClick: () => this.openPDFConfigurationModal() }
         ]
      })
   }

   openPDFConfigurationModal() {
      const inputForm = new InputForm({
         title: 'Configurações',
         css: 'noOverflow',
         showRequired: false,
         inputs: [
            {
               type: 'select',
               key: 'quality',
               label: 'Qualidade',
               value: 3,
               options: [
                  {
                     text: 'Baixa',
                     value: 1,
                  },
                  {
                     text: 'Normal',
                     value: 2,
                  },
                  {
                     text: 'Máxima',
                     value: 3,
                  }
               ]
            },
            {
               type: 'select',
               key: 'theme',
               label: 'Tema do PDF',
               value: 'light',
               options: [
                  {
                     text: 'Claro',
                     value: 'light',
                  },
                  {
                     text: 'Escuro',
                     value: 'dark',
                  }
               ]
            },
         ]
      })

      const modal = new Modal({
         title: 'Configurações',
         icon: 'ic-gear',
         message: `Altere as __configurações__ de seu PDF. Tempo de geração estimado: __${Math.round((this.getItems().length * 2) / 25)} segundos__.`,
         color: 'var(--orange)',
         buttons: [
            { type: 'blank', text: 'Voltar' },
            { type: 'filled', text: 'Gerar', color: 'var(--orange)', onClick: () => this.createPDFAndDownload(inputForm.getValues()) },
         ]
      })

      modal.appendToContent(inputForm.getView())
      modal.openModal()
   }

   /**
    * Cria a tabela do pdf o gera, e baixa
    * @param {number} scaleToUse A escala a ser utilizada  
    */
   async createPDFAndDownload({ quality = 3, theme = 'light' }) {

      const loadingModal = new LoadingModal({
         autoOpen: true,
         title: 'Aguarde',
         message: `Estamos __gerando__ seu PDF, seu __download__ começará em breve. Tempo estimado: __${Math.round((this.getItems().length * 2) / 25)} segundos__.`,
         hasFooter: true,
         buttons: [{ type: 'filled', color: 'var(--orange)', text: 'Cancelar', onClick: () => this.abortPDFGeneration() }],
         css: '',
      })

      try {

         if (this.getResellerImage()) await Utils.waitImageToLoad(this.getResellerImage())

         const identifier = crypto.randomUUID()
         const date = new Date().getTime()

         const container = new Div('SP__pricepdf__scroll')
         const content = new Div('SP__pricepdf')
         const title = new Div('SP__pricepdf__title')
         const header = this.createPDFHeader(identifier, date)
         const body = this.createPDFBody()
         const alert = this.createPDFAlert()

         title.text('Tabela de Valores')
         content.addClass(theme)
         container.append(content)
         content.append(
            title,
            header,
            alert,
            body,
         )

         this.appendAsHidden(container)
         this.preventAwningTablePageBreaks(content)

         this.canceledGeneration = false

         const pagesAmount = Math.ceil(content.outerHeight() / this.getMilimitersAsPixels(297))
         const statusBadge = new Badge({
            on: loadingModal.getView(),
            transform: [0, 0],
            static: true,
            round: false,
            title: `Páginas geradas 0/${pagesAmount}`,
            color: 'var(--fifth)',
            padding: '0.5rem',
            icon: 'ic-file',
            style: { marginBottom: '2rem' }
         })


         await this.registerPDFLogDownload(identifier, date)
         await this.generatePDFAndDownload(container, content, quality, loadingModal, statusBadge, pagesAmount)

      } catch (error) {

         console.error(error)
         loadingModal.closeModal()
         PopUp.triggerFail('Houve um erro ao criar a visualização do PDF. Contate o desenvolvedor.', this.tab, 'PDF_CREATE_ERROR')

      } finally {

         loadingModal.closeModal()

      }
   }

   /**
    * Previne a quebra de tabelas em duas páginas
    * @param {JQuery<HTMLDivElement>} container O container
    */
   preventAwningTablePageBreaks(container) {
      this.getAwningTables(container).forEach((table) => {

         //Tem de ser pego dentro do loop pois a quantidade de páginas aumenta se uma tabela for alterada
         const pagesAmount = Math.ceil(container[0].scrollHeight / this.getMilimitersAsPixels(297))
         const pageEnds = Array(pagesAmount).fill().map((_, index) => (index + 1) * this.getMilimitersAsPixels(297))

         //Posição e verificando quebra
         const position = this.getAwningTablePositionOnParent(container, table)
         const height = position.end - position.start
         const pageBreak = pageEnds.findIndex(pageLine => position.start < pageLine && position.end > pageLine)
         const isLargerThanPDFPage = height >= this.getMilimitersAsPixels(297)

         if (isLargerThanPDFPage) return
         if (pageBreak < 0) return

         const pageBreakHeight = pageEnds[pageBreak]
         const marginToPreventBreak = pageBreakHeight - position.start + 32

         $(table).css('margin-top', marginToPreventBreak + 'px')
      })
   }


   /**
    * Retorna o começo e o fim da tabela no pai
    * @param {JQuery<HTMLElement>} parent O pai 
    * @param {HTMLElement} table A tabela 
    * @returns {object} O começo e o fim da tabela no pai
    */
   getAwningTablePositionOnParent(parent, table) {
      const parentTop = parent[0].getBoundingClientRect().top
      const tableRect = table.getBoundingClientRect()
      const tableTop = tableRect.top - parentTop
      const tableEnd = tableTop + tableRect.height

      return {
         start: tableTop,
         end: tableEnd,
      }
   }

   /**
    * Retorna a posição das tabelas
    * @returns {object[]} A lista de posições das tabelas 
    */
   getAwningTables(container) {
      return Array.from(container.children('.SP__awningtable'))
   }

   /**
    * Cancela a geração de PDF pelo usuário 
    */
   abortPDFGeneration() {
      this.canceledGeneration = true
   }

   /**
    * Cria um log dizendo que foi baixado um PDF
    * @param {string} identifier O identificador do download 
    */
   async registerPDFLogDownload(identifier, date) {
      try {

         const sellerID = await UserStorage.getSellerInfo('id')
         const memberID = await UserStorage.getMemberInfo('id')

         const folderManager = new FolderManager(
            `portal/reseller/${memberID}/download/pricelist`,
            'logs'
         )

         const logData = {
            identifier: identifier,
            seller: sellerID,
            member: memberID,
            date: date,
            product: this.getProductID()
         }

         await folderManager.create(identifier, logData)

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Parece que houve um erro ao se autenticar. Tente novamente mais tarde', this.tab, 'PDF_AUTH_FAIL')

      }
   }

   /**
    * Cria uma mensagem de alerta do pdf
    * @returns {JQuery} O alerta
    */
   createPDFAlert() {
      const wrapper = new Div('SP__pricepdf__alert')
      const icon = new Icon('SP__pricepdf__alert__icon ic-warning')
      const message = new Div('SP__pricepdf__alert__message')

      message.text('Atenção! Não compartilhe este arquivo externamente.')
      wrapper.append(icon, message)

      return wrapper
   }

   /**
    * Gera a imagem do PDF e seu documento
    * @param {JQuery} container O container dentro
    * @param {JQuery} content O elemento da tabela
    * @param {number} scaleToUse A escala que será usada
    * @param {LoadingModal} loadingModal O modal de loading   
    * @param {Badge} statusBadge A badge de progresso
    */
   async generatePDFAndDownload(container, content, scaleToUse, loadingModal, statusBadge, pagesAmount) {
      try {

         const images = await this.createPDFContentImage(container, content, scaleToUse, statusBadge, pagesAmount)
         const document = new jsPDF({
            orientation: 'portrait',
            format: 'a4',
            encryption: { userPermissions: ['print'] }
         })

         document.deletePage(1)
         document.setDocumentProperties({
            title: this.getProductName(),
            author: `${this.getSellerNameWithID()} | ${this.getResellerNameWithID()}`,
            subject: 'Tabela de Preço',
         })

         images.forEach(base64 => {
            document.addPage()
            document.addImage(base64, 'JPEG', 0, 0, 210, 297)
         })

         await document.save(`Tabela de Preço - ${this.getProductName()} - ${new Date().toLocaleDateString('en-GB')}.pdf`, { returnPromise: true })

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um erro ao gerar seu PDF. Contate o desenvolvedor.', this.tab, 'PDF_GENERATE_ERROR')

      } finally {

         loadingModal.closeModal()
         container.remove()

      }
   }

   /**
    * Transforma milimetros em íxels
    * @param {number} milimeters Os milimetros
    * @returns {number} O tamanho em pixels 
    */
   getMilimitersAsPixels(milimeters) {
      return milimeters / 0.264583
   }

   /**
    * Transforma pixels em milimetros
    * @param {number} pixels Os pixels
    * @returns {number} O tamanho em milimetros 
    */
   getPixelAsMilimiters(pixels) {
      return pixels * 0.264583
   }

   /**
    * Retorna o tamanho em milimetros de um base64
    * @param {string} base64 O base 64 de uma imagem 
    * @returns {Promise<number>} O número em milímetros
    */
   getBase64HeightInMilimeters(base64) {
      return new Promise(resolve => {
         const image = new Image()

         image.onload = () => resolve(image.height * 0.264583333)
         image.src = base64
      })
   }

   /**
    * Retorna o tamanho de uma página de um PDF em milimetros
    * @returns {number} 
    */
   getPDFPageHeightInPixels() {
      return this.getMilimitersAsPixels(297)
   }

   /**
    * Cria a imagem do formulário
    * @param {JQuery} container O container do elemento
    * @param {JQuery} element Um elemento
    * @param {number} scale A escala da imagem
    * @param {Badge} statusBadge A Badge de progresso
    * @returns {Promise<string[]>} O base64 da imagem
    */
   async createPDFContentImage(container, element, scale, statusBadge, pagesAmount) {

      const imageSlices = []
      const pagesNumber = Math.ceil(element.outerHeight() / this.getPDFPageHeightInPixels())

      while (imageSlices.length < pagesNumber) {
         const sliceNum = imageSlices.length
         const sliceBase64 = await this.printElementSlice(container, element, sliceNum, scale)

         statusBadge.setTitle(`Páginas geradas ${sliceNum + 1}/${pagesAmount}`)

         if (this.didUserCancelGeneration()) throw new Error('Geração do PDF cancelada pelo usuário.')

         imageSlices.push(sliceBase64)
      }

      return imageSlices
   }

   /**
    * Retorna se o usuário cancelou a geração do PDF
    * @returns {boolean} Se o usuário cancelou a geração
    */
   didUserCancelGeneration() {
      return this.canceledGeneration
   }

   /**
    * Pega um pedaço da imagem de um elemento
    * @param {JQuery} container O elemento pai
    * @param {JQuery} element O elemnento
    * @param {number} sliceNum O número da fatia
    * @param {number} scale A escala sendo utilizada
    * @returns {Promise<string>} Um base64 do elemento
    */
   async printElementSlice(container, element, sliceNum, scale) {

      const topDistance = sliceNum * this.getPDFPageHeightInPixels()
      const elementClone = element.clone()

      const scaledWidth = this.getMilimitersAsPixels(210) * scale
      const scaledHeight = this.getMilimitersAsPixels(297) * scale

      elementClone.css({
         position: 'absolute',
         left: '0',
         top: -topDistance + 'px'
      })

      void (container[0].offsetHeight)
      void (elementClone[0].offsetHeight)

      container.empty()
      container.append(elementClone)

      const elementsToHide = Array.from(elementClone.find('.SP__pricetable, .SP__pricepdf__header, .SP__awningtable'))
      const elementRects = elementsToHide.map(table => table.getBoundingClientRect())

      elementRects.forEach((table, tableIndex) => {
         const element = $(elementsToHide[tableIndex])
         const elementTop = Math.round(table.top + topDistance - window.innerHeight)
         const elementHeight = element.outerHeight()
         const isVisible = ((elementTop + elementHeight) >= topDistance) && elementTop <= (topDistance + (scaledHeight / scale))

         if (isVisible) {
            if (!element.is('.SP__pricetable')) return

            const tableEntries = Array.from(element.find('.SP__pricetable__table__body__row'))
            const rowRects = tableEntries.map(row => row.getBoundingClientRect())

            const firstShownRectIdx = rowRects.findIndex(rect => (rect.top + rect.height + topDistance - window.innerHeight) >= topDistance)
            const lastShownRectIdx = rowRects.findIndex(rect => (rect.top + topDistance - window.innerHeight) >= (topDistance + (scaledHeight / scale)))

            const beforeElements = tableEntries.slice(0, firstShownRectIdx)
            const afterElements = tableEntries.slice(lastShownRectIdx)

            if (beforeElements.length > 1) {
               const squareHeight = beforeElements.reduce((totalHeight, element) => totalHeight + $(element).outerHeight(), 0)
               const square = new Div()

               square.css({
                  display: 'block',
                  width: '100%',
                  height: squareHeight + 'px',
               })

               $(beforeElements.at(-1)).after(square)

               beforeElements.forEach(element => $(element).remove())
            }

            afterElements.forEach(element => $(element).remove())


         } else {

            const replaceElement = new Div()
            const margins = {
               top: parseInt(element.css('margin-top')),
               bottom: parseInt(element.css('margin-bottom')),
            }
            
            replaceElement.css({
               width: '100%',
               marginTop: margins.top + 'px',
               marginBottom: margins.bottom + 'px',
               height: elementHeight + 'px',
               display: 'block'
            })

            element.after(replaceElement)
            element.remove()

         }
      })

      // eslint-disable-next-line no-undef
      return htmlToImage.toJpeg(container[0], {
         quality: 1,
         width: scaledWidth,
         canvasWidth: scaledWidth,
         canvasHeight: scaledHeight,
         height: scaledHeight,
         skipAutoScale: true,
         style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
         }
      })
   }

   /**
    * Adiciona um elemento na página de forma escondida
    * @param {JQuery} element Um elemento 
    */
   appendAsHidden(element) {
      $('body').append(element)
   }

   /**
    * Cria o header do PDF com as informações
    * @param {string} id O identificador
    * @returns {JQuery} O elemento do header
    */
   createPDFHeader(id, time) {
      const wrapper = new Header('SP__pricepdf__header')
      const logo = new Img('SP__pricepdf__header__logo')
      const info = new Div('SP__pricepdf__header__info')
      const image = new Img('SP__pricepdf__header__image')
      const users = new Div('SP__pricepdf__header__users')
      const title = new Div('SP__pricepdf__header__info__title')
      const seller = new Div('SP__pricepdf__header__users__seller')
      const reseller = new Div('SP__pricepdf__header__users__reseller')
      const details = new Div('SP__pricepdf__header__details')
      const date = new Div('SP__pricepdf__header__details__date')
      const identifier = new Div('SP__pricepdf__header__details__id')

      logo.attr('src', this.getResellerImage())
      image.attr('src', STORAGE_URL + this.getProductImagePath())
      title.text(this.getProductName())
      date.text(new Date(time).toLocaleString('en-GB').split(', ').join(' às '))
      identifier.text(id)
      seller.text(this.getSellerName())
      reseller.text(this.getResellerName())

      wrapper.append(
         logo,
         image,
         info,
         users,
         details
      )

      info.append(
         title,
         seller,
      )

      users.append(
         seller,
         reseller
      )

      details.append(
         date,
         identifier
      )

      return wrapper
   }

   /**
    * Cria o corpo do pdf
    * @returns {JQuery} O elemento do corpo
    */
   createPDFBody() {
      const categoriesData = this.getCategoriesData()
      const validCategories = categoriesData.filter(categoryData => !this.isCategoryEmpty(categoryData.type))
      const categoriesTables = validCategories.flatMap(categoryData => this.createTableForPDF(categoryData))

      return categoriesTables
   }

   /**
    * Cria uma tabela com os dados de uma categoria
    * @param {object} category Os dados da categoria
    * @returns {JQuery<HTMLDivElement>[]} O elemento da tabela
    */
   createTableForPDF(tableInfo) {
      if (this.shouldCreateAwningTable(tableInfo.type)) {

         return this.createAwningTables(tableInfo)

      } else {

         return this.createStandardTable(tableInfo)

      }
   }

   /**
    * Cria uma tabela simples
    * @param {object} tableInfo A informaçã da tabela
    * @returns {JQuery<HTMLDivElement>} A tabela
    */
   createStandardTable({ name, type }) {
      const wrapper = new Div('SP__pricetable')
      const title = new Div('SP__pricetable__title')
      const table = new Table('SP__pricetable__table')
      const thead = new THead('SP__pricetable__table__head')
      const tbody = new TBody('SP__pricetable__table__body')
      const overlay = new Div('SP__pricetable__table__overlay')
      const colgroup = new Colgroup('SP__pricetable__table__colgroup')

      const colgroupItems = this.getColgroupCols()
      const headerItems = this.getTableHeaders().map((title) => this.createHeaderLabel(title))
      const bodyItems = this.getSortedItemsForCategory(type).map((item) => this.createBodyItem(this.getItemTableData(item)))

      wrapper.attr('type', type)
      overlay.css('background-image', `url(${this.createTableWaterMark()})`)
      title.text(name)

      wrapper.append(
         title,
         table,
      )

      table.append(
         colgroup,
         thead,
         tbody,
         overlay
      )

      colgroup.append(
         ...colgroupItems
      )

      thead.append(
         ...headerItems
      )

      tbody.append(
         ...bodyItems
      )

      return [wrapper]
   }

   /**
    * Cria uma tabela para toldos
    * @param {object} tableInfo A informação da tabela
    * @returns {JQuery<HTMLDivElement>} A tabela
    */
   createAwningTables() {
      return Object.entries(this.getCollectionsPricingList()).flatMap(([colName, pricings]) => {
         return Object.entries(this.groupPricingsByModel(pricings)).flatMap((([modelName, modelPricings]) => {
            return Object.entries(this.groupPricingsByClassif(modelName, modelPricings)).flatMap((([classifName, classifPricings]) => {

               return this.createClassifTable(colName, modelName, classifName, classifPricings)

            }))
         }))
      })
   }

   /**
    * Cria uma tabela referente a uma classificação de uma coleção
    * @param {string} collectionName O nome da coleção
    * @param {string} modelName O nome do modelo
    * @param {string} classifName O nome da classificação
    * @param {object[]} pricings As precificações
    * @returns {JQuery<HTMLDivElement>} O elemento da tabela
    */
   createClassifTable(collectionName, modelName, classifName, pricings) {

      const tableWrapper = new Div('SP__awningtable')
      const tableOverlay = new Div('SP__awningtable__overlay')
      const tableTopbar = new Header('SP__awningtable__header')
      const tableBottom = new Footer('SP__awningtable__footer')
      const tableName = new Div('SP__awningtable__header__name')
      const tableDescription = new Div('SP__awningtable__header__description')
      const tableElement = new Table('SP__awningtable__table')
      const tableBody = new TBody('SP__awningtable__table__body')
      const tableHead = new TBody('SP__awningtable__table__head')

      //Dados
      const uniqueSubclass = new Set(pricings.flatMap(pricing => pricing.subClassif ? [pricing.subClassif] : []))
      const uniqueHeights = new Set(pricings.map(pricing => parseFloat(pricing.measures.maxHeight)))
      const uniqueWidths = new Set(pricings.map(pricing => parseFloat(pricing.measures.maxWidth)))
      const hasSublassifs = uniqueSubclass.size > 0
      const tableRows = []


      for (let y = 0; y < uniqueHeights.size; y++) {
         tableRows.push(
            ...this.createAwningTableRow(
               pricings,
               [...uniqueSubclass],
               [...uniqueHeights].sort((a,b) => a - b)[y],
               [...uniqueWidths].sort((a,b) => a - b)
            )
         )
      }

      tableName.text(collectionName)
      tableDescription.text(modelName + ' > ' + classifName)
      tableOverlay.css('background-image', `url(${this.createTableWaterMark()})`)

      tableHead.append(
         ...this.getAwningTableHeaders(Array.from(uniqueWidths), hasSublassifs)
      )

      tableBody.append(
         ...tableRows
      )

      tableTopbar.append(
         tableName,
         tableDescription
      )

      tableWrapper.append(
         tableTopbar,
         tableElement,
         tableBottom,
         tableOverlay
      )

      tableElement.append(
         tableHead,
         tableBody
      )

      return tableWrapper
   }


   /**
    * Cria a precificação de uma linha
    * @param {object[]} pricings As precificações 
    * @param {string[]} subClassifs As subclassificações 
    * @param {number} height A altura atual
    * @param {number[]} widths As larguras desta linha
    * @returns {JQuery<HTMLTableRowElement>} O elemento da linha
    */
   createAwningTableRow(pricings, subClassifs, height, widths) {
      if (subClassifs.length) {

         return this.createSublassifAwningTableRows(pricings, subClassifs, height, widths)

      } else {

         return [this.createSimpleAwningTableRow(pricings, height, widths)]

      }
   }

   /**
    * Cria a precificação de uma linha
    * @param {object[]} pricings As precificações 
    * @param {string[]} subClassifs As subclassificações 
    * @param {number} height A altura atual
    * @param {number[]} widths As larguras desta linha
    * @returns {JQuery<HTMLTableRowElement>} O elemento da linha
    */
   createSublassifAwningTableRows(pricings, subClassifs, height, widths) {
      const heightRow = new Tr('SP__awningtable__table__body__row')
      const heightCol = new Td('SP__awningtable__table__body__row__col')
      const subclassifRows = subClassifs.map((subclassif, index) => {
         const row = new Tr('SP__awningtable__table__body__row')
         const name = new Td('SP__awningtable__table__body__row__col')
         const values = widths.map(width => this.findPricingMatching(pricings, subclassif, width, height))
         const columns = values.map(value => new Td('SP__awningtable__table__body__row__col').text(value ? value.price : '- - -'))

         if (index % 2) {
            name.css('background-color', Colors.third)
         }

         row.append(name)
         row.append(columns)
         name.text(subclassif)

         return row
      })

      heightRow.append(heightCol)
      heightCol.text(height)
      heightCol.attr('rowspan', subClassifs.length + 1)

      return [heightRow, ...subclassifRows]
   }
   /**
    * Cria a precificação de uma linha
    * @param {object[]} pricings As precificações 
    * @param {string} subclassif A subclassificação
    * @param {number} height A altura atual
    * @param {number} width A largura atual
    * @returns {object | null} O pricing
    */
   findPricingMatching(pricings, subclassif, width, height) {
      return pricings.find(pricing => {
         const matchesSubclassif = pricing.subClassif === subclassif
         const matchesWidth = Number(pricing.measures.maxWidth ?? Infinity) >= width && width >= Number(pricing.measures.minWidth ?? Number.NEGATIVE_INFINITY)
         const matchesHeight = Number(pricing.measures.maxHeight ?? Infinity) >= height && height >= Number(pricing.measures.minHeight ?? Number.NEGATIVE_INFINITY)

         return matchesSubclassif && matchesWidth && matchesHeight
      })
   }

   /**
    * Cria a precificação de uma linha simples (Sem sublassificação)
    * @param {object[]} pricings As precificações 
    * @param {number} height A altura atual
    * @param {number[]} widths As larguras desta linha
    * @returns {JQuery<HTMLTableRowElement>} O elemento da linha
    */
   createSimpleAwningTableRow(pricings, height, widths) {
      const tableRow = new Tr('SP__awningtable__table__body__row')
      const matchingPricings = widths.map(width => this.findPricingMatchingSizes(pricings, width, height))
      const rowData = [height, ...matchingPricings.map(pricing => pricing ? pricing.price : '- - -')]

      rowData.forEach(data => tableRow.append(new Td('SP__awningtable__table__body__row__col').text(data)))

      return tableRow
   }

   /**
    * Cria uma row de sublassifcação
    * @param {string} subclassName O nome da classificação
    * @returns {JQuery<HTMLTableRowElement>} A linha 
    */
   createSubclassifRow(subclassName) {
      const row = new Tr('SP__awningtable__table__body__row')
      const column = new Td('SP__awningtable__table__body__row__col')

      column.text(subclassName)
      row.append(column)

      return row
   }

   /**
    * Retorna a lista de precificações que bate com tamanho de altura e largura
    * @param {object[]} pricings A lista de precificações 
    * @param {number} width A largura
    * @param {number} height A altura
    * @returns {object | null} o Tamanho 
    */
   findPricingMatchingSizes(pricings, width, height) {
      return pricings.find(pricing => {
         const matchesWidth = Number(pricing.measures.maxWidth ?? Infinity) >= width && width >= Number(pricing.measures.minWidth ?? Number.NEGATIVE_INFINITY)
         const matchesHeight = Number(pricing.measures.maxHeight ?? Infinity) >= height && height >= Number(pricing.measures.minHeight ?? Number.NEGATIVE_INFINITY)

         return matchesWidth && matchesHeight
      })
   }

   /**
    * Retorna as colunas do header da tabela
    * @param {number} heights Os tamanhos de altura 
    * @param {boolean} hasSublass Se tem sublasses
    * @returns {JQuery<HTMLTableCellElement>[]} Os headers
    */
   getAwningTableHeaders(heights, hasSublass) {
      const headers = ['Altura']

      if (hasSublass) {
         headers.push('Classificação')
      }

      if (heights.length) {
         headers.push(...heights.sort((a, b) => a - b))
      }

      return headers.map(title => new Th().text(title))
   }

   /**
    * Agrupa precificações por seus modelos
    */
   groupPricingsByModel(pricings) {
      return pricings.reduce((modelGroups, pricing) => {
         if (pricing.model) {

            pricing.model.forEach(modelName => {

               modelGroups[modelName]
                  ? modelGroups[modelName].push(pricing)
                  : modelGroups[modelName] = [pricing]

            })

         } else {

            modelGroups['Todos os modelos']
               ? modelGroups['Todos os modelos'].push(pricing)
               : modelGroups['Todos os modelos'] = [pricing]

         }

         return modelGroups
      }, {})
   }

   /**
    * Agrupa precificações por classificação
    */
   groupPricingsByClassif(modelName, pricings) {
      return pricings.reduce((classifGroups, pricing) => {
         if (pricing.classif) {
            pricing.classif.forEach(classif => {
               const [model, classifName] = classif.split(' > ')

               if(modelName !== 'Todos os modelos' && modelName !== model) return

               classifGroups[classifName]
                  ? classifGroups[classifName].push(pricing)
                  : classifGroups[classifName] = [pricing]


            })
         } else {

            classifGroups['Todas as classificações']
               ? classifGroups['Todas as classificações'].push(pricing)
               : classifGroups['Todas as classificações'] = [pricing]

         }

         return classifGroups
      }, {})
   }

   /**
    * Retorna as coleções unicamente
    * @returns {object} Um objeto com as informações das colunas
    */
   getCollectionsPricingList() {
      return Object.groupBy(this.getItemsForCategory(PriceList.TYPE_COLLECTION), (collection) => collection.name)
   }

   /**
    * Retorna se deve criar uma tabela simples
    * @param {number} type O tipo dos items
    * @returns {boolean} Se deve criar uma simples
    */
   shouldCreateAwningTable(type) {
      return type === PriceList.TYPE_COLLECTION && this.isProductAwning()
   }

   /**
    * Retorna se o produto é um toldo
    * @returns {boolean} Se é um toldo
    */
   isProductAwning() {
      return Number(this.config.product.category.id) === 3
   }

   /**
    * Retorna o valor de tamanho das colunas
    * @returns {JQuery[]} As colunas
    */
   getColgroupCols() {
      return [
         new Col().css('width', '25%'),
         new Col().css('width', '7.5%'),
         new Col().css('width', '14%'),
         new Col().css('width', '14%'),
         new Col().css('width', '14%'),
         new Col().css('width', '15.5%'),
         new Col().css('width', '10%').css('text-align', 'right'),
      ]
   }

   /**
    * Cria uma marca d'água para colocar em cima da tabela
    * @param {string} name A categoria da tabela
    * @returns {JQuery} O elemento da marca d'água 
    */
   createTableWaterMark() {
      const canvas = new Canvas()
      const context = canvas[0].getContext('2d')

      const sellerLetterCount = this.getSellerNameWithID().split('').length
      const resellerLetterCount = this.getResellerName().split('').length
      const canvasWidth = Math.max(sellerLetterCount * 40, resellerLetterCount * 40) + 200
      const textColor = getComputedStyle(document.body).getPropertyValue('--primary')

      canvas.attr('width', canvasWidth)
      canvas.attr('height', 400)

      context.font = '60px sans-serif'
      context.fillStyle = textColor
      context.textAlign = 'center'

      context.fillText(this.getSellerNameWithID(), canvasWidth / 2, 100)
      context.fillText(this.getResellerNameWithID(), canvasWidth / 2, 100 + 60 + 30)

      return canvas[0].toDataURL('image/png')
   }

   /**
    * Retorna o nome do vendedor com o id
    * @returns {string} O nome do vendedor com o id
    */
   getSellerNameWithID() {
      return `${this.sellerName} (#${this.sellerID})`
   }

   /**
    * Retorna o nome do vendedor
    * @returns {string} O nome do vendedor
    */
   getSellerName() {
      return `${this.sellerName}`
   }

   /**
    * Retorna a imagem do resseller
    * @returns {string} O link da imagem da revenda
    */
   getResellerImage() {
      return this.resellerImage
   }

   /**
    * Retorna o nome da revenda
    * @returns {string} O nome da revenda
    */
   getResellerName() {
      return this.resellerName
   }

   /**
    * Retorna o nome da revenda
    * @returns {string} O nome da revenda
    */
   getResellerNameWithID() {
      return `${this.resellerName} (#${this.resellerID})`
   }

   /**
    * Cria uma label para o header
    * @param {string} title O título da coluna
    * @returns {JQuery} O elemento da coluna 
    */
   createHeaderLabel(title) {
      const column = new Td('SP__pricetable__table__head__item')
      const label = new Div('SP__pricetable__table__head__item__label')

      column.append(label)
      label.text(title)

      return column
   }

   /**
    * Cria um item para o corpo
    * @param {object} item Um item da tabela de preço
    * @returns {JQuery} O elemento da linha
    */
   createBodyItem(labels) {
      const row = new Tr('SP__pricetable__table__body__row')
      const columns = labels.map(label => this.createBodyColumn(label))

      row.append(columns)

      return row
   }

   /**
    * Cria uma coluna da tabela
    * @param {string} label O título da coluna 
    * @returns {JQuery} O elemento da coluna
    */
   createBodyColumn(label) {
      return new Td('SP__pricetable__table__body__row__column').append(label)
   }

   /**
    * Retorna os dados em texto de um item da tabela de preço
    * @param {object} item Os dados de um item da tabela de preço 
    * @returns {string[]} Os textos a serem colocados na tabela
    */
   getItemTableData({ model, line, classif, name, price, measures, billing, print, allPrint }) {
      const priceText = CURRENCY + ' ' + Utils.formatCurrency(price ?? '0,00')
      const modelText = model ? model.join(', ') : 'Todos'
      const lineText = line ? line.join(', ') : 'Todas'
      const classifText = classif ? classif.join(', ') : 'Todas'
      const billingText = PriceList.getBillingName(billing)

      const nameText = []
      const measuresText = []

      if (+measures.maxWidth) {
         measuresText.push(`Larg: ${parseFloat(measures.minWidth ?? 0)}m até ${parseFloat(measures.maxWidth)}m`)
      }
      if (+measures.maxHeight) {
         measuresText.push(`Alt: ${parseFloat(measures.minHeight ?? 0)}m até ${parseFloat(measures.maxHeight)}m`)
      }
      if (+measures.maxArea) {
         measuresText.push(`Área: ${parseFloat(measures.minArea ?? 0)}m até ${parseFloat(measures.maxArea)}m`)
      }
      if (!measuresText.length) {
         measuresText.push('---')
      }

      name
         ? nameText.push(name)
         : nameText.push('[Sem nome]')



      if (print || allPrint) {
         allPrint
            ? nameText.push(new Span().text('Todas as estampas').prop('outerHTML'))
            : nameText.push(new Span().text(print.filter(Boolean).join(', ')).prop('outerHTML'))
      }

      return [
         nameText.join('\n'),
         billingText,
         modelText,
         classifText,
         lineText,
         measuresText.join('\n'),
         priceText
      ]
   }

   /**
    * Retorna os títulos do header
    * @returns {string[]} A lista de títulos do header
    */
   getTableHeaders() {
      return [
         'Referente',
         'Cobrança',
         'Modelo',
         'Classificação',
         'Linhas',
         'Medidas',
         `Valor ${CURRENCY}`
      ]
   }

   /**
    * Retorna os dados de uma categoria com seus items
    * @returns {object[]} A lista de categorias 
    */
   getCategoriesData() {
      return [
         {
            name: 'Coleções',
            type: PriceList.TYPE_COLLECTION,
         },
         {
            name: 'Modelos',
            type: PriceList.TYPE_MODEL,
         },
         {
            name: 'Insumos',
            type: PriceList.TYPE_INPUT,
         },
         {
            name: 'Componentes',
            type: PriceList.TYPE_COMPONENT,
         },
         {
            name: 'Opcionais',
            type: PriceList.TYPE_OPTIONAL,
         }
      ]
   }

   /**
    * Retorna a lista de items da tabela de preço
    * @returns {object[]} Todos os items que podem ser cobrados
    */
   getItems() {
      return [...this.priceSheet.render.getItems()]
   }

   /**
    * Retorna o ID do produto da aba atual
    * @returns {number} O ID do produto
    */
   getProductID() {
      return this.config.product.id
   }

   /**
    * Retorna o nome do produto da aba atual
    * @returns {string} O nome do produto
    */
   getProductName() {
      return this.config.product.title
   }

   /**
    * Retorna o caminho da imagem
    * @returns {string} O caminho da imagem
    */
   getProductImagePath() {
      return this.config.product.image
   }

   /**
    * Retorna os items pertencentes aquela categoria
    * @param {1|2|3|4|5} categoryID O ID da categoria
    * @returns {object[]} A lista de items da categoria
    */
   getItemsForCategory(categoryID) {
      return this.getItems().filter(item => item.type === categoryID)
   }

   /**
    * Retorna se uma categoria tem items
    * @param {1|2|3|4|5} categoryID O ID da categoria
    * @returns {boolean} Se tem algum item
    */
   isCategoryEmpty(categoryID) {
      return !this.getItemsForCategory(categoryID).length
   }

   /**
    * Retorna os items pertencentes aquela categoria sorteados alfabéticamente
    * @param {1|2|3|4|5} categoryID O ID da categoria
    * @returns {object[]} A lista de items da categoria
    */
   getSortedItemsForCategory(categoryID) {
      return Utils.sortAlphabeticaly(this.getItemsForCategory(categoryID), 'name')
   }
}