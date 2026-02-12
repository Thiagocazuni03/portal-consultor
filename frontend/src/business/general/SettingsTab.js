import Session from '../../core/Session.js'
import Tab from '../../components/Tab.js'
import TermsTab from '../terms/TermsTab.js'
import UserTab from './UserTab.js'
import AdditionalsTab from '../additionals/AdditionalsTab.js'
import MemberTab from './MemberTab.js'
import { Button, Div, H3, H4, Icon, Input, Label } from '../../utils/Prototypes.js'
import { IDToken } from '../../utils/IDToken.js'
import { IS_DEVELOPER } from '../../api/Variables.js'
import DecryptTab from './DecryptTab.js'
import OldLogsTab from './OldLogsTab.js'
import MarkupTab from '../markup/MarkupTab.js'
import UserStorage from '../../core/UserStorage.js'
import FormulaTestTab from './FormulaTestTab.js'
import $ from 'jquery'
import Translator from '../../translation/Translator.js'

export default class SettingsTab extends Tab {
   constructor(config) {
      super({
         title: Translator.t('areas:settings'),
         desc: Translator.t('areas:description:settings'),
         css: 'hasContentSidePadding',
         hasLoader: true,
         hasFooter: false,
         ...config
      })

      //Elementos
      this.settingsGrid = new Div('SP__settings')

      //Montando
      this.appendToContent(this.settingsGrid)
      this.setupSettings()
   }

   /**
    * Cria o menu de configurações
    */
   async setupSettings() {
      const cardsTitle = new H3('SP__settings__title').text(Translator.t('common:other'))
      const optionsTitle = new H3('SP__settings__title').text(Translator.t('common:options'))

      //Cartões
      const cardsToCreate = await this.getCards()
      const cardNodes = cardsToCreate.map(this.createCard.bind(this))

      //Configurações
      const optionsToCreate = await this.getOptions()
      const optionsNode = optionsToCreate.map(this.createOption.bind(this))

      //Adicionando
      this.settingsGrid.append(optionsTitle)
      this.settingsGrid.append(optionsNode)
      this.settingsGrid.append(cardsTitle)
      this.settingsGrid.append(cardNodes)
   }

   /**
    * Cria uma opção com um input que altera uma configuração 
    */
   createOption({ title, input }) {
      const option = new Div('SP__settings__option')
      const optionTitle = new H4('SP__settings__option__title')
      const optionInput = this.createInput(input)

      optionInput.addClass('SP__settings__option__input')
      optionTitle.text(Translator.t(title))
      option.append(optionTitle, optionInput)

      return option
   }

   /**
    * Cria um card com um ícone e texto 
    */
   createCard({ icon, title, onClick }) {
      const card = new Div('SP__settings__card')
      const cardTitle = new H4('SP__settings__card__title')
      const cardIcon = new Icon('SP__settings__card__icon')

      cardIcon.addClass(icon)
      cardTitle.text(Translator.t(title))
      card.click(() => onClick && onClick())
      card.append(cardTitle, cardIcon)

      return card
   }

   /**
    * Cria um input  
    */
   createInput(inputData) {
      return {

         'toggle': () => this.createToggle(inputData),
         'language': () => this.createLanguageInput(inputData)

      }[inputData.type]()
   }

   /**
    * Cria um input de toggle 
    */
   createToggle({ setting, afterChange }) {
      const toggle = new Div('SP__settings__option__toggle')
      const toggleLabel = new Label('SP__settings__option__toggle__label')
      const toggleInput = new Input('SP__settings__option__toggle__input')
      const toggleID = new IDToken().getToken()

      toggleInput.attr('type', 'checkbox')
      toggleLabel.attr('for', toggleID)
      toggleInput.attr('id', toggleID)
      toggle.append(toggleInput, toggleLabel)

      toggleInput.on('change', ({ target }) => {
         $(target).is(':checked')
            ? Session.set(setting, true)
            : Session.set(setting, false)

         if (afterChange) {
            afterChange()
         }
      })

      Session.get(setting) == true
         ? toggleInput.prop('checked', true)
         : toggleInput.prop('checked', false)

      return toggle
   }

   /**
    * Cria um input de linguagem
    */
   createLanguageInput() {
      const languageContainer = new Div('SP__settings__option__language')
      const languageButtons = this.getLanguages().map(language => {
         const button = new Button('SP__settings__option__language__button')
            .attr('type', 'button')
            .append(language.flag)
            .on('click', () => {
               button.siblings().removeClass('isActive')
               button.addClass('isActive')
               Session.set('language', language.value)
               window.location.reload()
            })

            if(language.value === Session.getLanguage()){
               button.addClass('isActive')
            }

         return button
      })

      languageContainer.append(
         ...languageButtons
      )

      return languageContainer
   }

   /**
    * Retorna as linguagens do Portal
    */
   getLanguages() {
      return [
         {
            flag: 'English',
            value: 'en'
         },
         {
            flag: 'Português',
            value: 'pt'
         },
         {
            flag: 'Espanhol',
            value: 'es'
         },
      ]
   }

   /**
    * Retorna os cards  
    */
   async getCards() {
      const cards = [
         { icon: 'ic-user', title: 'areas:profile', onClick: () => new UserTab().open() },
         { icon: 'ic-store', title: 'areas:member', onClick: () => new MemberTab().open() },
         { icon: 'ic-document', title: 'areas:terms', onClick: () => new TermsTab().open() },
         { icon: 'ic-price-tag', title: 'areas:markup', onClick: () => new MarkupTab().open() },
         { icon: 'ic-services', title: 'areas:additionals', onClick: () => new AdditionalsTab().open() },
         { icon: 'ic-list', title: 'areas:logs', onClick: () => new OldLogsTab().open() },
         { icon: 'ic-cache', title: 'actions:clear-cache', onClick: () => Session.clearCache() },
      ]

      //Menu de fórmulas
      if (await UserStorage.isUserSimulator()) {
         cards.push({
            icon: 'ic-formula',
            title: 'areas:formulas',
            onClick: () => new FormulaTestTab().open()
         })
      }

      //Menu de descriptar
      if (IS_DEVELOPER) {
         cards.push({
            icon: 'ic-gear',
            title: 'Decrypt',
            onClick: () => new DecryptTab().open()
         })
      }

      return cards
   }

   /**
    * Retorna as opções para serem criadas 
    */
   async getOptions() {
      return [
         {
            title: 'settings:use-dark-theme',
            input: {
               type: 'toggle',
               setting: 'isThemeDark',
               afterChange: () => Session.updateTheme()
            }
         },
         {
            title: 'settings:auto-apply-fast-mode',
            input: {
               type: 'toggle',
               setting: 'useFastModeAuto',
            }
         },
         {
            title: 'settings:disable-auto-navigation',
            input: {
               type: 'toggle',
               setting: 'disableAutoNavigation',
            }
         },
         {
            title: 'settings:selected-language',
            input: {
               type: 'language',
               setting: 'language'
            }
         }
      ]
   }
}