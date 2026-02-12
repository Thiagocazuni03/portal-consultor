import { Div, Label, Input, Button, Icon } from "../../../utils/Prototypes.js"
import Modal from "../../../core/Modal.js"
import TabView from "../../../core/tab-view.js"
import RegisterVisit from "./visits/register-visit.js"
import { getCurrentYear } from "../../../helpers/helper.js"
import Translator from '../../../translation/Translator.js'
import Sheet from '../../../core/Sheet.js'

export default class ClientTab {

  constructor(data = {}) {
    this.data = data
    this.title = new Div('SP__points-program__title')
    this.title.text('Relatório de Visitas')
    this.container = new Div('SP__visit-report-tab')
    this.header = new Div('bonus-hd')
    this.formRow = new Div('SP__form')
    this.config = { values: {} }  
   const button = new Button()
   button.html(`listar`)
   //  this.formRow.append(
   //    this.buildInput('Nome', 'search', { desktop: 4, mobile: 12 }, `João Silva`),
   //    new Button().html('Buscar')
   //  )
     this.formRow.append( 
      this.createFieldWrapper({ desktop: 3, mobile: 12 }).append(
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
   ), button)

    this.header.append(this.title, this.formRow)
    this.container.append(this.header)
    this.sheet = new Sheet(this.getSheetConfig())
    this.container.append(this.sheet.getView())
    // this.buildLineDataModal()
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
          text: 'Gravar',
          color: 'var(--primary)',
          onClick: () => this.tryToDeleteService()
        }]
    })  
  }
  
  getSheetConfig() {
    return {
      css: 'isSalesSheet',
      align: 'center',
      maxHeight: '100%',
      scrollabe: true,
      clickableRows: true,

      render: {
        items: [
            {
               identifier: 1,
               date: '0001',
               type: 'João da Silva',
               'corporate-reason': 'João da Silva ME',
               event: 'São Paulo',
               situation: 'SP'
            },
            {
               identifier: 2,
               date: '0002',
               type: 'Maria Oliveira',
               'corporate-reason': 'Maria Oliveira LTDA',
               event: 'Rio de Janeiro',
               situation: 'RJ'
            },
            {
               identifier: 3,
               date: '0003',
               type: 'Carlos Pereira',
               'corporate-reason': 'Pereira & Filhos',
               event: 'Belo Horizonte',
               situation: 'MG'
            },
            {
               identifier: 4,
               date: '0004',
               type: 'Ana Costa',
               'corporate-reason': 'Ana Costa Serviços',
               event: 'Curitiba',
               situation: 'PR'
            },
            {
               identifier: 5,
               date: '0005',
               type: 'Lucas Martins',
               'corporate-reason': 'Martins Tecnologia',
               event: 'Porto Alegre',
               situation: 'RS'
            },
            {
               identifier: 6,
               date: '0006',
               type: 'Fernanda Lima',
               'corporate-reason': 'FL Consultoria',
               event: 'Salvador',
               situation: 'BA'
            },
            {
               identifier: 7,
               date: '0007',
               type: 'Ricardo Alves',
               'corporate-reason': 'Alves Transportes',
               event: 'Goiânia',
               situation: 'GO'
            },
            {
               identifier: 8,
               date: '0008',
               type: 'Patrícia Rocha',
               'corporate-reason': 'Rocha Comércio',
               event: 'Fortaleza',
               situation: 'CE'
            }
        ],
        // createFunc: (data, index, array) => this.createTableRow(data, index, array),
        onRender: () => {
          
          // const contentHeight = this.pageContent[0].clientHeight
          // const tableHeight = this.awardsSheet.getView()[0].clientHeight
          // const tableIsOverflowing = tableHeight >= contentHeight

          // this.awardsSheet
          //   .getView()
          //   .css('overflow', tableIsOverflowing ? 'overlay' : 'visible')
        },

        hasLoader: false,
        identifierKey: 'identifier',
        hasAnimation: true,
      },

      layout: [
        {
          keys: ['date'],
          label: 'Cód Cliente',
          size: '20%',
        },
        {
          keys: ['type'],
          label: 'Cliente',
          size: '20%',
          color: 'var(--fifth)',
        },
        {
          keys: ['corporate-reason'],
          label: 'Razão Social',
          size: '20%',
          color: 'var(--fifth)',
        },
        {
          keys: ['event'],
          label: 'Cidade',
          size: '20%',
          color: 'var(--fifth)',
        },
        {
          keys: ['situation'],
          label: 'UF',
          size: '20%',
          color: 'var(--fifth)',
        },
      ],
    }
  }


  buildLineContent(){
    const registerVisit = new RegisterVisit()
    const wrapper = new Div()
    const content = new Div()
    this.tabs = new TabView({
        defaultTab: 'item-2',
        contentTarget: content
    })

    wrapper.append(this.tabs.getView())
    wrapper.append(content)
    content.append(registerVisit.getView())
 
    return wrapper
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
  buildInput(labelText, name, size, placeholder) {
    const col = this.createFieldWrapper(size)

    const field = new Div('SP__input')
    const label = new Label()
    const input = new Input()

    label.text(labelText)
    input.attr('name', name)
    input.val(this.data[name] ?? '')
    placeholder && input.attr('placeholder', placeholder)

    field.append(label, input)
    col.append(field)

    return col
  }

  getView() {
    return this.container
  }
}
