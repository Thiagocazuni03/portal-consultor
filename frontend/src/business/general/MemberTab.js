import Tab from '../../components/Tab.js'
import UserStorage from '../../core/UserStorage.js'
import InputForm from '../../core/InputForm.js'
import Modal from '../../core/Modal.js'
import PopUp from '../../core/PopUp.js'
import LoadingModal from './LoadingModal.js'
import { Div, Icon, H3, Img, Input } from '../../utils/Prototypes.js'
import { APPLICATION, EVENT_URL, STORAGE_URL } from '../../api/Variables.js'
import FolderManager from '../../core/FolderManager.js'
import APIManager from '../../api/APIManager.js'
import Utils from '../../core/Utils.js'
import Translator from '../../translation/Translator.js'
import Colors from '../../core/Colors.js'

export default class MemberTab extends Tab {
   constructor() {
      super({
         hasTitle: false,
         hasDesc: false
      })

      //Texto base
      this.leftButton.text(Translator.t('actions:close'))
      this.rightButton.text(Translator.t('actions:update'))

      //Configurando
      this.title.remove()
      this.desc.remove()

      //Criando elementos
      this.memberContent = new Div('SP__member')
      this.newMemberImage = {}

      //Eventos
      this.rightButton.click(() => this.close())
      this.leftButton.click(() => this.close())

      //Inicializando
      this.hideOrKeepFooter()
      this.setupMemberPicture()
      this.setupMemberForm()
      this.appendToContent(this.memberContent)
   }

   async hideOrKeepFooter() {
      const sellerType = await UserStorage.getSellerInfo('type')
      const isSellerManager = Number(sellerType) === 2

      if (!isSellerManager) {
         this.footer.remove()
      }
   }

   async setupMemberPicture() {
      const storageName = await UserStorage.getMemberInfo('name')
      const isUserManager = Number(await UserStorage.getSellerInfo('type')) === 2

      const userWrapper = new Div('SP__user')
      const userImage = new Div('SP__user__image')
      const userName = new H3('SP__user__name')
      const userButton = new Icon('SP__user__image__button')

      userButton.addClass('ic-edit')
      userImage.css('background-image', 'url(\'./assets/images/no-user-image.svg\')')
      userName.text(storageName)
      userWrapper.append(userImage, userName)
      userButton.click(() => this.openUploadImagePopUp())

      if (isUserManager) {
         userImage.append(userButton)
      }

      this.memberContent.prepend(userWrapper)
      this.getMemberImage().then(link => userImage.css('background-image', `url(${link}?t=${crypto.randomUUID()})`))
   }

   async tryToUpdateImage(modal) {
      const loadingModal = new LoadingModal({ title: 'Aguarde', message: 'Estamos __enviando__ a sua imagem.' })

      if (!this.newMemberImage.image) {
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
      const memberID = await UserStorage.getMemberInfo('id')
      const memberIdentifier = await UserStorage.getMemberInfo('identifier')
      const folderManager = new FolderManager('sys/comm/reseller', memberID)
      const onlyBase64 = this.newMemberImage.image.split(',')[1]

      //Trocando a imagem
      const uploadedURL = await folderManager.uploadByURL(memberID, onlyBase64, this.newMemberImage.extension)
      const uploadResponse = await this.callUploadMemberImageModule(memberIdentifier, uploadedURL)

      console.log(uploadedURL)
      console.log(uploadResponse)

      await UserStorage.rebuildSession()

      //Atualizando na página
      $('.SP__user__image').css('background-image', `url(${uploadedURL}?t=${crypto.randomUUID()})`)
   }

   async callUploadMemberImageModule(memberIdentifier, imageURL) {
      return await APIManager.fetchJSON(EVENT_URL, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            application: APPLICATION,
            type: 'query',
            module: 8005,
            params: {
               memberID: memberIdentifier,
               image: imageURL
            }
         })
      })
   }

   async openUploadImagePopUp() {
      new Modal({

         icon: 'ic-editor-imagem-add',
         color: 'var(--orange)',
         title: 'Alterar imagem',
         message: 'Clique ou arraste um arquivo para realizar upload.',
         appendToContent: [this.createUploadSection()],
         buttons: [
            { type: 'blank', text: 'Cancelar', closeOnClick: true },
            { type: 'filled', text: 'Confirmar', color: 'var(--orange)', closeOnClick: false, onClick: (modal) => this.tryToUpdateImage(modal) },
         ]

      }).openModal()
   }

   createUploadSection() {
      const uploadWrapper = new Div('SP__upload')
      const uploadCancel = new Icon('SP__upload__cancel')
      const uploadImage = new Img('SP__upload__image')

      const removePlaceholder = (event) => {
         event.stopPropagation()
         uploadWrapper.removeClass('hasImage')
         uploadImage.attr('src', '')
         this.newMemberImage = {}
      }

      const placePlaceholder = (image, extension) => {
         uploadWrapper.addClass('hasImage')
         uploadImage.attr('src', image)
         this.newMemberImage = {}
         this.newMemberImage.image = image
         this.newMemberImage.extension = extension
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

   async setupMemberForm() {
      const inputFields = await this.getFields()
      const memberForm = new InputForm({
         inputs: inputFields,
         showRequired: false
      })

      this.memberContent.append(memberForm.getView())
   }

   async getMemberImage() {
      const storedLink = await UserStorage.getMemberInfo('image')
      const willAppendBaseURL = !storedLink.startsWith('https://storage')
      const finalLink = willAppendBaseURL ? STORAGE_URL + storedLink : storedLink
      const fallbackLink = './assets/images/no-user-image.svg'

      return new Promise((resolve, reject) => {
         const testImage = new Image()
         testImage.addEventListener('load', () => resolve(finalLink))
         testImage.addEventListener('error', () => resolve(fallbackLink))
         testImage.src = finalLink
      })
   }

   async getFields() {

      const name = await UserStorage.getMemberInfo('name')
      const document = await UserStorage.getMemberInfo('document')
      const nickname = await UserStorage.getMemberInfo('nickname')
      const documentToUse = document ? document.length === 14 ? Utils.formatCNPJ(document) : Utils.formatCPF(document) : ''

      return [
         {
            key: 'name',
            label: 'Razão Social',
            type: 'text',
            value: name,
            isReadonly: true
         },
         {
            key: 'document',
            label: 'CNPJ / CPF',
            type: 'text',
            value: documentToUse,
            isReadonly: true
         },
         {
            key: 'nickname',
            label: 'Fantasia',
            type: 'text',
            value: nickname,
            isReadonly: true
         },
      ]
   }
}