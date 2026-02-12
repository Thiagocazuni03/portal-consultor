import Translator from '../translation/Translator.js'
import { Div, Icon, Input, P } from '../utils/Prototypes.js'
import Tooltip from './Tooltip.js'
import $ from 'jquery'
import PeriodPicker from '../components/datepicker.js'
import 'jquery-mask-plugin/dist/jquery.mask.min'
 
export default class SearchBar{
   constructor(config){

      this.config = $.extend({

         style: {},
         label: Translator.tC('common:search'),
         placeholder: Translator.tC('messages:search-something-here') + '...',
         css: '',
         width: '100%',
         icon: 'ic-search',
         onInput: () => {},
         onEnter: () => {},
         onClear: () => {},
         options: []

      }, config)

      //Elementos
      this.wrapper = new Div('SP__searchbar')
      this.searchBlock = new Div('SP__searchbar__search')
      this.label = new Div('SP__searchbar__search__label')
      this.search = new Div('SP__searchbar__search__search')
      this.icon = new Icon('SP__searchbar__search__search__icon')
      this.input = new Input('SP__searchbar__search__search__input')
      this.clearBtn = new Icon('SP__searchbar__search__search__clear')
      this.options = new Div('SP__searchbar__options')

      //Configurando
      this.clearBtn.addClass('ic-close')
      this.wrapper.addClass(this.config.css)
      this.icon.addClass(this.config.icon)
      this.input.attr('placeholder', this.config.placeholder)
      this.label.text(this.config.label)
      this.wrapper.css('width',this.config.width)
      this.wrapper.css(this.config.style)

      new Tooltip({
         on: this.clearBtn,
         parentPos: 'relative',
         position: 'bottom',
         content: Tooltip.text('Limpar busca'),
      })

      //Eventos
      this.clearBtn.on('click', () => this.clear())
      this.input.on('input', (event) => this.config.onInput(event))
      this.input.on('keypress', (event) => event.key === 'Enter' ? this.config.onEnter(event) : true)

      this.options.append(this.config.options.map(option => this.createOption(option)))
      
      this.search.append(this.icon, this.input, this.clearBtn)
      this.searchBlock.append((this.config.label ? this.label : null), this.search)

      if(this.config.searchBar && this.config.searchBar.active){
         this.wrapper.append(this.searchBlock, this.options)
      } else {
         this.wrapper.append(this.options)
      }
   }

   /**
    * Cria uma opção que pode ser utilizada na searchbar 
    */
   createOption(optionData){
      const optionTypes = {
         'change': () => this.createChangeOption(optionData),
         'select': () => this.createSelectOption(optionData),
         'text': () => this.createTextOption(optionData),
         'datepicker': () => this.createDatePickeOption(optionData)
         // 'datepicker':()=> { }
      }  

      return optionTypes[optionData.type]()
   }

    createDatePickeOption({
      onChange,
      readonly,
      value
   }) {

      //Elementos
      const inputWrapper = new Div('ckl-ipts-row-ipt')
      let isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
      //Cria o datepicker apenas se não for readonly
      if (!readonly) {

         const datePickerInput = new PeriodPicker({
            placeholder: 'Escolha o período...',
            onChange: onChange 
         }) 

         inputWrapper.append(datePickerInput.getView())
   
         if(isObject && value && value.hasOwnProperty('startDate') && value.hasOwnProperty('endDate')){
            datePickerInput.startDate = value.startDate
            datePickerInput.endDate = value.endDate
            
            datePickerInput.setRange(value.startDate, value.endDate)
         }
      }

      return inputWrapper
   }

   /**
    * Cria um menu de select 
    */
   createSelectOption({ label, options, onChange }){
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
    * Retorna uma opção de texto 
    */
   createTextOption({ label, type, mask, placeholder = Translator.tC('actions:type') + '...', align = 'left', maskOptions = {}, onInput }){
      const optionWrapper = new Div('SP__searchbar__options__text')
      const optionLabel = new P('SP__searchbar__options__text__label')
      const optionText = new Input('SP__searchbar__options__text__input')

      optionLabel.text(label)
      optionText.attr('type', type)
      optionWrapper.append(optionLabel, optionText)
      optionText.on('input', (event) => onInput(event))
      optionText.css('text-align', align)
      optionText.attr('placeholder', placeholder)

      if(mask){
         optionText.mask(mask, maskOptions)
      }

      return optionWrapper
   }

   /**
    * Cria uma opção de troca 
    */
   createChangeOption({ states, label, onChange }){
      const optionWrapper = new Div('SP__searchbar__options__change')
      const optionLabel = new P('SP__searchbar__options__change__label')
      const optionChange = new Div('SP__searchbar__options__change__option')
      const optionText = new Div('SP__searchbar__options__change__option__text')
      const optionIcon = new Div('SP__searchbar__options__change__option__icon')

      let currentState = 0

      const getNextState = () => {
         return states[(++currentState) % states.length]
      }

      const setState = (state) => {
         optionText.text(state.text)
         optionIcon.removeClass(states.map(state => state.icon).join(' '))
         optionIcon.addClass(state.icon)

         optionChange.css('color', state.color ?? '')
         optionChange.css('background-color', state.background ?? '')

         if(onChange) onChange(state)
      }

      setState(states[0])

      optionLabel.text(label)
      optionChange.css('min-width', Math.max(...states.map(state => state.text.length)) + 5 + 'ch') 
      optionChange.click(() => setState(getNextState()))
      optionChange.append(optionText, optionIcon)
      optionWrapper.append(optionLabel, optionChange)

      return optionWrapper
   }

   /**
    * Limpa o input
    */
   clear(){
      this.input.val('')
      this.config.onClear()
   }

   /**
    * Retorna o que foi pesquisado
    * @returns {string} O texto
    */
   getSearch(){
      return this.input.val()
   }

   /**
    * Retorna a seachbar 
    */
   getView(){
      return this.wrapper
   }
}