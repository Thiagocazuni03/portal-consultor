import AvatarMenu from '../core/AvatarMenu.js'
import UserStorage from '../core/UserStorage.js'
import LogoutModal from '../business/general/LogoutModal.js'
import Initializer from '../core/Initializer.js'
import { Pre } from '../utils/Prototypes.js'
import { IS_DEVELOPER } from '../api/Variables.js'
import $ from 'jquery'
import Translator from '../translation/Translator.js'

class DashboardController {
   constructor() {

      $('body').children('.isPageHidden').removeClass('isPageHidden')

      //Elementos
      this.quitPortalBtn = $('#QUIT')
      this.headerOptions = $('#OPTIONS')
      this.dashboardGrid = $('#DASHBOARD')
      this.goToSalesBtn = $('#SALES_BTN')

      //Janela com os dados do usuário
      this.storageViewer = new Pre('SP__dashboard__pre')

      if (IS_DEVELOPER) {
         this.storageViewer.css('font-size', '16px')
      }

      //Traduzinho
      this.quitPortalBtn.text(Translator.t('actions:logout'))
      this.goToSalesBtn.text(Translator.t('areas:sales'))

      //Configurando
      this.headerOptions.append(new AvatarMenu().getView())
      this.quitPortalBtn.click(() => new LogoutModal().openModal())
      this.goToSalesBtn.click(() => location.href = '/sales.html')

      this.getAndAppendStorageJSON()
      this.dashboardGrid.append(this.storageViewer)
   }

   async getAndAppendStorageJSON() {
      const tryToAppendStorage = async () => {
         try {

            const allUserInfo = await UserStorage.getAllInfo()
            const stringedInfo = JSON.stringify(allUserInfo, null, 4)
            this.storageViewer.text(stringedInfo)

         } catch (error) {

            this.storageViewer.text('ERRO AO BUSCAR A STORAGE' + '\n\n\n' + error)

         }
      }
      setInterval(() => tryToAppendStorage(), 500)
   }
}

Initializer.initialize(() => new DashboardController())