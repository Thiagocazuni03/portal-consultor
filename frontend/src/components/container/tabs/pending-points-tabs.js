
import Translator from '../../../translation/Translator.js'
import { Div, Icon, P, Button, TBody, TFoot, THead, Table, Td, Tr } from "../../../utils/Prototypes.js"
export default class PendingPointsTab {  
   constructor(){
      this.container = new Div('SP__points-program__extract-tab')  
      this.header = new Div()   
      this.content = new Div()

      this.select = this.createSelectFilter({
        label: 'Período',
        options: [  
            { 
                text: `${Translator.tC('common:last')} 30 ${Translator.tC('common:day_other')}`, 
                value: '30_days' 
            },
            { 
                text: `${Translator.tC('common:last')} 60 ${Translator.tC('common:day_other')}`, 
                value: '60_days' 
            },
            { 
                text: `${Translator.tC('common:last')} 90 ${Translator.tC('common:day_other')}`, 
                value: '90_days' 
            },
            { 
                text: `${Translator.tC('common:last')} 120 ${Translator.tC('common:day_other')}`, 
                value: '120_days' 
            }
        ],
        onChange: (option) => {}
        })

      this.header.append(this.select)
      this.container.append(this.header, this.content) 
      this.buildContent()
   }

   buildContent(){
        const pendingPoints = new Div('SP__points-program__extract-tab__title').html(Translator.tC('areas:pending-points'))
        const message = new P('SP__points-program__extract-tab__message').html(Translator.tC('messages:system-points-message'))

        this.content.append(pendingPoints, message) 
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

