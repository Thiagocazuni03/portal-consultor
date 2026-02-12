import { Div, Label, Input, Button, Icon } from "../../../utils/Prototypes.js"
import Modal from "../../../core/Modal.js"
import TabView from "../../../core/tab-view.js"
import RegisterVisit from "./visits/register-visit.js"
import { getCurrentYear } from "../../../helpers/helper.js"
import Translator from '../../../translation/Translator.js'
import Sheet from '../../../core/Sheet.js'

export default class VisitReportTab {

  constructor(data = {}) {
    this.data = data
    this.title = new Div('SP__points-program__title')
    this.title.text('Relatório de Visitas')
    this.container = new Div('SP__visit-report-tab')
    this.header = new Div('bonus-hd')
    this.formRow = new Div('SP__form').css({'alignItems':'end'})
    this.config = { values: {} }  

    this.formRow.append(
      this.buildInput('Buscar', 'search', { desktop: 3, mobile: 12 }, `João Silva`),
      this.buildInput('Ano', 'year', { desktop: 1, mobile: 12 }, `Ex: ${getCurrentYear()}`),
       this.createFieldWrapper({ desktop: 2, mobile: 12 }).append(
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
                  text: Translator.tC('months:jan')
                },
                {
                  value: 2,
                  text: Translator.tC('months:feb')
                },
                {
                  value: 3,
                  text: Translator.tC('months:mar')
                },
                {
                  value: 4,
                  text: Translator.tC('months:apr')
                },
                {
                  value: 5,
                  text: Translator.tC('months:may')
                },
                {
                  value: 6,
                  text: Translator.tC('months:jun')
                },
                {
                  value: 7,
                  text: Translator.tC('months:jul')
                },
                {
                  value: 8,
                  text: Translator.tC('months:aug')
                },
                {
                  value: 9,
                  text: Translator.tC('months:sep')
                },
                {
                  value: 10,
                  text: Translator.tC('months:oct')
                },
                {
                  value: 11,
                  text: Translator.tC('months:nov')
                },
                {
                  value: 12,
                  text: Translator.tC('months:dec')
                },
            ],})
        ),
      new Button().css({'marginBottom':'8px'}).html('Buscar')
    )

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
            date: '05/01/2026',
            type: 'Venda',
            'corporate-reason': 'Empresa Alpha LTDA',
            event: 'Compra de Produto',
            situation: 'Concluído'
          },
          {
            identifier: 2,
            date: '06/01/2026',
            type: 'Venda',
            'corporate-reason': 'Beta Comércio ME',
            event: 'Serviço Técnico',
            situation: 'Pendente'
          },
          {
            identifier: 3,
            date: '07/01/2026',
            type: 'Orçamento',
            'corporate-reason': 'Gamma Soluções',
            event: 'Orçamento Enviado',
            situation: 'Aguardando'
          },
             {
            identifier: 1,
            date: '05/01/2026',
            type: 'Venda',
            'corporate-reason': 'Empresa Alpha LTDA',
            event: 'Compra de Produto',
            situation: 'Concluído'
          },
          {
            identifier: 2,
            date: '06/01/2026',
            type: 'Venda',
            'corporate-reason': 'Beta Comércio ME',
            event: 'Serviço Técnico',
            situation: 'Pendente'
          },
          {
            identifier: 3,
            date: '07/01/2026',
            type: 'Orçamento',
            'corporate-reason': 'Gamma Soluções',
            event: 'Orçamento Enviado',
            situation: 'Aguardando'
          },
             {
            identifier: 1,
            date: '05/01/2026',
            type: 'Venda',
            'corporate-reason': 'Empresa Alpha LTDA',
            event: 'Compra de Produto',
            situation: 'Concluído'
          },
          {
            identifier: 2,
            date: '06/01/2026',
            type: 'Venda',
            'corporate-reason': 'Beta Comércio ME',
            event: 'Serviço Técnico',
            situation: 'Pendente'
          },
          {
            identifier: 3,
            date: '07/01/2026',
            type: 'Orçamento',
            'corporate-reason': 'Gamma Soluções',
            event: 'Orçamento Enviado',
            situation: 'Aguardando'
          },
             {
            identifier: 1,
            date: '05/01/2026',
            type: 'Venda',
            'corporate-reason': 'Empresa Alpha LTDA',
            event: 'Compra de Produto',
            situation: 'Concluído'
          },
          {
            identifier: 2,
            date: '06/01/2026',
            type: 'Venda',
            'corporate-reason': 'Beta Comércio ME',
            event: 'Serviço Técnico',
            situation: 'Pendente'
          },
          {
            identifier: 3,
            date: '07/01/2026',
            type: 'Orçamento',
            'corporate-reason': 'Gamma Soluções',
            event: 'Orçamento Enviado',
            situation: 'Aguardando'
          },   {
            identifier: 1,
            date: '05/01/2026',
            type: 'Venda',
            'corporate-reason': 'Empresa Alpha LTDA',
            event: 'Compra de Produto',
            situation: 'Concluído'
          },
          {
            identifier: 2,
            date: '06/01/2026',
            type: 'Venda',
            'corporate-reason': 'Beta Comércio ME',
            event: 'Serviço Técnico',
            situation: 'Pendente'
          },
          {
            identifier: 3,
            date: '07/01/2026',
            type: 'Orçamento',
            'corporate-reason': 'Gamma Soluções',
            event: 'Orçamento Enviado',
            situation: 'Aguardando'
          },   {
            identifier: 1,
            date: '05/01/2026',
            type: 'Venda',
            'corporate-reason': 'Empresa Alpha LTDA',
            event: 'Compra de Produto',
            situation: 'Concluído'
          },
          {
            identifier: 2,
            date: '06/01/2026',
            type: 'Venda',
            'corporate-reason': 'Beta Comércio ME',
            event: 'Serviço Técnico',
            situation: 'Pendente'
          },
          {
            identifier: 3,
            date: '07/01/2026',
            type: 'Orçamento',
            'corporate-reason': 'Gamma Soluções',
            event: 'Orçamento Enviado',
            situation: 'Aguardando'
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
          label: 'Data',
          size: '20%',
        },
        {
          keys: ['type'],
          label: 'Tipo',
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
          label: 'Evento',
          size: '20%',
          color: 'var(--fifth)',
        },
        {
          keys: ['situation'],
          label: 'Situação',
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
