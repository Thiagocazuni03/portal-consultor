import TabView from "../../core/tab-view.js";

import { Div, Icon, P, Button} from "../../utils/Prototypes.js"
import DashboardSummary from "../DashboardSummary.js";
import ExtractTab from './tabs/extract-tab.js'
import BonusTab from './tabs/bonus-tab.js'
import PendingPointsTab from './tabs/pending-points-tabs.js'

export default class PointsProgram {  
   constructor(){
      this.container = new Div('fh')
      this.header = new Div('pt-hd')   
      this.content = new Div('fh')
      this.button = new Button().html('Buscar')
      this.tabs = new TabView({
            defaultTab: 'item-1',
            contentTarget: this.content
      })



      this.addTabs()
      this.select = this.createSelectFilter({
         label: 'Evento',
         options: [  
            { text: 'Amopontos 2026', value: 'all' },
            { text: 'Amopontos 2025', value: 'active' },
            { text: 'Amopontos 2024', value: 'inactive' },
         ],
         onChange: (option) => {}
      })

      this.content.append(this.tabs.getView())
      this.tabs.appendContent()
      this.header.append(new Div('col-3').append(this.select), this.button)     
      this.container.append(this.header, this.content) 
   }

   addTabs(){
      const extractTab = new ExtractTab();
      const bonusTab = new BonusTab();
      const pendingTab = new PendingPointsTab();

      this.tabs
      .addTab({
         id: 'item-1',
         label: 'Principal',
         icon: 'ic-home'
      })
      .addTab({
         id: 'item-2',
         label: 'Extrato',
      })
      .addTab({
         id: 'item-3',
         label: 'Bônus',
      })
      .addTab({
         id: 'item-4',
         label: 'Pontos pendentes',
      })
      .addTab({
         id: 'item-5',
         label: 'Validação',
      })


      this.tabs.setContent('item-1', new DashboardSummary({
         withAwards: true,
         items: [
            { value: '10', label: 'Pedidos', color: 'green' },   
            { value: '300', label: 'Pontos', color: 'orange' },
         ],
         css: 'points-program__summary'
      }).getView())

      this.tabs.setContent('item-2', extractTab.getView())
      this.tabs.setContent('item-3', bonusTab.getView())
      this.tabs.setContent('item-4', pendingTab.getView())
      
   }

   init(){ 
   }

   getView(){
      return this.container
   }

   createSelectFilter({ label, options, onChange }){          
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

  

} 

