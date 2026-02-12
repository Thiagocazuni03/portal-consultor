import { Div, Label, Input, Icon, Button } from "../../../../utils/Prototypes.js"
import Modal from "../../../../core/Modal.js"
import TabView from "../../../../core/tab-view.js"
import $ from 'jquery'


export default class QuotationTab {

  constructor(data = {}) {
   const button = new Button('button-tab-sc')       
   this.config = { values: {} }  
   this.data = data
   this.container = new Div('SP__consult-client-tab')
   this.formRow = new Div('SP__form')
   this.selectWrapper = new Div('SP__consult-client-tab__select-wrapper')
   button.append('Buscar')

   this.selectWrapper.append(
   this.createFieldWrapper({ desktop: 4, mobile: 12 }).append(
       this.createSelectInput({ 
         key: 'gender',
         type: 'select',
         label: 'Exibir por:',
         placeholder: 'teste',
         value: 1,
         isReadonly: false,
         options: [
            {
               value: 1,
               text: 'Todos'
            },
            {
               value: 2,
               text: 'Nome/Razão Social'
            }
         ],})
   ),

   this.createFieldWrapper({ desktop: 4, mobile: 12 }).append(
      this.createSelectInput({ 
         key: 'gender',
         type: 'select',
         label: 'Exibir por:',
         placeholder: 'teste',
         value: 1,
         isReadonly: false,
         options: [
            {
               value: 1,
               text: 'Todos'
            },
            {
               value: 2,
               text: 'Nome/Razão Social'
            }
         ],})
   ),

   this.createFieldWrapper({ desktop: 4, mobile: 12 }).append(
      this.buildInput('Última Visita:', 'name', { desktop: 6, mobile: 12 })
   ),

   button
)

   this.formRow.append(
      this.selectWrapper
   )

    this.container.append(this.formRow)
    this.buildLineDataModal()
  }

   buildLineDataModal(){
      this.modal = new Modal({
         hasIcon:false,
         hasTitle:false,
         hasMessage:false,
         autoOpen: true,
         color: 'var(--red)',
         autoOpen:true,
         css:'lg pd',
         appendToContent: this.buildLineContent(),
         buttons: [{
            type: 'blank',
            text: 'Cancelar'
         }, {
            type: 'filled',
            text: 'Excluir',
            color: 'var(--primary)',
            onClick: () => this.tryToDeleteService()
         }]
      })  
   }

   buildLineContent(){
    //   const registerClient = new RegisterClient()
    //   const clientAccountTab = new clientAccountTab()
      const wrapper = new Div()
      const content = new Div()
      this.tabs = new TabView({
         defaultTab: 'item-2',
         contentTarget: content
      })
      wrapper.append(this.tabs.getView())
      wrapper.append(content)
      this.tabs.content.addClass('pd-1')
      this.tabs.appendContent()

      this.tabs
      .addTab({
         id: 'item-1',
         label: 'Cadastro',
         icon: 'ic-home'
      })
      .addTab({
         id: 'item-2',
         label: 'Conta Cliente',
      })
      .addTab({
         id: 'item-3',
         label: 'Espelho',
      })
      .addTab({
         id: 'item-4',
         label: 'Cotações',
      })
      .addTab({
         id: 'item-5',
         label: 'Vendas',
      })


      return wrapper
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

      // if(this.config.showRequired) selectLabel.attr('isOptional', isOptional ? Translator.t('common:optional') : Translator.t('common:required'))
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


   getInputValue() {
   }

   setInputValue(){

   }
  /* =====================================================
     GRID WRAPPER
  ===================================================== */
  createFieldWrapper({ desktop = 12, mobile = 12 }) {
    const col = new Div('SP__col')
    col.addClass(`col-${desktop}`)
    col.addClass(`col-m-${mobile}`)
    return col
  }

  /* =====================================================
     INPUT GENÉRICO
  ===================================================== */
  buildInput(labelText, name, size) {
    const col = this.createFieldWrapper(size)

    const field = new Div('SP__input')
    const label = new Label()
    const input = new Input()

    label.text(labelText)
    input.attr('name', name)
    input.val(this.data[name] ?? '')

    field.append(label, input)
    col.append(field)

    return col
  }

  getView() {
    return this.container
  }
}
