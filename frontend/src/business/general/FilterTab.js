import Tab from '../../components/Tab.js'
import PopUp from '../../core/PopUp.js'
import APIManager from '../../api/APIManager.js'
import { Div, Label, Input, H4, Button, P, Icon } from '../../utils/Prototypes.js'
import { IDToken } from '../../utils/IDToken.js'
import { CURRENCY } from '../../api/Variables.js'
import $, { get } from 'jquery'

export default class FilterTab extends Tab {
   constructor(config) {
      
      super({
         title: 'Filtros',
         desc: 'Utilize os filtros para realizar uma busca mais específica.',
         leftButtonText: 'Remover Filtro',
         rightButtonText: 'Buscar',
         hasLoader: true,
         onLeftButtonClick: () => this.removeFilters(),
         onRightButtonClick: () => this.makeCallbackAndClose(),
         ...config
      })

     
      //Estado
      this.lastFilterData = null
      this.possibleSegments = null
      this.possibleProductsCategories = null

      //Elementos
      this.filtersForm = new Div('SP__filters')

      this.initalize()
   }

   async initalize() {
      this.setupFilters()
      this.appendToContent(this.filtersForm)
   }

   /**
    * Remove o valor de todos os filtro, fecha a aba, e reconstrói todos os filtros
    */
   removeFilters() {
      this.unsetFilterValues()
      this.makeCallbackAndClose(true)
      this.setupFilters()
   }

   /**
    * Remove todos os valores do objeto de filtragem que não sejam necessário para reconstruir o filtro
    */
   unsetFilterValues() {
      const whiteList = ['type', 'callback']
      const filterKeys = Object.keys(this.config.filters)

      filterKeys.forEach(key => {
         if (!whiteList.includes(key)) {
            this.config.filters[key] = {}
         }
      })
   }

   /**
    * Tenta chamar o callback com os valores da filtragem 
    */
   makeCallbackAndClose(isFilterRemoval) {
      console.log('makeCallbackAndClose');
       
      const polishedFilters = this.polishFilters(this.config.filters)
      const isFilterActive = Object.values(polishedFilters).some(Boolean)
      const isSameFilterData = JSON.stringify(polishedFilters) === JSON.stringify(this.lastFilterData)

      //Caso forem aplicados os mesmos filtros
      if (isSameFilterData && !isFilterRemoval) {
         PopUp.triggerInfo('Nenhuma alteração nos filtros.', this.tab, 'FILTER_CALLBACK_FAIL')
         return
      }

      isFilterActive
         ? this.config.filterButton?.addClass('hasFilterOn')
         : this.config.filterButton?.removeClass('hasFilterOn')

      this.lastFilterData = polishedFilters

      console.log('%c aqui passa os filtros!', 'color: red;')      

      this.config.filters.callback(polishedFilters) //aqui passa os filtros
      this.close()
   }


   /**
    * Vai para o topo do formulário
    */
   scrollToFormTop() {
      this.filtersForm.scrollTop(0)
   }

   /**
    * Poli os filtros retorna apenas os filtros que tem valor ou não sou parâmetros para construção 
    */
   polishFilters() {
      const clonedFilters = JSON.parse(JSON.stringify(this.config.filters))
      const filterEntires = Object.entries(clonedFilters)
      const polishedFilters = Object.fromEntries(filterEntires.filter(([key, value]) => {

         const isKeyBlacklisted = ['callback', 'type'].includes(key)
         const isValueArray = Array.isArray(value)
         const isValueObject = typeof value === 'object' && value !== null
         const isValuePrimitive = !isValueArray && !isValueObject

         if (isKeyBlacklisted) return false
         if (isValueArray) return value.length
         if (isValueObject) return Object.keys(value).length > 0
         if (isValuePrimitive) return !!value

      }))

      return polishedFilters
   }

   /**
    * Limpa a aba de filtros e recria todos os filtros
    */
   setupFilters() {
      const filterSetups = {
         'sales': () => this.setupSalesFilters(),
         'products': () => this.setupProductsFilters(),
         'partners': () => this.setupPartnersFilters(),
         'buyers': () => this.setupBuyersFilter(),
         'checkPoints': () => this.setupCheckPointsFilters(),
      }

      this.filtersForm.empty()
      filterSetups[this.config.filters.type]()
      this.scrollToFormTop()
   }

   /**
    * Cria os filtros para a filtragem de VENDAS
    */
   setupSalesFilters() {
      const { date, price, orderType, status } = $.extend(true, this.config.filters, this.initialSalesFilters)

      if (!this.initialSalesFilters) {
         this.initialSalesFilters = JSON.parse(JSON.stringify(this.config.filters))
      }

      const textFilter = this.createTextFilter({})
      const orderTypeFilter = this.createChipsFilter(orderType)
      const dateFilter = this.createDateFilter(date)
      const statusFilter = this.createChipsFilter(status)
      const priceFilter = this.createPriceFilter(price)

      this.filtersForm.append(textFilter, orderTypeFilter, dateFilter, statusFilter, priceFilter)
   }

   /**
    * Cria o filtro de clientes
    */
   setupBuyersFilter() {
      const textFilter = this.createTextFilter()
      this.filtersForm.append(textFilter)
   }

   /**
    * Cria o filtro para a filtragem de PARCEIROS
    */
   async setupPartnersFilters() {
      const possibleSegments = (this.possibleSegments ?? await APIManager.getRepository('segment'))
      const textFilter = this.createTextFilter({})
      const segmentFilter = this.createChipsFilter({ key: 'segment', values: possibleSegments })

      this.possibleSegments = possibleSegments
      this.filtersForm.append(textFilter, segmentFilter)
   }

   
   /**
    * Cria o filtro para filtragem de PRODUTOS
    */
   async setupCheckPointsFilters() {
      // const { category, classification, room } = (this.possibleProductsCategories ?? await APIManager.getRepository())
      const pointsProgram = getPointsProgramOptions()
      const profiles = getProfiles()
      const pointsProgramFilter = this.createSelectFilter(pointsProgram)
      const profilesFilter = this.createChipsFilter(profiles)
      
      this.filtersForm.append(pointsProgramFilter, profilesFilter)

      function getPointsProgramOptions(){
         return {
               label:'Programa de Pontos',
               options: [
                        {
                           text: 'Amopontos 2025',
                           icon: 'ic-subclasses',
                           value:'mix'
                        },
                        {
                           text: 'Amopontos 2026',
                           icon: 'ic-subclasses',
                           value:'mix'
                        },
                     ],
               onChange:async (state) => {
                  // let param = {
                  //    ...self.currentFilters,
                  //    searchScope:state.value
                  // }
                  // self.currentFilters = param
                  // self.filterSales(param) 
               } 
         }
      }
      function getProfiles(){
         return {
            "key": "profile",
            "values": [
               {
                     "id": 1,
                     "name": "Arquiteto"
               },
               {
                     "id": 2,
                     "name": "Escritório"
               }
            ]
         }
      }
   }

   /**
    * Cria o filtro para filtragem de PRODUTOS
    */
   async setupProductsFilters() {
      const { category, classification, room } = (this.possibleProductsCategories ?? await APIManager.getRepository())

      const categoryFilter = this.createCategoryFilter({ category, classification })
      const roomFilters = this.createChipsFilter({ key: 'room', values: room })
      const searchFilter = this.createTextFilter({})

      this.possibleProductsCategories = { category, classification, room }
      this.filtersForm.append(searchFilter, ...categoryFilter, roomFilters)
   }

   /**
    * Cria um filtro de Categoria > Classificação  
    */
   createCategoryFilter({ category, classification }) {

      let classificationFilter = this.createChipsFilter({ key: 'classification', values: [] })
      const categoryFilter = this.createChipsFilter({
         key: 'category', values: category, afterClick: ({ id, name }) => {
            const isValueActive = name === this.config.filters.category
            const filteredClassifications = classification.filter(classif => classif.parent === id)
            const valuesInClassification = isValueActive ? filteredClassifications : []
            const newClassificationFilter = this.createChipsFilter({
               key: 'classification',
               values: valuesInClassification
            })

            classificationFilter.replaceWith(newClassificationFilter)
            classificationFilter = newClassificationFilter
            this.config.filters.classification = ''
         }
      })

      return [categoryFilter, classificationFilter]
   }

   /**
    * Cria um filtro de texto 
    */
   createTextFilter({
      key = 'search',
      title = 'Pesquisar',
      placeholder = 'Digite o que você está buscando',
   } = {}) {

      //Criando elementos
      const textFilter = new Div('SP__filters__text')
      const textTitle = new Label('SP__filters__text__title')
      const textInput = new Input('SP__filters__text__input')

      //Configurando
      const ID = new IDToken().getToken()
      textTitle.attr('for', ID)
      textInput.attr('id', ID)
      textTitle.text(title)
      textInput.attr('type', 'text')
      textInput.attr('placeholder', placeholder)
      textInput.on('input', ({ target }) => this.config.filters[key] = target.value)
      textInput.on('keyup', (event) => event.which === 13 && this.makeCallbackAndClose())
      textFilter.append(textTitle, textInput)

      //Pré-adicionando chave
      this.config.filters[key] = ''

      return textFilter
   }

   /**
    * Cria filtro slider de preço 
    */
   createPriceFilter({
      key = 'price',
      title = 'Faixa de preço',
      min = 0,
      max = 5000,
   } = {}) {

      const SELF = this

      //Criando elementos pais
      const priceWrapper = new Div('SP__filters__price')
      const priceTitle = new H4('SP__filters__price__title')
      const priceSlider = new Div('SP__filters__price__slider')

      //Convifurando elementos pais
      priceTitle.text(title)

      //Criando preço mínimo
      const minPriceDiv = new Div('SP__filters__price__minprice')
      const minPriceLabel = new Label('SP__filters__price__minprice__label')
      const minPriceValue = new Input('SP__filters__price__minprice__value')
      const minPriceId = new IDToken().getToken()

      //Configurando preço mínimo
      minPriceLabel.text('Preço mínimo')
      minPriceLabel.attr('for', minPriceId)
      minPriceValue.attr('id', minPriceId)
      minPriceValue.attr('type', 'text')
      minPriceValue.val(min)
      minPriceDiv.append(minPriceLabel, minPriceValue)
      minPriceValue.on('input', (event) => {
         this.priceInputMaskHandle(event)
         SELF.config.filters[key].min = this.getUnmaskedPriceInputValue(event)
      })
      minPriceValue.trigger('input')

      //Criando preço máximo
      const maxPriceDiv = new Div('SP__filters__price__maxprice')
      const maxPriceLabel = new Label('SP__filters__price__maxprice__label')
      const maxPriceValue = new Input('SP__filters__price__maxprice__value')
      const maxPriceId = new IDToken().getToken()

      //Configurando preço máximo
      maxPriceLabel.text('Preço máximo')
      maxPriceLabel.attr('for', maxPriceId)
      maxPriceValue.attr('id', maxPriceId)
      maxPriceValue.attr('type', 'text')
      maxPriceValue.val(max)
      maxPriceDiv.append(maxPriceLabel, maxPriceValue)
      maxPriceValue.on('input', (event) => {
         this.priceInputMaskHandle(event)
         SELF.config.filters[key].max = this.getUnmaskedPriceInputValue(event)
      })
      maxPriceValue.trigger('input')

      
      //Configurando slider
      priceSlider.slider({
         range: true,
         min: min,
         max: max,
         values: [min, max],
         classes: {
            'ui-slider-handle': 'SP__filters__price__slider__handle',
            'ui-slider-range': 'SP__filters__price__slider__range'
         },
         slide: function (event, ui) {
            const curMinPrice = ui.values[0]
            const curMaxPrice = ui.values[1]

            minPriceValue.val(curMinPrice)
            minPriceValue.trigger('input')
            maxPriceValue.val(curMaxPrice)
            maxPriceValue.trigger('input')

            SELF.config.filters[key].min = curMinPrice
            SELF.config.filters[key].max = curMaxPrice
         }
      })

      //Montando
      priceWrapper.append(priceTitle, priceSlider, minPriceDiv, maxPriceDiv)

      //Pré-adicionando a chave
      this.config.filters[key] = {
         min: min,
         max: max,
      }

      return priceWrapper
   }

   /**
    * Aplica uma máscara de preço ao digitar em um input 
    */
   priceInputMaskHandle({ target }) {

      const CURRENCY_TEXT = CURRENCY + ' '
      const pastCaretPos = target.selectionStart
      const newInputText = target.value
      const textWithoutRS = newInputText.replace(/^R?\$? ?/gi, '')
      const textHasLetters = /\D/gi.test(textWithoutRS)
      const textWithoutLetters = textWithoutRS.replace(/\D/gi, '').split(',')[0]
      const startCaretPos = textHasLetters ? pastCaretPos - 1 : Math.max(CURRENCY_TEXT.length, pastCaretPos)

      target.value = CURRENCY_TEXT + textWithoutLetters
      target.setSelectionRange(startCaretPos, startCaretPos)
   }

   createDateFilter({
      key = 'date',
      title = 'Período',
      start = '2018-10-02',
      end = '2021-05-23',
   } = {}) {
      //Criando elementos pais
      const dateFilter = new Div('SP__filters__date')
      const dateTitle = new H4('SP__filters__date__title')

      //Configurando elementos pais
      dateTitle.text(title)

      //Criando data de início
      const dateStartDiv = new Div('SP__filters__date__mindate')
      const dateStartLabel = new Label('SP__filters__date__mindate__label')
      const dateStartValue = new Input('SP__filters__date__mindate__value')
      const dateStartId = new IDToken().getToken()

      //Configurando data de início
      dateStartLabel.text('Inicial')
      dateStartLabel.attr('for', dateStartId)
      dateStartValue.attr('id', dateStartId)
      dateStartValue.attr('type', 'date')
      dateStartValue.val(start)
      dateStartDiv.append(dateStartLabel, dateStartValue)
      dateStartValue.on('change', ({ target }) => this.config.filters[key].start = target.value)

      //Criando data máxima
      const dateEndDiv = new Div('SP__filters__date__maxdate')
      const dateEndLabel = new Label('SP__filters__date__maxdate__label')
      const dateEndValue = new Input('SP__filters__date__maxdate__value')
      const dateEndId = new IDToken().getToken()

      //Configurando data máxima
      dateEndLabel.text('Final')
      dateEndLabel.attr('for', dateEndId)
      dateEndValue.attr('id', dateEndId)
      dateEndValue.attr('type', 'date')
      dateEndValue.val(end)
      dateEndDiv.append(dateEndLabel, dateEndValue)
      dateEndValue.on('change', ({ target }) => this.config.filters[key].end = target.value)

      //Montando
      dateFilter.append(dateTitle, dateStartDiv, dateEndDiv)

      //Pré-adicionando a chave
      this.config.filters[key] = {}

      return dateFilter
   }

    /**
    * Cria um filtro de Chips 
    */
   createChipsFilter({ key, values, multiple, afterClick }) {
      //Criando e tratando dados
      const translatedTitle = this.getChipTitleTranslated(key)
      const chipFilter = new Div('SP__filters__tags')
      const chipTitle = new H4('SP__filters__tags__title')
      const chipGrid = new Div('SP__filters__tags__grid')

      //Configurando e montando
      chipTitle.text(translatedTitle)
      chipFilter.append(chipTitle, chipGrid)

      //Criando cada chip
      values.forEach(({ id, name, backgroundActive, code }, index) => {
         const chip = new Button('SP__filters__tags__grid__tag')

         chip.attr('data-id', id)
         chip.text(name)
         chip.click(() => {
          
            const isTagActive = multiple
               ? this.config.filters[key].includes(name)  
               : this.config.filters[key] === name

            if (multiple) {
               isTagActive
                  ? this.config.filters[key] = this.config.filters[key].filter(val => val !== name)
                  : this.config.filters[key].push(name)
            } else {
               isTagActive
                  ? this.config.filters[key] = ''
                  : this.config.filters[key] = name
            }
            
            if (!isTagActive && backgroundActive) {
               chip.css('color', 'white')
               chip.css('background-color', backgroundActive)
            } else {
               chip.css('color', '')
               chip.css('background-color', '')
            }

            chip.attr('active', !isTagActive)

            if(!multiple){
               chip.siblings().attr('active', false)
               chip.siblings().css('background-color', '')
               chip.siblings().css('color', '')
            }
 
            if (afterClick) {
               afterClick({ id, name })
            } 
         })

         chip.css('transform', 'scale(0)')
         setTimeout(() => chip.css('transform', 'scale(1)'), index * 30 + 1)

         chipGrid.append(chip)
      })

      if(multiple){
         this.config.filters[key] = []
      }

      if (values.length === 0) {
         const messageWrapper = new Div('SP__filters__message')
         const messageText = new Div('SP__filters__message__text')
         const messageIcon = new Div('SP__filters__message__icon')

         messageText.text('Clique em alguma categoria para inciar')
         messageIcon.addClass('ic-info-circle')
         messageWrapper.append(messageIcon, messageText)

         chipGrid.append(messageWrapper)
      }

      return chipFilter
   }

   // by: Thiago Cazuni
   createSelectFilter({ label, options, onChange }){
      console.log(options);
      
      
      const optionWrapper = new Div('SP__searchbar__options__select')
      const optionInner = new Div('SP__searchbar__options__select__inner')
      const optionLabel = new P('SP__searchbar__options__select__label')
      const optionText = new Div('SP__searchbar__options__select__inner__text')
      const optionIcon = new Icon('SP__searchbar__options__select__inner__icon ic-down')
      const optionMenu = new Div('SP__searchbar__options__select__inner__menu')
      
      const setOption = (option) => {
         optionText.text(option.text)
         onChange(option)
      }
      
      const createOption = ({ text, value }) => {
         const option = new Div('SP__searchbar__options__select__inner__menu__option')
         option.text(text)
         option.click(() => setOption({ text, value }))
         return option
      }  

      window.addEventListener('click', ({ target }) => {
         const isOption = target === optionWrapper[0]
         const isContained = optionWrapper[0].contains(target)

         if(isOption || isContained) return

         optionInner.removeClass('isOpen')
      })

      setOption(options[0])


      optionInner.click(() => optionInner.toggleClass('isOpen'))
      optionInner.css('min-width', Math.max(...options.map(option => option.text.length)) + 5 + 'ch') 
      optionLabel.append(label)
      optionMenu.append((options ?? []).map(createOption))
      optionInner.append(optionText, optionIcon, optionMenu)
      optionWrapper.append(optionLabel, optionInner)

      return optionWrapper
   }
   
   /**
    * Retorna o valor original do input com a máscara
    */
   getUnmaskedPriceInputValue({ target }) {
      return target.value
         .replace(/^R\$/gi, '')
         .trim()
   }

   /**
    * Cria um filtro de data de começo ao fim 
    */
  

   /**
    * Traduz a chave do repositório para português 
    */
   getChipTitleTranslated(key) {
      const PORTUGUESE_TITLES = {
         brand: 'Marca',
         room: 'Ambiente',
         classification: 'Classificação',
         segment: 'Seguimentos',
         category: 'Categoria',
         orderType: 'Tipo',
         status: 'Status',
         profile: 'Perfil',
      }

      return PORTUGUESE_TITLES[key]
   }

  
}