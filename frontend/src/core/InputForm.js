import { Form, H3, Input, Label, Div, P, Icon, Select, Option, TextArea } from '../utils/Prototypes.js'
import { IDToken } from '../utils/IDToken.js'
import { CURRENCY } from '../api/Variables.js'
import $ from 'jquery'
import Translator from '../translation/Translator.js'

export default class InputForm {
   constructor(config) {

      this.config = $.extend(true, {

         title: 'Formulário',
         height: 'min-content',
         inputs: [],
         showRequired: true,
         values: {},
         css: '',

      }, config ?? {})

      this.title = new H3('SP__form__title')
      this.form = new Form('SP__form')

      this.form.css('height', this.config.height)
      this.form.addClass(this.config.css)
      this.form.on('submit', (event) => event.preventDefault())

      this.createAndAppendFields()
   }

   createAndAppendFields() {
      const inputsFiltred = this.config.inputs.filter(inputData => inputData.willCreate ? inputData.willCreate() : true)
      const inputNodes = inputsFiltred.map(inputData => this.createInput(inputData))
 
      this.form.append(inputNodes)
   }

   createInput(inputData){
      return {

         'number': () => this.createDefaultInput(inputData),
         'password': () => this.createDefaultInput(inputData),
         'date': () => this.createDefaultInput(inputData),
         'email': () => this.createDefaultInput(inputData),
         'text': () => this.createDefaultInput(inputData),
         'tel': () => this.createDefaultInput(inputData),
         'select': () => this.createSelectInput(inputData),

      }[inputData.type ?? 'text']()
   }

   createErrorMessage({ errorCode, errorMessage }) {
      const errWrapper = new Div('SP__error')
      const errIcon = new Icon('SP__error__icon')
      const errMsg = new P('SP__error__message')
      const errCode = new Div('SP__error__code')

      errIcon.addClass('ic-info-circle')
      errMsg.text(errorMessage)
      errCode.text(errorCode)
      errWrapper.append(
         errIcon,
         errMsg,
         errCode
      )

      return errWrapper
   }

   triggerError(errorData) {
      this.triggerInvalidInputs(errorData)
      this.currentErrorMessage?.remove()
      this.currentErrorMessage = this.createErrorMessage(errorData)
      this.form.append(this.currentErrorMessage)
   }

   triggerInvalidInputs({ invalid }){
      if (!invalid) return

      const allInputs = Array.from(this.form.children('[data-key]'))
      const invalidInputs = allInputs.filter(input => invalid.includes($(input).attr('data-key')))
      
      $(allInputs).trigger('correctValue')
      $(invalidInputs).trigger('invalidValue')
   }

   createSelectInput({ key, options, value, label, isOptional, isReadonly, staticValue }) {

      //Criando dados e elementos
      const selectWrapper = new Div('SP__select')
      const selectLabel = new Label('SP__select__label')
      const selectChoosen = new Div('SP__select__choosen')
      const selectArrow = new Icon('SP__select__arrow')
      const selectOptions = new Div('SP__select__options')

      //Configurando os dados
      selectArrow.addClass('ic-down')
      selectWrapper.attr('data-key', key)
      selectLabel.text(label)
      selectWrapper.append(selectLabel, selectChoosen, selectOptions, selectArrow)
      selectLabel.click(() => selectChoosen.trigger('click'))
      selectChoosen.click(() => !isReadonly && selectWrapper.toggleClass('isOpen'))

      //Quando não clicar nem na label nem no select, fechar
      document.addEventListener('click', ({ target }) => {
         if(![selectChoosen[0], selectLabel[0]].includes(target)){
            selectWrapper.removeClass('isOpen')
         }
      })

      //Eventos de inválid oe válido
      selectWrapper.on('invalidValue', ({ target }) => $(target).addClass('isInvalid'))
      selectWrapper.on('correctValue', ({ target }) => $(target).removeClass('isInvalid'))

      //Eventos
      options.forEach(({ value, text }) => {
         const optionInner = new Div('SP__select__options__option')
         optionInner.text(text)
         optionInner.click(() => {
            this.config.values[key] = value
            selectChoosen.text(text)
            selectWrapper.removeClass('isOpen')
         })
         selectOptions.append(optionInner)
      })

      if(this.config.showRequired) selectLabel.attr('isOptional', isOptional ? Translator.t('common:optional') : Translator.t('common:required'))
      if(isReadonly) selectWrapper.attr('readonly', true)

      //Caso não houver valor
      if(!value){
         if(options[0]){
            selectChoosen.text(options[0].text)
            this.config.values[key] = options[0].value
         } else {
            selectChoosen.text('Sem opções')
            this.config.values[key] = null
         }
      } else {
         const isStatic = !!staticValue
         if(!isStatic){
            
            const option = options.find(opt => opt.value == value)
            selectChoosen.text(option.text)
            this.config.values[key] = option.value

         } else {

            selectChoosen.text(value.text)
            this.config.values[key] = value.value
         }
      }

      return selectWrapper
   }

   createDefaultInput({ 
      key, 
      type, 
      value, 
      placeholder, 
      label, 
      css,
      pattern, 
      title,
      mask,
      align,
      invalid,
      textarea,
      isOptional,
      isReadonly,
      onEnter,
      autoComplete = true,
   }) {

      //Criando dados e elementos
      const INPUT_ID = crypto.randomUUID()
      const inputWrapper = new Div('SP__input')
      const inputLabel = new Label('SP__input__label')
      const inputText = new (textarea ? TextArea : Input)('SP__input__text')
      let pastValue = null

      //Configurando os dados
      inputWrapper.attr('data-key', key)
      inputText.attr('type', type)
      inputText.val(value)
      inputText.attr('name', key)
      inputText.attr('placeholder', placeholder)
      inputText.attr('id', INPUT_ID)
      inputLabel.text(label)
      inputText.attr('autocomplete', autoComplete ? 'on' : 'off')
      inputLabel.attr('for', INPUT_ID)
      inputText.attr('title', title)
      inputWrapper.append(inputLabel, inputText)
      inputWrapper.attr('data-invalid', invalid)
      inputText.css('text-align', align ?? 'left')

      //Eventos
      inputWrapper.on('click focusin', ({ target }) => pastValue = target.value)
      inputText.on('keyup', ({ which }) => (which === 13 && onEnter) && onEnter())
      inputText.on('input', ({ target }) => {
         mask && this.applyMask(target, mask, pastValue)
         pastValue = target.value
         this.config.values[key] = target.value
      })

      //Quando tem uma informação inválida
      inputWrapper.on('invalidValue', ({ target }) => $(target).addClass('isInvalid'))
      inputWrapper.on('correctValue', ({ target }) => $(target).removeClass('isInvalid'))

      //Configurações
      if(!isOptional) inputText.attr('required', true)
      if(pattern) inputText.attr('pattern', pattern)
      if(css) inputText.css(css)
      if(isReadonly) inputText.attr('readonly', true)
      if(mask) this.applyMask(inputText[0], mask)

      //Configurações dinâmicas
      const showRequiredLabel = this.config.showRequired
      const isPasswordInput = type === 'password'


      if (showRequiredLabel) {
         inputLabel.attr('isOptional', isOptional ? Translator.t('common:optional') : Translator.t('common:required'))
      }

      
      if(isPasswordInput){
         let isToggled = false
         const toggleIcon = new P('SP__input__toggle')
         toggleIcon.text('Mostrar')
         toggleIcon.click(() => {
            isToggled = !isToggled
            toggleIcon.text(isToggled ? 'Esconder' : 'Mostrar')
            inputText.attr('type', isToggled ? 'text' : type)
         })
         inputWrapper.append(toggleIcon)
      }

      //Pré adicionando o valor (Caso tiver um valor inical)
      this.config.values[key] = value

      return inputWrapper
   }
   
   applyMask(input, type, pastValue){
      const MASK_TYPES = {
         'price': () => this.applyPriceMask(input, pastValue),
         'phone': () => this.applyPhoneMask(input, pastValue),
         'percent': () => this.applyPercentMask(input, pastValue),
         'cpf': () => this.applyCPFMask(input, pastValue),
         'whole_number': () => this.applyWholeNumberMask(input, pastValue),
      }

      MASK_TYPES[type]()
   }

   formatToOneCommaOnly(string){
      const dotCommasIndexes = string.split('').map((char, index) => ['.',','].includes(char) ? index : false).filter(Boolean).slice(1)
      const textWithOneCommaMax = string.split('').filter((char, index) => !dotCommasIndexes.includes(index)).join('')

      return textWithOneCommaMax
   }

   applyWholeNumberMask(target){

      const pastCaretPos = target.selectionStart
      const targetText = String(target.value).trim()
      const noCharactersText = targetText.replace(/\D/gi, '')
      const typedIllegalChar = /\D/gi.test(targetText)

      target.value = noCharactersText

   }  

   applyPriceMask(target) {

      const CURRENCY_TEXT = `${CURRENCY} `
      const pastCaretPos = target.selectionStart
      const newInputText = target.value
      const textWithoutRS = newInputText.replace(/^R?\$? ?/gi, '')
      const textHasLetters = /[^\d.\,]/gi.test(textWithoutRS)
      const textWithoutLetters = textWithoutRS.replace(/[^\d.,]/gi, '').split(',')[0]
      const startCaretPos = textHasLetters ? pastCaretPos - 1 : Math.max(CURRENCY_TEXT.length, pastCaretPos)
      const textWithOneCommaMax = this.formatToOneCommaOnly(textWithoutLetters)

      target.value = CURRENCY_TEXT + textWithOneCommaMax
      target.setSelectionRange(startCaretPos, startCaretPos)
   }

   applyPercentMask(target, pastValue = ''){

      const pastCaretPos = target.selectionStart
      const addedTwoDots = target.value.split('.').length >= 3
      const splitValueError = target.value.replace(/%$/gi, '').split('.').some(part => part.length >= 4)
      const deletedDot = pastValue.indexOf('.') >= 0 && target.value.indexOf('.') < 0

      //Verficações básicas
      if(addedTwoDots || splitValueError){
         target.value = pastValue

         deletedDot
            ? target.setSelectionRange(pastCaretPos + 1, pastCaretPos + 1)
            : target.setSelectionRange(pastCaretPos - 1, pastCaretPos - 1)
         
         return
      }

      //Formatando os valores
      const valueWithoutPercent = target.value.replace(/%$/gi, '')
      const valueWithoutLetters = valueWithoutPercent.replace(/[^\d.]/gi, '')
      const valueWithOneComma = this.formatToOneCommaOnly(valueWithoutLetters)

      //Pegando os valores
      const integerValue = (valueWithOneComma.split('.')[0] ?? '')
      const decimalValue = (valueWithOneComma.split('.')[1] ?? '')

      //Verificando se digitou mais do que podia
      const typed4DigitInteger = integerValue.length >= 4
      const typed3DigitDecimal = decimalValue.length >= 3
      const typedSomeLetter = /[A-Z]/gi.test(valueWithoutPercent)
      const typed2Dots = valueWithoutLetters.length !== valueWithOneComma.length
      const shouldCaretRecced = (typed2Dots || typedSomeLetter || typed3DigitDecimal || typed4DigitInteger)

      //Criando novos valores
      const newInputText = typed4DigitInteger || typed3DigitDecimal
         ? valueWithOneComma.split('').filter((_, index) => index !== pastCaretPos - 1).join('')
         : valueWithOneComma

      const newCaretPos = shouldCaretRecced
         ? pastCaretPos - 1
         : pastCaretPos

      target.value = newInputText + '%'
      target.setSelectionRange(newCaretPos, newCaretPos)
   }

   applyPhoneMask(target, pastValue = ''){

      const pastCaretPos = target.selectionStart
      const deletedEverything = target.value === ''
      const deleteHyphen = pastValue.includes('-') && !target.value.includes('-')
      const deletedSpace = pastValue.includes(' ') && !target.value.includes(' ')
      const deletedOpenParen = pastValue.includes('(') && !target.value.includes('(')
      const deletedCloseParen = pastValue.includes(')') && !target.value.includes(')')

      //Caso deletar tudo
      if(deletedEverything){
         return
      }

      //Verficações básicas
      if(deleteHyphen || deletedSpace || deletedOpenParen || deletedCloseParen){
         target.value = pastValue
         target.setSelectionRange(pastCaretPos, pastCaretPos)
         return
      }
   
      const afterTypeValue = target.value
      const valueWithAllowedChars = afterTypeValue.replace(/\D/gi, '')
      const valueMaxLength = valueWithAllowedChars.slice(0, 11)
      const valueWithSpecialChars = this.applyPhoneSpecialCharsInString(valueMaxLength)

      target.value = valueWithSpecialChars
   }

   applyCPFMask(target, pastValue){

      const pastSelection = target.selectionStart
      const targetValue = target.value
      const targetWithOnlyNum = targetValue.replace(/\D/gi, '')
      const targetWithMaxLength = targetWithOnlyNum.slice(0, 11)
      const valueWithDots = this.applyCPFSpecialCharsInString(targetWithMaxLength)

      const pastSpecialCharsCount = target.value.split('').reduce((total, char) => ['.','-'].includes(char) ? total += 1 : total, 0)
      const curSpecialCharsCount = valueWithDots.split('').reduce((total, char) => ['.','-'].includes(char) ? total += 1 : total, 0)
      const shouldSelectionProceed = pastSpecialCharsCount < curSpecialCharsCount

      target.value = valueWithDots

      shouldSelectionProceed
         ? target.setSelectionRange(pastSelection + 1, pastSelection + 1)
         : target.setSelectionRange(pastSelection, pastSelection)
   }

   applyCPFSpecialCharsInString(cpfNumbers){
      return String(cpfNumbers).split('').map((char, index) => {
         if([3,6].includes(index)) return '.' + char
         if([9].includes(index)) return '-' + char
         return char
      }).join('')
   }

   applyPhoneSpecialCharsInString(phoneNumber){
      return String(phoneNumber).split('').map((char, index) => {
         if(index === 0) return '(' + char
         if(index === 2) return ') ' + char 
         if(index === 7) return '-' + char
         return char
      }).join('')
   }

   getView() {
      return this.form
   }

   getValues() {
      return this.config.values
   }
}