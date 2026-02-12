import APIManager from '../../api/APIManager.js'
import Tab from '../../components/Tab.js'
import ChangePassMoldal from '../general/ChangePassModal.js'
import LoadingModal from '../general/LoadingModal.js'
import InputForm from '../../core/InputForm.js'
import UserStorage from '../../core/UserStorage.js'
import Modal from '../../core/Modal.js'
import PopUp from '../../core/PopUp.js'
import { Button, Div, Icon, Input, Label } from '../../utils/Prototypes.js'
import { CODE, APPLICATION, STORAGE_URL, LOGIN_URL } from '../../api/Variables.js'
import $ from 'jquery'

export default class LoginTab extends Tab {
   constructor() {
      super({
         target: $('body'),
         title: 'Entre na sua conta',
         desc: 'Realize o login para realizar ou conferir os seus pedidos',
         leftButtonText: 'Esqueci minha senha',
         rightButtonText: 'Criar Conta'
      })

      //Configurando elementos
      this.rightButton.removeClass('isFilled').addClass('isOutlined')

      //Formulário de login
      this.loadingModal = new LoadingModal({ uniqueToken: 'LOGIN_LOADING', message: 'Estamos realizando seu login.', hasContent:false })
      //  this.loadingModal.openModal()
      this.loginForm = new InputForm({ inputs: this.getFields(), showRequired: false })
      this.loginButton = new Button('SP__content__button-filled')
      this.rememberMeButton = this.createRememberMeButton()
      this.rememberUser = false
      this.loginForm.form.css({flexDirection:'column'})

      //Configurando Botão
      this.tab.attr('id', 'LOGIN_FORM')
      this.loginButton.text('Entrar na minha conta')
      this.loginButton.append(new Icon('SP__content__button__icon ic-enter'))

      //Eventos
      this.loginButton.click(() => this.tryToLogin())
      this.rightButton.click(() => this.goToSignUpPage())
      this.leftButton.click(() => new ChangePassMoldal().openModal())

      //Montando
      this.loginForm.getView().append(this.rememberMeButton, this.loginButton)
      this.appendToContent(this.loginForm.getView())
   }

   goToSignUpPage() {
      PopUp.triggerInfo('Em desenvolvimento.', this.tab, 'SIGN_UP_DEVELOPING')
   }

   createRememberMeButton() {
      const rememberLabel = new Label('SP__checkbox')
      const rememberInput = new Input('SP__checkbox__input')
      const rememberBlock = new Div('SP__checkbox__block')
      const rememberIcon = new Icon('SP__checkbox__block__icon')

      rememberLabel.text('Mantenha-me conectado')
      rememberInput.attr('type', 'checkbox')
      rememberIcon.addClass('ic-check')
      rememberBlock.append(rememberIcon)
      rememberLabel.append(rememberInput, rememberBlock)
      rememberInput.on('change', () => {

         this.rememberUser = !this.rememberUser
         rememberLabel.attr('active', this.rememberUser)

      })

      return rememberLabel
   }

   async tryToLogin() {
      UserStorage.isSessionOkay()
         ? this.goToDashboard()
         : this.loginWithFormValues()
   }

   async loginWithFormValues() {
      this.loadingModal.openModal()
 
      try {

         const loginParams = this.getLoginParams(this.loginForm.getValues())
         console.log(loginParams);
         console.log(LOGIN_URL);

         const loginResponse = await APIManager.doAPIRequest(LOGIN_URL, loginParams, true)
         const wasSucccess = loginResponse.errorCode === 0
       
         
         wasSucccess
            ? this.processLoginInfo(loginResponse)
            : this.loginForm.triggerError(loginResponse)

      } catch (error) {

         console.error(error)
         this.triggerErrorModal()

      } finally {

         this.loadingModal.closeModal()

      }
   }

   triggerErrorModal() {
      new Modal({

         onEscape: (modal) => modal.closeModal(),
         onBackspace: (modal) => modal.closeModal(),
         onEnter: (modal) => modal.closeModal(),
         uniqueToken: 'LOGIN_ERROR_MODAL',
         icon: 'ic-close',
         color: 'var(--red)',
         title: 'Erro',
         message: 'Parece que há um problema com nossos serviços.',
         autoOpen: true,
         buttons: [{ text: 'Fechar', type: 'filled', closeOnClick: true, color: 'var(--red)' }]

      })
   }

   getLoginParams({ email, password }) {
      return {
         application: APPLICATION,
         type: 'authenticate',
         data: { code: CODE, email, password }
      }
   }

   async processLoginInfo(parsedResponse) {
      const keyInfo = this.polishAPIResponse(parsedResponse)
      const sellerData = await this.fetchSellerInfo(keyInfo.id)
      const memberData = await this.fetchMemberInfo(sellerData.sellerInfo.member)
      
      
      if (!sellerData) return
      if (!memberData) return

      await UserStorage.registerSession(this.rememberUser)
      await UserStorage.storeData({
         keyInfo,
         ...sellerData,
         ...memberData,
      })

      this.goToDashboard()
   }


   polishAPIResponse(response) {
      delete response.errorCode
      delete response.errorMessage

      return response
   }


   async fetchSellerInfo(id) {
      try {

         const sellerUrl = `${STORAGE_URL}ws/account/${id.toLowerCase()}.json?t=${new Date().getTime()}`
         const storageData = await APIManager.fetchJSON(sellerUrl, { cache: 'no-store' })

         return {
            sellerInfo: storageData.seller.info,
            sellerPerms: storageData.seller.permissions
         }

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um problema ao buscar os dados do usuário. Verifique se o conteúdo foi gerado para o Portal.', this.tab, 'LOGIN_SELLER_ERROR')
         return null

      }
   }

   async fetchMemberInfo(id) {
      try {

         console.log('ssssss');
         console.log(STORAGE_URL);
         console.log(id);
         
         // console.log(memberUrl);
           
         
         
         const memberUrl = `${STORAGE_URL}ws/member/${id.toLowerCase()}.json?t=${new Date().getTime()}`         
         console.log(memberUrl);
         
         const storageData = await APIManager.fetchJSON(memberUrl + { cache: 'no-store' })
         
         console.log('storageData');
         console.log(storageData);
         
         return {
            memberInfo: storageData.member.info,
            memberPoints: storageData.member.points
         }

      } catch (error) {

         console.error(error)
         PopUp.triggerFail('Houve um problema ao buscar os dados da Revenda. Verifique se o conteúdo foi gerado para o Portal.', this.tab, 'LOGIN_MEMBER_ERROR')
         return null

      }
   }

   goToDashboard() {
      PopUp.triggerSuccess('Login realizado com sucesso. Você será redirecionado.', this.tab, 'LOGIN_SUCCESS')
      window.location.href = './welcome.html'
   }

   openLoadingModal() {
      new LoadingModal({
         title: 'Realizando login',
         message: 'Você será redirecionado.',
         hasContent:false
      }).openModal()
   }

   getFields() {
      return [
         {
            key: 'email',
            type: 'email',
            label: 'E-Mail',
            placeholder: 'Digite o seu e-mail, usuário ou telefone para acessar sua conta',
            onEnter: () => this.tryToLogin()
         },
         {
            key: 'password',
            type: 'password',
            label: 'Senha',
            isPassword: true,
            placeholder: 'Digite sua senha de acesso',
            onEnter: () => this.tryToLogin()
         },
      ]
   }
}



$('body').append(
   new Button()
      .css({
         'cursor': 'pointer',
         'text-transform': 'uppercase',
         'padding': '0.75rem 1rem',
         'border-radius': '6px',
         'border': 'none',
         'display': 'flex',
         'justify-content': 'space-between',
         'align-items': 'center',
         'column-gap': '2.5rem',
         'letter-spacing': '1px',
         'background-color': '#2C2E35',
         'color': '#FFF',
         'font-family': 'Google Sans',
         'font-weight': 700,
         'font-size': '15px',
         'margin': '1rem'
      })
      .text('Entrar')
      .click(async () => {
         UserStorage.isSessionOkay()
            ? window.location.href = './welcome.html'
            : new LoginTab().open()
      })
)