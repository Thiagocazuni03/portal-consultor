import UserStorage from './UserStorage.js'
import LogoutModal from '../business/general/LogoutModal.js'
import SettingsTab from '../business/general/SettingsTab.js'
import { Div, Icon, P } from '../utils/Prototypes.js'
import { STORAGE_URL } from '../api/Variables.js'
import UserTab from '../business/general/UserTab.js'
import AdditionalsTab from '../business/additionals/AdditionalsTab.js'
import MarkupTab from '../business/markup/MarkupTab.js'
import Session from './Session.js'
import MemberTab from '../business/general/MemberTab.js'
import PopUp from './PopUp.js'
import FormulaTestTab from '../business/general/FormulaTestTab.js'
import Tooltip from './Tooltip.js'
import Translator from '../translation/Translator.js'

export default class AvatarMenu {
   constructor() {

      //Criando elementos
      this.avatar = new Div('SP__avatar')
      this.menu = new Div('SP__avatar__menu')
      this.menuTop = new Div('SP__avatar__menu__top')
      this.menuBottom = new Div('SP__avatar__menu__bottom')
      this.menuSidebar = new Div('SP__avatar__menu__sidebar')

      //Configuração do menu
      this.menuOptions = {
         top: {
            'areas:dashboard': {
               onClick: () => this.goToPage('dashboard'),
               icon: 'ic-dashboard'
            },
            'areas:sales': {
               onClick: () => this.goToPage('sales'),
               icon: 'ic-package'
            },
         },
         bottom: {
            'areas:catalog': {
               onClick: () => this.goToPage('catalog')
            },
            'areas:partners': {
               onClick: () => this.goToPage('partners')
            },
            'areas:pricing': {
               onClick: () => this.goToPage('price')
            },
            'areas:downloads': {
               onClick: () => this.goToPage('downloads')
            },
            'areas:markup': {
               onClick: () => new MarkupTab().open()
            },
            'areas:settings': {
               onClick: () => new SettingsTab().open()
            },
            'actions:logout': {
               onClick: () => new LogoutModal().openModal(),
               color: 'var(--red)'
            }
         },
         sidebar: {
            'areas:profile': {
               icon: 'ic-user',
               onClick: () => new UserTab().open()
            },
            'areas:member': {
               icon: 'ic-store',
               onClick: () => new MemberTab().open()
            },
            'areas:additionals': {
               icon: 'ic-services',
               onClick: () => new AdditionalsTab().open()
            },
            'areas:formulas': {
               icon: 'ic-formula',
               onClick: () => new FormulaTestTab().open()
            },
            'actions:clear-cache': {
               icon: 'ic-cache',
               onClick: () => Session.clearCache()
            }
         }
      }

      //Estado
      this.isMenuOpen = false
      this.isUserManager = false

      //Configurando
      this.menu.attr('active', false)
      this.avatar.click(() => this.toggleMenu())
      this.menu.click((event) => event.stopPropagation())

      //Montando
      this.menu.append(this.menuSidebar, this.menuTop, this.menuBottom)
      this.avatar.append(this.menu)

      //Inicializando
      this.initialize()
   }

   /**
    * Inicializa a aplicação
    */
   async initialize() {
      await Promise.all([this.handleMenuOptions(), this.tryToSetUserStorageImage()])

      this.setCloseOnBlurEvent()
      this.createAndAppendOptions()
   }

   /**
    * Adiciona um evento que detecta caso um clique foi dado fora do Avatar
    */
   setCloseOnBlurEvent() {
      window.addEventListener('click', ({ target }) => {

         const targetIsAvatarMenu = target === this.avatar[0]
         const targetIsInAvatarMenu = this.avatar[0].contains(target)

         if (targetIsAvatarMenu || targetIsInAvatarMenu || !this.isMenuOpen) return

         this.toggleMenu()
      })
   }

   /**
    * Cria e adiciona as opções no avatar
    */
   createAndAppendOptions() {
      const topOptions = Object.entries(this.menuOptions.top).map(([key, config]) => {
         return this.createTopOption({ key, ...config })

      })
      const bottomOptions = Object.entries(this.menuOptions.bottom).map(([key, config]) => {
         return this.createBottomOption({ key, ...config })
      })

      const sidebarOptions = Object.entries(this.menuOptions.sidebar).map(([key, config]) => {
         return this.createSidebarOption({ key, ...config })
      })

      this.menuTop.append(topOptions)
      this.menuBottom.append(bottomOptions)
      this.menuSidebar.append(sidebarOptions)
   }

   /**
    * Cria uma opção maior que aparecerá no topo do menu 
    */
   createTopOption({ icon, key, onClick }) {
      const optionWrapper = new Div('SP__avatar__menu__top__option')
      const optionIcon = new Icon('SP__avatar__menu__top__option__icon')
      const optionTitle = new P('SP__avatar__menu__top__option__title')

      optionIcon.addClass(icon)
      optionTitle.text(Translator.t(key))
      optionWrapper.click(onClick)
      optionWrapper.append([optionIcon, optionTitle])

      return optionWrapper
   }

   /**
    * Cria uma opção simples que aparecerá na parte de baixo do menu 
    */
   createBottomOption({ key, color, onClick }) {
      const bottomOption = new P('SP__avatar__menu__bottom__option')

      bottomOption.text(Translator.t(key))
      bottomOption.css('color', color)
      bottomOption.click(onClick)

      return bottomOption
   }

   /**
    * Cria uma opção que aparecerá na sidebar
    */
   createSidebarOption({ key, icon, onClick, color }) {
      const optionWrapper = new Div('SP__avatar__menu__sidebar__option')
      const optionIcon = new Icon(`SP__avatar__menu__sidebar__option__icon ${icon}`)

      optionIcon.css('color', color)
      optionIcon.addClass(icon)
      optionWrapper.click(onClick)
      optionWrapper.append(optionIcon)

      new Tooltip({
         on: optionWrapper,
         position: 'left',
         background: 'var(--fifth)',
         content: Tooltip.text(Translator.t(key))
      })

      return optionWrapper
   }

   /**
    * Remove as opções que um usuário normal não pode possuir
    */
   async handleMenuOptions() {
      const [isUserManager, isUserSimulator] = await Promise.all([
         UserStorage.isUserManager(),
         UserStorage.isUserSimulator()
      ])

      //Permissões
      const onlyManagerPermissions = ['areas:partners', 'areas:pricing', 'areas:additionals']
      const onlySimulatorOptions = ['formulas']

      if (!isUserSimulator) {
         onlySimulatorOptions.forEach(menuKey => {
            delete this.menuOptions.top[menuKey]
            delete this.menuOptions.bottom[menuKey]
            delete this.menuOptions.sidebar[menuKey]
         })
      }

      if (!isUserManager) {
         onlyManagerPermissions.forEach(menuKey => {
            delete this.menuOptions.top[menuKey]
            delete this.menuOptions.bottom[menuKey]
            delete this.menuOptions.sidebar[menuKey]
         })
      }
   }

   /**
    * Tenta pegar a imagem da storage e colocar no avatar
    */
   async tryToSetUserStorageImage() {
      const storedLink = await UserStorage.getSellerInfo('image')
      const willAppendBaseUrl = !storedLink.startsWith(STORAGE_URL)
      const finalLink = willAppendBaseUrl ? STORAGE_URL + storedLink : storedLink
      const imageToUse = storedLink.endsWith('null') ? './assets/images/no-user-image.svg' : finalLink

      this.avatar.css('background-image', `url(${imageToUse})`)
   }

   /**
    * Vai para uma página 
    */
   goToPage(name) {
      const curPageName = window.location.pathname.split('/')[1].split('.')[0]
      const isUserOnPage = name === curPageName

      if (isUserOnPage) {
         PopUp.triggerInfo('Você já está nesta página.', null, 'ALREADY_ON_PAGE_POPUP')
         return
      }

      window.location.href = `./${name}.html`
   }

   /**
    * Altera o estado de abertura do menu
    */
   toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen
      this.menu.attr('active', this.isMenuOpen)
   }

   /**
    * Retorna a visualização do componente
    */
   getView() {
      return this.avatar
   }
}