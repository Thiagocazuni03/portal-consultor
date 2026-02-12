import Tab from '../../components/Tab.js'
import UserStorage from '../../core/UserStorage.js'
import InputForm from '../../core/InputForm.js'
import PopUp from '../../core/PopUp.js'
import Modal from '../../core/Modal.js'
import FolderManager from '../../core/FolderManager.js'
import { APPLICATION, EVENT_URL } from '../../api/Variables.js'
import { Div, Icon, H3, Input, Img, Button } from '../../utils/Prototypes.js'
import APIManager from '../../api/APIManager.js'
import LoadingModal from './LoadingModal.js'
import Utils from '../../core/Utils.js'
import Translator from '../../translation/Translator.js'
import $ from 'jquery'

export default class UserTab extends Tab {
   constructor() {
      super({
         hasHeader: false,
         hasTitle: false,
         hasDesc: false,
         leftButtonText: Translator.t('actions:close'),
         rightButtonText: Translator.t('actions:update'),
         onLeftButtonClick: () => this.close(),
         onRightButtonClick: () => this.close(),
      })

      //Elementos
      this.sellerContent = new Div('SP__seller')

      //Imagem do usuário
      this.newUserImage = {}

      //Montando
      this.setupUserPicture()
      this.setupUserForm()
      this.appendToContent(this.sellerContent)
   }

   /**
    * Mostra um popup que diz que está função está em contrução
    */
   showInDevelopmentPopup() {
      PopUp.triggerInfo(Translator.tC('messages:in-development'), this.getTab(), 'IN_DEVELOPMENT')
   }


   /**
    * Define a foto do usuário
    */
   async setupUserPicture() {
      const storageName = await UserStorage.getSellerInfo('name')

      const userClose = Icon('SP__user__close ic-close')
      const userWrapper = Div('SP__user')
      const userInfo = Div('SP__user__info')
      const userImage = Div('SP__user__image')
      const userName = H3('SP__user__info__name')
      const userDescription = Div('SP__user__info__description')
      const userImageOverlay = Div('SP__user__image__overlay')
      const userChangeImageButton = Button('SP__user__image__overlay__button')
      const userActionsRow = Div('SP__user__actions')
      const userChangePasswordButton = Button('SP__user__actions__button')
      const userChangePictureButton = Button('SP__user__actions__button')

      userDescription.text(Translator.tC('common:seller'))
      userChangeImageButton.append(Icon('ic-edit'))
      userName.text(storageName)
      userInfo.append(userName, userDescription)
      userWrapper.append(userClose, userImage, userInfo, userActionsRow)
      userImage.append(userImageOverlay)
      userImageOverlay.append(userChangeImageButton)
      userChangePasswordButton.text(Translator.tC('actions:change-password'))
      userChangePictureButton.text(Translator.tC('actions:change-image'))
      userActionsRow.append(userChangePasswordButton, userChangePictureButton)
      
      userChangeImageButton.on('click', () => this.openChangeProfilePictureModal())
      userChangePictureButton.on('click', () => this.openChangeProfilePictureModal())
      userChangePasswordButton.on('click', () => this.showInDevelopmentPopup())
      
      this.getSellerImageUrlOrFallbackUrl().then((url) => {
         userImage.css('background-image', `url(${url}?t=${crypto.randomUUID()})`)
         userImage.addClass('isLoaded')
      })

      this.sellerContent.append(userWrapper)
   }

   /**
    * Retorna a imagem do vendedor ou uma imagem fallback
    * @returns {string} A image do vendedor ou fallback
    */
   async getSellerImageUrlOrFallbackUrl() {
      const fallbackUrl = './assets/images/no-user-image.svg'
      const imageUrl = await UserStorage.getSellerInfo('image') + '?t=' + Date.now()
      const hasUrl = Boolean(imageUrl)

      if (!hasUrl) {
         return fallbackUrl
      }

      return Utils.tryToLoadImage(imageUrl)
         .then(() => imageUrl)
         .catch(() => fallbackUrl)
   }

   /**
    * Define o formulário da aba
    */
   async setupUserForm() {
      const fieldsConfiguration = await this.getFieldsConfiguration()
      const userForm = new InputForm({
         inputs: fieldsConfiguration,
         showRequired: false
      })

      this.sellerContent.append(userForm.getView())
   }

   /**
    * Abre um modal para realizar o upload de imagem
    */
   async openChangeProfilePictureModal() {
      new Modal({
         autoOpen: true,
         hasIcon: false,
         title: Translator.tT('actions:change-image'),
         message: Translator.tC('messages:click-or-drop-image-here'),
         appendToContent: this.createUploadSection(),
         buttons: [
            {
               type: 'blank',
               text: Translator.t('actions:cancel'),
               closeOnClick: true
            },
            {
               type: 'filled',
               text: Translator.tC('actions:confirm'),
               closeOnClick: false,
               onClick: (modal) => this.tryToUpdateImage(modal)
            }
         ]
      })
   }

   /**
    * Cria a seção de upload do modal
    */
   createUploadSection() {
      const uploadWrapper = Div('SP__upload')
      const uploadCancel = Icon('SP__upload__cancel')
      const uploadImage = Img('SP__upload__image')

      const removePlaceholder = (event) => {
         event.stopPropagation()
         uploadWrapper.removeClass('hasImage')
         uploadImage.attr('src', '')
         this.newUserImage = {}
      }

      const placePlaceholder = (image, extension) => {
         uploadWrapper.addClass('hasImage')
         uploadImage.attr('src', image)
         this.newUserImage = {}
         this.newUserImage.image = image
         this.newUserImage.extension = extension
      }

      const readFile = async (file) => {
         return new Promise(resolve => {
            const fileReader = new FileReader()
            fileReader.onload = ({ target }) => resolve(target.result)
            fileReader.onerror = () => triggerFailPopUp('Houve um erro ao ler seu arquivo.')
            fileReader.readAsDataURL(file)
         })
      }

      const tryToImportFile = async (file) => {
         const bytesAmountInOneMB = 1048576
         const isTypeValid = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)
         const isSizeValid = file.size <= (30 * bytesAmountInOneMB)
         const isFileValid = isTypeValid && isSizeValid

         if (!isFileValid) {
            new PopUp({
               icon: 'ic-close',
               color: 'var(--red)',
               message: 'O arquivo enviado é invalido. Cerifique-se que o mesmo é uma imagem e possui menos de 30Mb.'
            }).trigger()
            return
         }

         const imageAsBase64 = await readFile(file)
         const fileExtension = file.name.split('.').pop()
         placePlaceholder(imageAsBase64, fileExtension)
      }

      const openFileImportMenu = () => {
         new Input()
            .attr('type', 'file')
            .on('change', function () { tryToImportFile(this.files[0]) })
            .trigger('click')
      }

      uploadCancel.addClass('ic-close')
      uploadWrapper.append(uploadCancel, uploadImage)
      uploadWrapper.click(() => openFileImportMenu())
      uploadCancel.click((event) => removePlaceholder(event))

      return uploadWrapper
   }

   async tryToUpdateImage(modal) {
      const loadingModal = new LoadingModal({
         title: Translator.tC('common:wait'),
         message: Translator.t('messages:updating-profile-image'),
         autoOpen: true
      })

      if (!this.newUserImage.image) {
         modal.closeModal()
         return
      }

      loadingModal.openModal()

      try {

         await this.changeUserImage()
         new PopUp({ icon: 'ic-check', color: 'var(--green)', message: 'Imagem atualizada com sucesso!', appendTo: this.tab }).trigger()
         modal.closeModal()

      } catch (error) {

         console.error(error)
         new PopUp({ icon: 'ic-close', color: 'var(--red)', message: 'Houve um erro ao atualizar a imagem de perfil', appendTo: this.tab }).trigger()

      } finally {

         loadingModal.closeModal()

      }
   }








   async changeUserImage() {
      const sellerID = await UserStorage.getSellerInfo('id')
      const sellerIdentifier = await UserStorage.getSellerInfo('identifier')
      const folderManager = new FolderManager('sys/comm/seller', sellerID)
      const onlyBase64 = this.newUserImage.image.split(',')[1]

      //Trocando a imagem
      const uploadedURL = await folderManager.uploadByURL(sellerID, onlyBase64, this.newUserImage.extension)
      await this.callUploadSellerImageModule(sellerIdentifier, uploadedURL)
      await UserStorage.rebuildSession()

      //Ajustando nos html
      $('.SP__user__image').css('background-image', `url(${uploadedURL}?t=${crypto.randomUUID()})`)
      $('.SP__avatar').css('background-image', `url(${uploadedURL}?t=${crypto.randomUUID()})`)
   }

   async callUploadSellerImageModule(sellerIdentifier, imageURL) {
      return await APIManager.fetchJSON(EVENT_URL, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            application: APPLICATION,
            type: 'query',
            module: 8004,
            params: {
               sellerID: sellerIdentifier,
               image: imageURL
            },
         })
      })
   }

   readFileAsBase64(file) {
      return new Promise(resolve => {
         const fileReader = new FileReader()
         fileReader.onload = ({ target }) => resolve(target.result)
         fileReader.readAsDataURL(file)
      })
   }

   triggerUpdateError() {
      new PopUp({
         color: 'var(--fifth)',
         message: 'Nenhuma imagem selecionada',
         icon: 'ic-close',
         uniqueToken: 'UPLOAD_IMAGE_POPUP'
      }).trigger()
   }

   triggerLoadImageError() {
      new PopUp({
         uniqueToken: 'LOAD_IMAGE_POPUP',
         color: 'var(--red)',
         icon: 'ic-close',
         message: 'A imagem é muito grande ou o formato de arquivo não é suportado.'
      }).trigger()
   }

   /**
    * Retorna a configuração dos campos do formulário readonly desta aba
    * @returns {Promise<object[]>} A configuração dos campos 
    */
   async getFieldsConfiguration() {
      const [document, birthDate, gender, email, phone] = await Promise.all([
         UserStorage.getSellerInfo('document'),
         UserStorage.getSellerInfo('birthDate'),
         UserStorage.getSellerInfo('gender'),
         UserStorage.getSellerInfo('email'),
         UserStorage.getSellerInfo('contact')
      ])

      return [
         {
            key: 'document',
            label: Translator.t('common:document'),
            placeholder: Translator.tC('empty:document'),
            value: document ? Utils.formatCPF(document) : '',
            isReadonly: true,
         },
         {
            key: 'birthDate',
            type: 'date',
            label: Translator.t('common:birth-date'),
            placeholder: Translator.tC('empty:birth-date'),
            value: birthDate,
            isReadonly: true,
         },
         {
            key: 'gender',
            type: 'select',
            label: Translator.t('common:gender'),
            placeholder: Translator.tC('empty:gender'),
            value: gender,
            isReadonly: true,
            options: [
               {
                  value: 1,
                  text: Translator.tC('genders:masculine')
               },
               {
                  value: 2,
                  text: Translator.tC('genders:feminine')
               }
            ],
         },
         {
            key: 'email',
            type: 'text',
            label: Translator.t('common:email'),
            placeholder: Translator.tC(''),
            value: email,
            isReadonly: true,
         },
         {
            key: 'phone',
            type: 'text',
            label: Translator.t('common:phone'),
            placeholder: Translator.tC('empty:phone'),
            value: phone,
            isReadonly: true,
         }
      ]
   }
}