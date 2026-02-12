
import Translator from '../../../translation/Translator.js'
import { Div, Icon, Label, P, Button, TextArea, Input } from "../../../utils/Prototypes.js"
export default class BonusTab {  
   constructor(){
    this.container = new Div('SP__visit-report-tab')  
    this.header = new Div('bonus-hd')   
    this.content = new Div()

    this.select = this.createSelectFilter({
        label: 'Tipo de Bônus',
        options: [  
            { 
                text: 'Projeto Arquitetônico', 
                value: 'architectural_project' 
            },
            { 
                text: 'Consultoria', 
                value: 'consulting' 
            },
            { 
                text: 'Evento', 
                value: 'event' 
            },
            { 
                text: 'Outro', 
                value: 'other' 
            }
        ],
        onChange: (option) => {}
    })

    this.details = this.buildDetails();
    this.description = this.buildDescription();
    this.locale = this.buildLocale();
    this.dateProject = this.buildDateProject();
    this.links = this.buildLinks();
    this.header.append(this.select)
    this.header.append(this.details, this.description, this.locale, this.dateProject, this.links)
    let button = new Button('SP__visit-report-tab__list-button')
    button.append('Solicitar Bônus')
    this.content.append(button)
    this.container.append(this.header, this.content) 
   } 

   buildDetails() {
    const desc = new Div('SP__textarea')
    const label = new Label()
    const input = new TextArea()
    label.text('Detalhes')
    desc.append(label, input)
    return desc
   }

   buildDescription() {
    const desc = new Div('SP__textarea')
    const label = new Label()
    const input = new TextArea()
    label.text('Descrição')
    desc.append(label, input)
    return desc
   }

   buildLocale() {
    const desc = new Div('SP__input')
    const input = new Input()
    const label = new Label()
    label.text('Local')
    desc.append(label, input)
    return desc
   }

   buildDateProject() {
    const desc = new Div('SP__input')
    const input = new Input()
    const label = new Label()
    label.text('Data do projeto')
    desc.append(label, input)
    return desc
   }

   buildLinks() {
    const desc = new Div('SP__input')
    const input = new Input()
    const label = new Label()
    desc.append(label, input)
    label.text('Links')
    return desc
    }

   getView(){
      return this.container
   }

    createSelectFilter({ label, options, onChange }) {          
    const optionWrapper = new Div('SP__searchbar__options__select')
    const optionLabel = new P('SP__searchbar__options__select__label')

    const optionRow = new Div('SP__searchbar__options__select_row') // 👈 NOVO
    const optionInner = new Div('SP__searchbar__options__select__inner')

    const optionText = new Div('SP__searchbar__options__select__inner__text')
    const optionIcon = new Icon('SP__searchbar__options__select__inner__icon ic-down')
    const optionMenu = new Div('SP__searchbar__options__select__inner__menu')
    const button = new Button('button-tab-sc')
        
    button.append('Listar')
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

        if (isOption || isContained) return
        optionInner.removeClass('isOpen')
    })

    setOption(options[0])

    optionInner.click(() => optionInner.toggleClass('isOpen'))
    optionInner.css(
        'min-width',
        Math.max(...options.map(option => option.text.length)) + 5 + 'ch'
    )

    optionLabel.append(label)
    optionMenu.append((options ?? []).map(createOption))
    optionInner.append(optionText, optionIcon, optionMenu)

    // 👇 inner + button dentro da row
    optionRow.append(optionInner, button)

    // 👇 label + row no wrapper
    optionWrapper.append(optionLabel, optionRow)

    return optionWrapper
    }


} 

