import { IDToken } from "../utils/IDToken.js"
import { Button, Div, Icon, Input, Label, P } from "../utils/Prototypes.js"
import Modal from "./Modal.js"
import PopUp from "./PopUp.js"
import $ from 'jquery'
import 'jquery-mask-plugin/dist/jquery.mask.min'

/**
 * Classe para criar uma check-list para formulários
 * @author Fernando Petri
 */
export default class CheckList {
   constructor(config) {

      // Define a configuração padrão da classe
      this.config = {
         name: null,
         readonly: false,
         sortable: true,
         autoAdd: true,
         handle: 'ic-dots-v',
         height: null,
         startEmpty: true,
         syncFooterWithFormFields: [],
         emptyIcon: 'ic-info-circle',
         empty: 'Nenhum registro',
         read: 'json',
         save: 'json',
         style: 'blank', //blank, clean, filled
         delete: true,
         default: [],
         header: [],
         footer: [],
         data: [],
         button: true,
         value: [],
         inputs: [
            {
               name: "checked",
               type: 'checkbox',
               default: false,
               column: 1,
            },
            {
               name: 'description',
               type: 'text',
               default: "",
               placeholder: "Digite algo aqui...",
               column: 11,
            }
         ],
         validate: {
            min: 1,
            max: null,
         }
      }


      //Sobreescrevendo configurações do modulo
      if (config) $.extend(this.config, config)

      //Substitui o value caso for null e existir default
      if (this.config.default.length && this.config.value == null) {
         this.config.value = this.config.default
      }

      //Lidando quando os inputs possuem mais de uma linha
      this.decideRowsLayout()

      //Processando valor
      this.handleInitialValue()

      //Tentando relacionar os dados das linhas
      this.handleConsumerInputs()

      //Criando elementos
      this.inputContainer = new Div('ckl');
      this.inputHeader = new Div('ckl-hd')
      this.inputsList = new Div('ckl-ipts')
      this.inputFooter = new Div('ckl-ft')
      this.newRowBtn = new Button('ckl-btn')
      this.errorContainer = new Div('ckl-error ip-er')
      this.noRowMessage = new Div('ckl-empty')

      //Outros dados
      this.imagesToUpload = {}
      this.imagesToDelete = []

      this.filesToUpload = {}
      this.filesToDelete = []

      this.storageBaseURL = 'https://storage.googleapis.com/'
      this.modules = {}
      this.modulesRequests = {}
      this.footerValues = {}
      this.isFetchingStorages = false

      //Configurando
      this.newRowBtn.text('Adicionar')
      this.newRowBtn.click(() => this.addRow())

      //Adicionando estilo
      this.inputContainer.addClass(this.config.style)
      this.noRowMessage.append(new Icon(`ckl-empty-i ${this.config.emptyIcon}`))
      this.noRowMessage.append(this.config.empty)

      //Configurando tamanho
      this.inputContainer.css('height', this.config.height ?? 'min-content')
      this.inputContainer.css('overflow-y', this.config.height ? 'scroll' : 'visible')
      this.inputContainer.css('padding-right', this.config.height ? '0.5rem' : '0rem')
      this.inputHeader.css('grid-template-columns', this.getColumnsGridValue(this.config.inputs))
      this.inputFooter.css('grid-template-columns', this.getColumnsGridValue(this.config.inputs))

      //Verificando propriedades específicas 
      if (this.config.sortable) this.activateSortable()
      if (this.config.readonly) this.setAllAsReadOnly()
      if (this.config.button) this.newRowBtn.addClass('keepShown')

      //Atalho para ver o valor
      this.inputContainer.click(({ ctrlKey, shiftKey }) => (ctrlKey && shiftKey) && this.printCheckListState())

      //Montando
      this.inputHeader.append(this.getHeaderLabels())
      this.inputContainer.append(this.inputHeader, this.inputsList, this.noRowMessage, this.inputFooter, this.newRowBtn, this.errorContainer)
   }

   /**
    * Inicializa e coloca os campos com valores
    */
   init(createRowIfEmpty = true) {

      this.imagesToUpload = {}
      this.filesToUpload = {}

      if (this.config.value.length) {

         const rowsData = [...Array(this.config.value.length)].map(() => [...this.config.inputs])
         const rowsWithValues = rowsData.map((row, rowIdx) => row.map((input, iptIdx) => ({ ...input, value: this.getInputValue(input.name, rowIdx, iptIdx) ?? input.default })))
         const rowsNodes = rowsWithValues.map((rowData, rowIndex) => this.createRow(rowData, rowIndex))

         this.inputsList.empty()
         this.inputsList.append(rowsNodes)

      } else {

         const numberOfRows = (createRowIfEmpty && !this.config.startEmpty) ? Number(this.config.validate.min ?? 1) : 0
         const rowsData = [...Array(numberOfRows)].map(() => [...this.config.inputs])
         const rowsWithValues = rowsData.map((row) => row.map((input) => ({ ...input, value: input.default })))
         const rowsNodes = rowsWithValues.map((rowData, rowIndex) => this.createRow(rowData, rowIndex))

         this.inputsList.empty()
         this.inputsList.append(rowsNodes)

      }

      this.setValue(this.config.value)
      this.updateFooter()
   }

   /**
    * Printa informações sobre o check_list
    */
   printCheckListState() {
      console.log({
         value: this.config.value,
         formValue: JSON.parse(this.getValue()),
         validation: this.getAllRowsValidations(),
         valid: this.validate(),
         config: this.config
      })
   }

   /**
    * Decide o estilo de visualização das linhas 
    */
   decideRowsLayout() {
      const isSingleLine = this.config.inputs.every(item => !Array.isArray(item))

      if (isSingleLine) {

         this.rowsLayout = 'single'
         this.rowsAmount = 1

      } else {

         this.rowsLayout = 'multiple'
         this.rowsAmount = this.config.inputs.length

      }

      this.config.inputs = this.config.inputs.flat(Infinity)
   }


   /**
    * Coloca os dados faltantes passados para o `data` nos inputs `consumer`
    */
   handleConsumerInputs() {
      this.config.data.forEach(data => {

         const target = this.config.value.find(row => Number(row.id) === Number(data.id))

         if (!target) return

         const targetKeys = Object.keys(target)
         const dataKeys = Object.keys(data)
         const missingKeys = dataKeys.filter(key => !targetKeys.includes(key))
         const isKeyConsumer = missingKeys.filter(key => !!this.config.inputs.find(input => input.name === key).consumer)

         isKeyConsumer.forEach(key => target[key] = (data[key] ?? ""))
      })
   }

   /**
    * Lida com as variáveis pegas do sistema
    */
   handleSystemVariables() {
      this.getInputs().forEach(input => {

         if (this.isSystemVariable(input.value)) input.value = this.getSystemVariable(input.value)
         if (this.isSystemVariable(input.default)) input.default = this.getSystemVariable(input.default)

      })
   }

   /**
    * Desanetiza um valor de acordo com seu datatype
    */
   handleUnsanitize() {
      this.config.value.forEach(row => {
         Object.keys(row).forEach(name => {

            if (name === 'id') return

            const input = this.getInputByName(name)

            if (!input) return

            row[name] = formatValue(row[name], input.datatype)

         })
      })
   }

   /**
    * Busca o link das storages 
    */
   async fetchStorageLinks() {
      if (!this.hasUploadInput()) return
      if (this.hasStoragesDownloaded()) return

      this.isFetchingStorages = true

      const baseStorages = ['default']
      const inputStorages = this.getInputs().filter(input => !!input.storage).map(input => input.storage)
      const requiredStorages = [...baseStorages, ...inputStorages]

      try {

         const response = await this.callCheckListAPI({
            action: 'getStorages',
            storages: requiredStorages
         })

         this.config.storages = response
         this.isFetchingStorages = false

      } catch (error) {

         console.error(error)
         ui.showError({ errorMessage: 'Houve um erro ao buscar os diretórios para salvar os arquivos.' })

      }
   }

   /**
    * Retorna se tem as storages baixadas 
    */
   hasStoragesDownloaded() {
      return !!Object.keys(this.config.storages ?? {}).length
   }

   /**
    * Retorna se há um input de upload no check-list 
    */
   hasUploadInput() {
      return !![
         ...this.getAllInputsByType('image'),
         ...this.getAllInputsByType('file_upload')
      ].length
   }

   /**
    * Retorna os elementos para colocar como título no header 
    */
   getHeaderLabels() {
      if (!this.config.header.length) return []

      const allLabels = this.config.header.map(item => {
         const textToUse = String(item.label).trim()
         const alignToUse = item.align ?? "left"

         return new P('ckl-hd-lbl')
            .text(textToUse)
            .css('text-align', alignToUse)
      })

      if (this.config.sortable) {
         allLabels.unshift(new Div())
      }
      if (!this.config.readonly && this.config.delete) {
         allLabels.push(new Div())
      }

      return allLabels
   }

   /**
    * Retorna o valor da proriedade `grid-template-columns` para usar no header e nas linhas
    */
   getColumnsGridValue(inputs) {

      let gridValues = []

      if (this.rowsLayout === 'single') {

         inputs.forEach((input, inputIndex) => {

            const inputIsHidden = input.visible === false
            const headerValue = this.config.header?.[inputIndex]?.column
            const inputValue = input.column

            if (inputIsHidden) {
               return
            }

            if (headerValue) {
               gridValues.push(headerValue + 'fr')
               return
            }

            gridValues.push(inputValue + 'fr')
         })

      } else if (this.rowsLayout === 'multiple') {

         gridValues.push(...(Array(12).fill('1fr')))

      }


      if (this.config.sortable) {
         gridValues.unshift('28px')
      }

      if (!this.config.readonly && this.config.delete) {
         gridValues.push('28px')
      }

      return gridValues.join(' ')
   }

   /**
    * Processa o valor inicial
    */
   handleInitialValue() {
      try {

         //Caso não possuir valor prévio
         if (this.config.value === null || this.config.value === 'null' || this.config.value === undefined) {
            this.config.value = []
            return
         }

         //Caso deva ler como um JSON
         if (this.config.read === 'json') {
            if (typeof this.config.value === 'string') this.config.value = JSON.parse(this.config.value)
            if (typeof this.config.value === 'object') this.config.value = structuredClone(this.config.value)
            return
         }

         //Caso deva ler como CSV
         if (this.config.read === 'csv') {
            const initalValue = [...Array(this.config.inputs.length)].map(() => "").join(",")
            const allRows = (Array.isArray(this.config.value) ? initalValue : this.config.value ?? initalValue).split('\n')
            const rowsWithValues = allRows.map((row, rowIndex) => {
               const rowValues = row.split(',')
               const rowEntries = rowValues.map((value, index) => {

                  const input = this.config.inputs[index]
                  const keyToUse = input.name
                  const ignoreEntry = Boolean(input.ignore)
                  const valueToUse = value === '' ? input.default : value

                  if (ignoreEntry) return null

                  return [keyToUse, valueToUse]
               })

               rowEntries.push(['id', rowIndex])

               return Object.fromEntries(rowEntries.filter(Boolean))
            })

            this.config.value = rowsWithValues
            return
         }


      } catch (error) {

         console.error("Não foi possível ler o valor do input CheckList")
         console.error(error)
         this.config.value = []

      }
   }

   /**
    * Coloca todos os campos como readonly
    */
   setAllAsReadOnly() {
      this.config.inputs.forEach(input => {
         input.readonly = true
      })
   }

   /**
    * Possibilita a ordenação dos items
    */
   activateSortable() {
      if (this.config.readonly) return

      this.inputsList.sortable({
         axis: 'y',
         revert: true,
         placeholder: 'ckl-ipts-placeholder',
         handle: '.ckl-ipts-row-hdl',
         cursor: 'move',
         start: (event, { helper, placeholder }) => {
            this.blurAllInputs()
            $(placeholder).css('height', $(helper).outerHeight())
         },
         stop: (event) => {
            this.organizeValuesBasedOnUI()
            this.init()
         }
      })
   }

   /**
    * Altera o valor do input no `this.config.value`
    */
   setInputValue(name, value, rowIndex, inputIndex) {
      this.config.value[rowIndex][name] = value
      this.setValue(this.config.value)
   }

   /**
    * Retorna o valor do input
    */
   getInputValue(name, rowIndex) {
      return this.config.value[rowIndex][name]
   }

   /**
    * Reordena os valores baseandos-se na UI, necessário quando a lista é sortable
    */
   organizeValuesBasedOnUI() {
      const allListItems = Array.from(this.inputsList.children('[data-row]'))
      const allItemValues = allListItems.map(row => this.config.value[Number($(row).attr('data-row'))])

      this.config.value = allItemValues
   }

   /**
    * Dá blur em todos os inputs possíveis
    */
   blurAllInputs() {
      const allInputElements = Array.from(this.inputsList.find('input'))
      allInputElements.forEach(el => $(el).blur())
   }

   /**
    * Cria uma linha com inputs que podem ser de variados tipos
    */
   createRow(inputs, rowIndex) {
      if (!this.config.value[rowIndex]) this.config.value[rowIndex] = { id: rowIndex }

      const rowWrapper = new Div('ckl-ipts-row')
      const deleteButton = new Icon('ckl-ipts-row-del ic-close')
      const inputNodes = inputs.map((inputData, inputIndex) => this.createInput({ ...inputData, rowIndex, inputIndex }))
      const columnSizes = this.getColumnsGridValue(inputs)
      const rowHandle = new Icon(`ckl-ipts-row-hdl ${this.config.handle}`)

      //Caso for sortable adicionar um handle
      if (this.config.sortable) {
         rowHandle.css('grid-row', '1 / span ' + this.rowsAmount)
         rowWrapper.append(rowHandle)
      }

      rowWrapper.append(inputNodes)

      if (this.hasDeleteButton()) {
         if (this.rowsAmount > 1) {
            deleteButton.css('grid-column', this.config.sortable ? 14 : 13)
            deleteButton.css('grid-row', '1 / span ' + this.rowsAmount)
         }
         rowWrapper.append(deleteButton)
      }

      //Configurando
      rowWrapper.attr('data-row', rowIndex)
      rowWrapper.css('grid-template-columns', columnSizes)


      //Botão de excluir linha
      deleteButton.click(() => {
         this.deleteRow(rowIndex)
         this.init(false)
      })

      return rowWrapper
   }

   /**
    * Retorna se poderá criar um botão de delete
    * Caso o delete esteja ativo, e o readonly não 
    */
   hasDeleteButton() {
      return !this.config.readonly && this.config.delete
   }

   /**
    * Retorna uma váriavel do sistema a partir de uma string como {USER_ID}
    */
   getSystemVariable(systemKey) {
      const formatedKey = String(systemKey).trim().replace(/^{|}$/gi, '')
      const systemValue = ui.getUserData()[formatedKey]

      return systemValue
   }

   /**
    * Cria um input de acordo com o seu tipo
    * Redireciona para os outros métodos criadores
    */
   createInput(inputData) {
      const inputTypes = {

         'checkbox': () => this.createCheckBoxInput(inputData),
         'select': () => this.createSelectInput(inputData),
         'text': () => this.createDefaultInput(inputData),
         'image': () => this.createImageUploadInput(inputData),
         'select_module': () => this.createSelectModuleInput(inputData),
         'date_picker': () => this.createDatePickerInput(inputData),
         'toggle': () => this.createToggleInput(inputData),
         'file_upload': () => this.createFileUploadInput(inputData)

      }

      //Verifica se tem o tipo, cria um input normal caso não houver
      const hasType = !!inputTypes[inputData.type]
      const input = hasType ? inputTypes[inputData.type]() : inputTypes['text']()

      //Mostra mensagem de erro para o desenvolvedor
      if (!hasType) {
         const typeSelected = inputData.type
         const possibleTypes = Object.keys(inputTypes).join('|')
         console.warn(`(Check List) Não foi encontrado o tipo de input '${typeSelected}', os valores válidos são (${possibleTypes})`)
         return
      }

      //Caso o input não for visivel
      if (inputData.visible === false) {
         input.css('display', 'none')
      }

      //Caso cada registro for possuir mais de uma linha
      if (this.rowsLayout === 'multiple') {
         input.css('grid-column', `span ${inputData.column}`)
      }

      //Caso for tipo de upload ou imagem, ocupa o máximo de linhas possíveis por padrão
      if (inputData.type === 'image' || inputData.type === 'file_upload') {
         input.css('grid-row', 'span ' + this.rowsAmount)
      }

      //Caso tiver uma ocupação de linhas específicas
      if (inputData.row) {
         input.css('grid-row', 'span ' + inputData.row)
      }

      input.attr('data-input', inputData.inputIndex)
      input.attr('data-name', inputData.name)

      return input
   }

   /**
    * Retorna se um valor é uma variável do sistema
    */
   isSystemVariable(value) {

      const stringValue = String(value).trim()
      const isVariable = /^{[a-z_]+}$/gi.test(stringValue)

      return isVariable
   }

   /**
    * Cria um input de upload de arquivo
    */
   createFileUploadInput({
      name,
      icon = 'upload',
      iconSize = 20,
      extensions = ['*'],
      maxSize = 5,
      readonly,
      value,
      storage,
      fileName = 'file',
      path,
      rowIndex,
      inputIndex
   }) {
      const inputWrapper = new Div('ckl-ipts-row-ipt')
      const uploadInput = new Div('ckl-ipts-row-ipt-fup')
      const uploadIcon = new Icon('ckl-ipts-row-ipt-fup-ic')
      const uploadRemove = new Div('ckl-ipts-row-ipt-fup-opt isRemove')
      const uploadVisualize = new Div('ckl-ipts-row-ipt-fup-opt isView')

      let currentFile = null
      let fileToken = crypto.randomUUID()

      //Retorna a visualização de um conteúdo
      const getVisualization = (content, mimeType) => {
         const type = mimeType.split('/')[0]

         const specialImageMimes = ['application/pdf']
         const specialVideoMimes = ['application/mp4']
         const specialAudioMimes = []

         const willShowAsImage = specialImageMimes.includes(mimeType) || type === 'image'
         const willShowAsVideo = specialVideoMimes.includes(mimeType) || type === 'video'
         const willShowAsAudio = specialAudioMimes.includes(mimeType) || type === 'audio'

         if (willShowAsImage) {
            const useEmbed = mimeType === 'application/pdf'
            const image = useEmbed ? $('<embed>') : new Img()

            if (useEmbed) {
               image.css('width', '700px')
               image.css('height', '700px')
            }

            image.attr('src', content)
            image.css('max-width', '700px')

            return {
               content: image,
               title: useEmbed ? "PDF" : "Imagem"
            }
         }

         if (willShowAsVideo) {
            const video = $('<video>')

            video.css('max-width', '700px')
            video.attr('autoplay', true)
            video.attr('controls', true)
            video.attr('src', content)

            return {
               content: video,
               title: "Video"
            }
         }
         if (willShowAsAudio) {
            const audio = $('<audio>')
            const source = $('<source>')

            source.attr('src', content)
            source.attr('type', mimeType)
            audio.attr('autoplay', true)
            audio.attr('controls', true)
            audio.append(source)

            return {
               content: audio,
               title: "Áudio"
            }
         }

         return null
      }

      //Retorna o nome do bucket de acordo com a url da storage
      const getBucketName = () => {
         return this.config.storages[storage ?? 'default'].split('/').filter(Boolean).pop()
      }

      //Retorna o susposto caminho que foi uploadado o arquivo
      const getCloudPath = () => {
         return this.config.storages[storage ?? 'default'] + currentFile
      }

      //Abre o visualizador para mostrar o perdil
      const openVisualizator = () => {

         let mimeType = null

         this.isPath(currentFile)
            ? mimeType = extensionToMimeType(currentFile.split('.').pop())
            : mimeType = this.getMimeTypeFromBase64(currentFile)

         if (!mimeType) {
            openErrorModal('Não é possível visualizar este tipo de arquivo.')
            return
         }

         const sourceToUse = this.isPath(currentFile) ? getCloudPath() : currentFile
         const visualization = getVisualization(sourceToUse, mimeType)

         if (!visualization) {
            openErrorModal('Não é possível visualizar este tipo de arquivo.')
            return
         }

         const visualizationModal = new Modal({
            build: {
               content: {
                  padding: 0
               }
            },
            ...visualization
         })

         visualizationModal.show()
      }

      //Troca o icone de acordo com o tipo de arquivo
      const changeInputIcon = (extension) => {

         uploadIcon.removeClass()
         uploadIcon.addClass('ckl-ipts-row-ipt-fup-ic')
         uploadInput.addClass('hasFile')

         const videoExtensions = ['mp4', 'mob, avi', 'x-msvideo', 'avif', 'mkv', 'webm', 'mpeg']
         const imageExtensions = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'tiff', 'bmp', 'svg']
         const soundExtensions = ['mp3', 'm4a', 'flac', 'mpeg', 'ogg', 'wav', 'wma', 'aac']

         if (videoExtensions.includes(extension)) {
            uploadIcon.addClass('play-circle')
            return
         }

         if (imageExtensions.includes(extension)) {
            uploadIcon.addClass('image')
            return
         }

         if (soundExtensions.includes(extension)) {
            uploadIcon.addClass('volume')
            return
         }

         uploadIcon.addClass('files')
      }

      //Coloca o arquivo
      const setFile = (value, fileExtension) => {

         let mimeType = null
         let extension = null

         //Pegando extensão e mimeType 
         if (this.isPath(value)) {
            extension = this.getExtensionFromURL(value)
            mimeType = fileExtension ?? extensionToMimeType(extension)
         } else {
            mimeType = this.getMimeTypeFromBase64(value)
            extension = fileExtension ?? mimeTypeToExtension(mimeType)
         }

         //Trocando o ícone de acordo com a extensão
         changeInputIcon(extension)

         //Adicionando na lista  de uploads depois do submit
         if (!this.isPath(value)) {
            this.filesToUpload[fileToken] = {
               base64: value,
               from: name,
               storage: getBucketName(),
               row: rowIndex,
               fileName: fileName + '-' + fileToken,
               path: path,
               extension: extension
            }
         }

         currentFile = value

         //Colocando o valor do input e trocando para o próximo
         this.setInputValue(name, value, rowIndex)
         this.handleFocus(rowIndex, inputIndex)
         this.updateFooter()
      }

      //Abre um modal mostrando um erro
      const openErrorModal = (title) => {
         new Modal({
            icon: 'warning',
            style: 'alert',
            size: 'small',
            content: title,
         }).show()
      }

      //Le o arquivo
      const readAsDataURL = (file) => {
         return new Promise(resolve => {
            const fileReader = new FileReader()
            fileReader.onerror = () => resolve(null)
            fileReader.onload = (event) => resolve(event.target.result)
            fileReader.readAsDataURL(file)
         })
      }

      //Remove o arquivo e seu preview, adiciona na lista de deletes
      const removeFile = () => {
         if (readonly) return
         if (currentFile === null) return

         if (this.isPath(currentFile)) {
            this.filesToDelete.push({

               fileName: this.getFullFileNameFromURL(currentFile),
               path: this.getOnlyPathFromURL(currentFile),
               storage: getBucketName()

            })
         } else {
            delete this.filesToUpload[fileToken]
         }

         currentFile = null

         this.setInputValue(name, null, rowIndex)

         uploadIcon.removeClass()
         uploadInput.removeClass('hasFile')
         uploadIcon.addClass(`ckl-ipts-row-ipt-fup-ic ${icon}`)
      }

      //Lida com o import do arquivo
      const handleFileImport = async (file) => {
         const fileMegaBytes = file.size / (1024 ** 2)
         const isSmallerThanLimit = fileMegaBytes <= (maxSize ?? Number.POSITIVE_INFINITY)
         const isFileExtensionValid = extensions.includes('*') || extensions.includes(file.name.split('.').pop())

         if (!isFileExtensionValid) {
            openErrorModal('Formato de arquivo inválido.')
            return
         }

         if (!isSmallerThanLimit) {
            openErrorModal('O arquivo enviado excedeu<br>o limite de tamanho.')
            return
         }

         const fileRead = await readAsDataURL(file)
         const readSuccessfully = fileRead !== null

         if (!readSuccessfully) {
            openErrorModal('Não foi possível ler o arquivo.')
            return
         }

         removeFile()
         setFile(fileRead, file.name.split('.').pop())
      }

      //Abre o menu de importar arquivos (Caso não for readonly)
      const tryToOpenImportMenu = () => {
         if (readonly) return
         if (currentFile) return

         const fileInput = new Input()

         fileInput.attr('accept', extensions.map(ext => '.' + ext).join(','))
         fileInput.attr('type', 'file')
         fileInput.on('change', () => handleFileImport(fileInput[0].files[0]))
         fileInput.click()
      }

      //Eventos
      uploadInput.click(() => tryToOpenImportMenu())
      inputWrapper.on('mouseenter', () => inputWrapper.css('z-index', 2))
      inputWrapper.on('mouseleave', () => inputWrapper.css('z-index', ''))

      //Botão de visualizar
      uploadVisualize.click((event) => {
         event.stopPropagation()
         openVisualizator()
      })

      //Botao de remover
      uploadRemove.click((event) => {
         event.stopPropagation()
         removeFile()
      })

      //Configurando
      uploadIcon.addClass(icon)
      uploadIcon.css('width', iconSize + 'px')
      uploadIcon.css('height', iconSize + 'px')

      //Montando
      uploadRemove.append(new Icon('trash'))
      uploadVisualize.append(new Icon('eye-open'))
      uploadInput.append(uploadIcon)
      inputWrapper.append(uploadInput)
      uploadInput.append(uploadRemove, uploadVisualize)

      //Caso já possuir um valor
      if (value) {
         this.isPath(value)
            ? setFile(value, this.getExtensionFromURL(value))
            : setFile(value)
      }

      return inputWrapper
   }

   /**
    * Foca o próximo input ou cria uma nova linha
    */
   handleFocus(rowIndex, inputIndex) {

      this.inputsList.children(`[data-row=${rowIndex}]`).children(`[data-input=${inputIndex}]`).removeClass('hasError')

      if (this.isLastRow(rowIndex) && this.isLastInput(inputIndex)) {

         //É a ultima entrada da ultima linha, é necessário criar uma nova
         if (this.config.autoAdd) {
            this.addRow()
            this.focusFirstRowInput(rowIndex + 1)
         }

      } else if (this.isLastInput(inputIndex)) {

         //É a ultima entrada de uma linha, focar a próxima
         this.focusFirstRowInput(rowIndex + 1)

      } else {

         //É uma entrada no meio da linha, foca o próximo input
         this.focusInput(rowIndex, inputIndex + 1)

      }
   }

   /**
    * Retorna o mimeType de uma string base64 
    */
   getMimeTypeFromBase64(base64) {
      return base64.split(';')[0].split(':')[1]
   }

   /** 
    * Cria um input com um datepicker
    */
   createDatePickerInput({
      name,
      placeholder,
      rowIndex,
      value,
      color = 'var(--primary)',
      readonly,
      validate,
      datepicker,
      align = 'center',
      inputIndex
   }) {

      //Elementos
      const inputWrapper = new Div('ckl-ipts-row-ipt')
      const textInput = new Input('ckl-ipts-row-ipt-text')

      //Cria o datepicker apenas se não for readonly
      if (!readonly) {
         const defaultConfig = {
            datepicker: {
               own: {
                  singleDatePicker: true,
                  parentEl: inputWrapper
               }
            }
         }

         const datePickerInput = new DatePicker($.extend(defaultConfig, datepicker ?? null))

         datePickerInput.input = textInput
         datePickerInput.setOnChange(() => handleChange(datePickerInput.config.value))
         datePickerInput.init()
      }

      //Lida com o foco neste input
      const handleFocus = () => {
         textInput.focus()
      }

      //Quando uma data for selecionada no input
      const handleChange = (newValue) => {
         if (readonly) return

         this.setInputValue(name, newValue, rowIndex, inputIndex)
         this.handleFocus(rowIndex, inputIndex)
         this.updateFooter()
      }

      let valueToShow = null

      if (value && value.includes('-')) {
         valueToShow = value.split('-').reverse().join('/')
      } else {
         valueToShow = value
      }

      //Configurando
      textInput.css('color', color)
      textInput.css('text-align', align)
      textInput.attr('value', valueToShow)
      textInput.attr('placeholder', placeholder)
      textInput.attr('readonly', readonly)

      //Eventos
      inputWrapper.on('focus', () => handleFocus())

      //Caso tiver validate
      if (validate) {
         this.maskInput(textInput, validate)
      }

      //Montando
      inputWrapper.append(textInput)

      return inputWrapper
   }

   /**
    * Cria um input que busca um módulo 
    */
   createSelectModuleInput({
      name,
      module,
      value,
      unique = false,
      options,
      readonly,
      validate,
      isQuery = false,
      placeholder = 'Selecione uma opção...',
      rowIndex,
      inputIndex
   }) {
      const inputWrapper = new Label('ckl-ipts-row-ipt')
      const inputSelect = new Input('ckl-ipts-row-ipt-sm')
      const inputMenu = new Div('ckl-ipts-row-ipt-sm-mn')

      let timeout = null
      let lastToken = null

      //Configurando
      inputSelect.attr('placeholder', placeholder)

      //Trancando o input caso não for um select de pesquisa
      if (!isQuery) {

         inputSelect.val('Carregando...')
         inputSelect.attr('readonly', true)

      } else if (isQuery && value) {

         inputSelect.val('Carregando...')
         inputSelect.attr('readonly', true)

         this.fetchOptionsFromModule(module, { id: true }).then(options => {
            const optionSelected = options.find(option => Number(option.value) === Number(value))

            if (optionSelected) {

               setOption(optionSelected, false)

            } else {

               inputSelect.val('')
               this.setInputValue(name, null, rowIndex, inputIndex)

            }

            inputSelect.attr('readonly', readonly ? true : false)

         })
      }

      //Fecha o menu completamente
      const closeMenu = () => {
         inputMenu.removeClass('isShown')
         inputMenu.detach()
      }

      //Retorna o texto pesquisado
      const getTypedText = () => {
         return inputSelect.val()
      }

      //Abre o menu
      const openMenu = () => {
         inputMenu.addClass('isShown')
         inputWrapper.append(inputMenu)
      }

      //Quando uma opção do select é clicada
      const setOption = ({ value, label }, handleFocus = true) => {
         if (unique) {
            const otherValues = this.getAllValuesFromName(name)
            const isUnique = !otherValues.includes(value)

            if (!isUnique) {
               inputSelect.val('')
               inputSelect.removeClass('isMatching')
               this.setInputValue(name, null, rowIndex, inputIndex)
               this.updateFooter()
               PopUp.triggerFail('Este item já foi adicionado préviamente.', null, "UNIQUE_SELECT_ERROR")
               return
            }
         }

         inputSelect.val(label ?? '[Sem nome]')
         inputSelect.addClass('isMatching')

         this.setInputValue(name, value, rowIndex, inputIndex)
         this.updateFooter()

         if (handleFocus) this.handleFocus(rowIndex, inputIndex)
      }

      //Evento quando o input é focadp
      const handleFocus = () => {
         inputSelect.focus()
      }

      //Cria uma opção
      const createOption = ({ value, label, color, inactive = false }) => {
         const option = new Div(`ckl-ipts-row-ipt-sm-mn-opt ${inactive ? 'isInactive' : ''}`)
         option.css('color', color ?? '')
         option.text(label ?? '[Sem nome]')
         option.on('mousedown', () => {
            if (inactive) return
            closeMenu()
            setOption({ value, label })
         })
         return option
      }

      //Lida com o foco fora do input
      //Timeout necessário se não o clique na opção não funciona
      const handleFocusOut = () => {
         timeout = setTimeout(() => closeMenu(), 50)
      }

      //Lida com o foco no input
      const handleFocusIn = () => {
         if (readonly) return

         clearTimeout(timeout)
         openMenu()
      }

      //Retorna se o isQuery está satisfeito
      const satisfiesIsQuery = () => {
         const isQueryConfig = {
            numberActive: 3
         }

         if (typeof isQuery === 'object') $.extend(isQueryConfig, isQuery)

         const typedSufficient = getTypedText().length >= isQueryConfig.numberActive

         return typedSufficient
      }

      //Lida com o mouseleave
      const handleMouseLeave = () => {
         inputSelect.trigger('blur')
         handleFocusOut()
      }

      //Coloca um loader dentro do menu
      const setMenuLoading = () => {
         inputMenu.empty()
         inputMenu.append(new Div('ld'))
      }

      //Carrega opções
      const loadOptions = (options) => {
         if (!options?.length) {
            if (isQuery) {

               inputMenu.empty()
               inputMenu.append(createOption({
                  label: "Nada foi encontrado",
                  inactive: true,
                  color: 'var(--grey)'
               }))

            } else {

               inputSelect.val('Sem opções válidas...')
               inputSelect.attr('readonly', true)

            }
         } else {

            const optionMatching = options.find(option => option.value === value)
            const optionNodes = options.map(createOption)

            if (optionMatching) inputSelect.addClass('isMatching')
            if (!isQuery) inputSelect.val(optionMatching?.label ?? '')

            inputMenu.empty()
            inputMenu.append(optionNodes)
            inputSelect.attr('readonly', readonly ? true : false)
         }
      }

      //Busca as opções no módulo, retorna as opções caso já tiver predefinidas
      if (!isQuery) {
         options
            ? loadOptions(options)
            : this.fetchOptionsFromModule(module).then(options => loadOptions(options))
      }

      //Funcionalidade de abrir e fechar o menu
      inputSelect.on('focusout', () => handleFocusOut())
      inputSelect.on('focusin', () => handleFocusIn())
      inputWrapper.on('mouseleave', () => handleMouseLeave())
      inputWrapper.on('focus', () => handleFocus())

      //Caso tiver validate
      if (validate) {
         this.maskInput(inputSelect, validate)
      }

      //Quando usuário digitar
      inputSelect.on('input', (event) => {
         if (readonly) {

            event.preventDefault()

         } else if (isQuery) {
            if (satisfiesIsQuery()) {

               openMenu()
               setMenuLoading()

               this.setInputValue(name, null, rowIndex, inputIndex)

               lastToken = crypto.randomUUID()
               let apiToken = lastToken


               this.fetchOptionsFromModule(module, { search: event.target.value }).then(options => {
                  if (apiToken === lastToken) {
                     loadOptions(options)
                  }
               })

            } else {

               this.setInputValue(name, null, rowIndex, inputIndex)

            }
         } else if (!isQuery) {

            //Pegando dados
            const typedText = event.target.value
            const optionMatch = (this.modules[module + "-"] ?? options ?? []).find(option => option.label === typedText)

            //Caso não tiver digitado nada não faz nada
            if (!typedText) return

            //Pegando todas as crianças e dando um score caso inclua o texto
            const menuOptions = Array.from(inputMenu.children())
            const optionsNodesAndText = menuOptions.map(option => {

               //Dando um score as opções
               const optionText = $(option).text()
               const optionScore = Number(optionText.includes(typedText))

               return {
                  node: option,
                  score: optionScore
               }
            })

            //Adicionando as opções
            optionsNodesAndText.forEach(({ node, score }) => {
               score
                  ? inputMenu.prepend(node)
                  : inputMenu.append(node)
            })

            //Caso não der match em uma opção
            if (!optionMatch) {
               inputSelect.removeClass('isMatching')
               this.setInputValue(name, null, rowIndex, inputIndex)
               return
            }

            //Caso der match em uma opção (Tem o exato mesmo nome)
            setOption(optionMatch)
         }


      })

      //Montando
      inputWrapper.append(inputSelect, inputMenu)

      return inputWrapper
   }

   /**
    * Busca um módulo
    */
   fetchOptionsFromModule(module, { search = "", id = "" } = {}) {
      return new Promise(resolve => {

         const moduleKey = String(module + '-' + search + (id ? 'query' : ''))

         //Funções para checar
         const isModuleCached = () => !!this.modules[moduleKey]
         const isBeingRequested = () => !!this.modulesRequests[moduleKey]

         //Quando der sucesso
         const onSuccess = (response) => {
            try {

               const result = JSON.parse(response)
               const options = (result.options ?? [])

               if (!isModuleCached()) this.modules[moduleKey] = options

               resolve(options)

            } catch (error) {

               console.error(error);
               resolve([])

            }
         }

         //Caso o módulo estiver sendo requisitado
         if (isBeingRequested()) {

            //Fica checando em 100 em 100 ms para ver se a resposta chegou e retorna caso chegou
            //Limpa o intervalo
            const interval = setInterval(() => {
               if (!isModuleCached()) return

               resolve(this.modules[moduleKey])
               clearInterval(interval)

            }, 100)

         } else {

            //Adicionando módulo na lista de requests
            this.modulesRequests[moduleKey] = true

            //Caso já possuir o modulo retornar imediatamente
            if (isModuleCached()) resolve(this.modules[moduleKey])


            //Fazendo a requisição do módulo
            new AsyncTask({

               url: DEFAULT_SELECT_URL,
               type: "POST",
               params: {
                  module,
                  filter: {
                     where: {
                        ...(search && { search }),
                        ...((typeof id === 'string' && id) ? { id } : {})
                     }
                  }
               },
               onSuccess: (response) => onSuccess(response)

            }).execute()
         }
      })
   }

   setValue(value) {
      this.config.value = value
   }

   /**
    * Busca os valores dos inputs isQuery
    */
   fetchIsQueryValues() {
      const selectModuleIpts = this.getAllInputsByType('select_module')
      const isQueryIpts = selectModuleIpts.filter(input => !!input.isQuery)

      isQueryIpts.forEach(input => {
         const allValues = this.getAllValuesFromName(input.name)
         const inputModule = input.module
         const nonNullValues = allValues.filter(value => value !== null && value !== undefined)

         if (!inputModule) return
         if (!allValues.length) return

         this.fetchOptionsFromModule(inputModule, { id: nonNullValues.join(',') })
      })
   }

   /**
    * Decide o que vai ser colocado na label de um item do footer 
    */
   getFooterLabel(label, name) {

      let labelToUse = null
      let datatypeToUse = label?.datatype

      if (!label) {
         labelToUse = ''
      }

      if (typeof label === 'string') {
         labelToUse = label
      }

      if (typeof label === 'object') {
         labelToUse = parseFormula(label.formula, this.getArrayValues())
      }

      if (name) {
         this.footerValues[name] = labelToUse
      }

      return datatypeToUse
         ? formatValue(labelToUse, datatypeToUse)
         : labelToUse
   }

   /**
    * Cria um item do footer 
    */
   createFooterItem({
      name,
      label,
      align,
      bold = false,
      color
   }) {
      const footerItem = new P('ckl-ft-it')
      const textToUse = this.getFooterLabel(label, name)

      footerItem.append(textToUse)
      footerItem.css('text-align', align ?? '')
      footerItem.css('color', color ?? '')
      footerItem.css('font-weight', bold ? 'bold' : '')

      return footerItem
   }

   /**
    * Atualiza o footer
    */
   updateFooter() {
      if (!this.config.footer.length) {
         this.inputFooter.remove()
         return
      }

      const footerColumns = this.config.footer.map((item) => this.createFooterItem(item))

      if (this.config.sortable) footerColumns.unshift(new Div())
      if (this.hasDeleteButton()) footerColumns.push(new Div())

      this.inputFooter.empty()
      this.inputFooter.append(footerColumns)
      this.handleFooterSyncWithForm()
   }

   /**
    * Pega os ultimos valores do footer e passa para os items do formulário 
    */
   handleFooterSyncWithForm() {
      this.config.syncFooterWithFormFields.forEach(field => {

         const formInput = this.getForm().getFieldByName(field.name)
         const footerValue = this.footerValues[field.name]

         if (!formInput) return

         formInput.setValue(footerValue)

      })
   }

   /**
    * Retorna um objeto na onde as chaves são a propriedade de um input e o valor é um array com o valor de todas as linhas 
    */
   getArrayValues() {
      const arrayValues = {}
      const valueEntries = this.config.value.map(row => Object.entries(row))

      valueEntries.forEach(rowEntry => {
         rowEntry.forEach(([key, value]) => {

            if (this.isCheckListProp(key)) return
            if (!arrayValues[key]) arrayValues[key] = []

            const input = this.getInputByName(key)
            const maskType = input?.validate?.type
            const valueToPush = maskType ? sanitize(value, maskType) : value

            arrayValues[key].push(valueToPush)

         })
      })

      return arrayValues
   }

   /**
    * Retorna todos os valores de um input 
    */
   getAllValuesFromName(name) {
      return this.config.value.map(row => row[name])
   }


   /**
    * Cria um input que pode realizar upload de imagens
    */
   createImageUploadInput({
      name,
      value,
      readonly,
      cropper = true,
      maxSize = 5,
      iconSize = 20,
      icon = 'image',
      path,
      storage,
      fileName = 'image',
      aspectRatio = '1/1',
      optimize = true,
      extensions = ['jpg', 'jpeg', 'gif', 'webp', 'png', 'svg'],
      rowIndex,
      inputIndex
   }) {

      const inputWrapper = new Label('ckl-ipts-row-ipt')
      const uploadInput = new Div('ckl-ipts-row-ipt-upld')
      const removeImageBtn = new Div('ckl-ipts-row-ipt-upld-opt isRemove')
      const changeImageBtn = new Div('ckl-ipts-row-ipt-upld-opt isChange')
      const imageIcon = new Icon('ckl-ipts-row-ipt-upld-ic')

      //Estado
      let currentImage = value ?? null
      let imageToken = crypto.randomUUID()

      //Retorna o nome do bucket de acordo com a url da storage
      const getBucketName = () => {
         return this.config.storages[storage ?? 'default'].split('/').filter(Boolean).pop()
      }

      //Retorna o susposto caminho que foi uploadado o arquivo
      const getCloudPath = () => {
         return this.config.storages[storage ?? 'default'] + currentImage
      }

      //Remove a imagem do preview
      const clearImage = () => {
         delete this.imagesToUpload[imageToken]
         uploadInput.css('background-image', '')
         currentImage = null
         this.setInputValue(name, null, rowIndex)
      }

      //Coloca a imagem no background
      const setImage = (image) => {

         const isBase64 = !this.isPath(image)
         const extension = mimeTypeToExtension(image.split(';')[0].split(':')[1])
         const imageToShow = isBase64 ? image : getCloudPath()

         currentImage = image
         uploadInput.css('background-image', `url(${imageToShow})`)

         if (isBase64) {
            this.imagesToUpload[imageToken] = {
               base64: image,
               from: name,
               row: rowIndex,
               storage: getBucketName(),
               optimize: optimize ?? true,
               fileName: fileName + '-' + imageToken,
               path: path,
               extension: extension
            }
         }

         this.setInputValue(name, image, rowIndex, inputIndex)
         this.handleFocus(rowIndex, inputIndex)
         this.updateFooter()
      }

      //Tenta ler o arquivo de imagem, retorna null caso não conseguir
      const readImageFile = async (file) => {
         return new Promise((resolve, reject) => {
            const fileReader = new FileReader()
            fileReader.onload = (event) => resolve(event.target.result)
            fileReader.onerror = () => resolve(null)
            fileReader.readAsDataURL(file)
         })
      }

      //Abre um modal mostrando um erro
      const openErrorModal = (title) => {
         new Modal({
            icon: 'warning',
            style: 'alert',
            size: 'small',
            content: title,
         }).show()
      }

      //Tenta remover a imagem
      const removeImage = () => {
         if (readonly) return

         if (this.isPath(currentImage)) {
            this.imagesToDelete.push({
               fileName: value.split('/').pop(),
               path: value.split('/').slice(0, -1).join('/') + '/',
               storage: getBucketName()
            })
         }

         clearImage()
      }

      //Tenta trocar a imagem, deleta a atual caso for um link
      const tryToReplaceImage = async (newImage) => {
         try {

            removeImage()
            setImage(newImage)

         } catch (error) {

            console.error(error)
            openErrorModal('Houve um erro ao buscar o<br>diretório para salvar as imagens.')

         }
      }

      //Retorna o modal com o editor dentro
      const getEditorModal = (imageEditor) => {
         const editorModal = new Modal({
            closeIcon: true,
            build: {
               divider: false,
               header: true,
               footer: true,
               content: {
                  padding: 0
               }
            },
            buttons: {
               actionButtons: [{
                  label: 'Confirmar',
                  function: () => {
                     editorModal.close()
                     tryToReplaceImage(imageEditor.getImage())
                  }
               }]
            }
         })

         editorModal.setContent(imageEditor.getView())
         editorModal.setHeader(imageEditor.getMenu())

         return editorModal
      }

      //Abre o cropper
      const openCropper = (imageAsBase64) => {
         let cropperConfig = {
            mirror: true,
            zooms: true,
            info: false,
            confirm: false,
            rotate: true,
            aspect: {
               ar169: true,
               ar43: true,
               ar11: true,
               ar23: true,
               arFree: true
            },
         }

         if (typeof cropper === 'object') {
            cropperConfig = $.extend(cropperConfig, cropper)
         }

         const imageEditor = new ImageEditor({ cropper: cropperConfig })

         imageEditor.init()
         imageEditor.setImageUrl(imageAsBase64)
         imageEditor.setImage()

         const editorModal = getEditorModal(imageEditor)

         editorModal.show()
      }

      //Lida com o import do arquivo
      const handleFileImport = async (file) => {
         const fileMegaBytes = file.size / (1024 ** 2)
         const isSmallerThanLimit = fileMegaBytes <= (maxSize ?? Number.POSITIVE_INFINITY)
         const isFileExtensionValid = extensions.includes('*') || extensions.includes(file.name.split('.').pop())

         if (!isFileExtensionValid) {
            openErrorModal('Formato de arquivo inválido.')
            return
         }

         if (!isSmallerThanLimit) {
            openErrorModal('O arquivo enviado excedeu<br>o limite de tamanho.')
            return
         }

         const imageAsBase64 = await readImageFile(file)
         const readSuccessfully = imageAsBase64 !== null

         if (!readSuccessfully) {
            openErrorModal('Não foi possível ler o arquivo.')
            return
         }

         cropper
            ? openCropper(imageAsBase64)
            : tryToReplaceImage(imageAsBase64)

         this.setError('')
      }

      //Abre o menu de importar arquivos (Caso não for readonly)
      const tryToOpenImportMenu = () => {
         if (readonly) return

         const fileInput = new Input()

         fileInput.attr('accept', extensions.map(ext => '.' + ext).join(','))
         fileInput.attr('type', 'file')
         fileInput.on('change', () => handleFileImport(fileInput[0].files[0]))
         fileInput.click()
      }

      //Configurando
      imageIcon.addClass(icon)
      uploadInput.css('aspect-ratio', aspectRatio)
      imageIcon.css('width', iconSize + 'px')
      imageIcon.css('height', iconSize + 'px')

      //Ajustando Z-index
      inputWrapper.on('mouseenter', () => inputWrapper.css('z-index', 2))
      inputWrapper.on('mouseleave', () => inputWrapper.css('z-index', ''))

      //Clique na imagem
      uploadInput.click(() => {
         if (currentImage) return
         tryToOpenImportMenu()
      })

      //Botão de trocar imagem
      changeImageBtn.click((event) => {
         event.stopPropagation()
         tryToOpenImportMenu(event)
      })

      //Botão de remover
      removeImageBtn.click((event) => {
         event.stopPropagation()
         removeImage()
      })

      //Configurando
      if (value) {
         setImage(value)
      }
      if (readonly) {
         uploadInput.addClass('isReadonly')
      }

      //Montando
      removeImageBtn.append(new Icon('trash'))
      changeImageBtn.append(new Icon('transfer'))
      inputWrapper.append(uploadInput)
      uploadInput.append(imageIcon, changeImageBtn, removeImageBtn)

      return inputWrapper
   }

   /**
    * Cria um caminho
    */
   createPath(path) {
      return path.map(subpath => {

         if (subpath.type === 'string') return subpath.value
         if (subpath.type === 'form_field') return subpath.value ?? this.form.getFieldByName(subpath.nameInput)?.getValue?.()

         return subpath.value

      }).join('/') + '/'
   }

   /**
    * Cria um input simples 
    */
   createDefaultInput({
      name,
      value,
      placeholder = '',
      type = 'text',
      tooltip,
      readonly,
      validate,
      rowIndex,
      color = 'var(--primary)',
      align = 'left',
      inputIndex,
   }) {
      const inputWrapper = new Label('ckl-ipts-row-ipt')
      const textInput = new Input('ckl-ipts-row-ipt-text')
      const inputToken = crypto.randomUUID()

      //Deteca se Enter ou Tab foram apertados
      const handleKeyDown = (event) => {
         if (readonly) return false

         const { keyPressed } = this.getKeyboardEventData(event)
         const didPressEnter = keyPressed === "ENTER"
         const didPressTab = keyPressed === "TAB"
         const didPressBackspace = keyPressed === "BACKSPACE"
         const didPressArrowUp = keyPressed === "ARROWUP"
         const didPressArrowDown = keyPressed === "ARROWDOWN"

         if (didPressArrowUp) {

            const isFirstRow = rowIndex === 0
            const rowIndexToFocus = isFirstRow ? this.config.value.length - 1 : rowIndex - 1

            this.focusInput(rowIndexToFocus, inputIndex)

         } else if (didPressArrowDown) {

            event.preventDefault()
            const isLastRow = this.isLastRow(rowIndex)
            const rowIndexToFocus = isLastRow ? 0 : rowIndex + 1
            this.focusInput(rowIndexToFocus, inputIndex)

         } if (didPressBackspace) {

            const allRowValues = this.getAllRowValues(rowIndex)
            const allStringValues = Object.values(allRowValues).filter(value => typeof value === 'string')
            const allValuesEmpty = allStringValues.every(value => value.trim() === "")
            const isFirstTextInput = this.config.inputs.findIndex(input => input.type === 'text') === inputIndex
            const isFieldEmpty = event.target.value === ""

            if (isFirstTextInput && allValuesEmpty) {

               this.deleteRow(rowIndex)
               this.init(false)
               this.focusLastRowInput(rowIndex - 1)

            } else if (isFieldEmpty && !isFirstTextInput) {

               this.focusInput(rowIndex, inputIndex - 1)

            }

            this.updateFooter()


         } else if (didPressTab) {

            event.preventDefault()
            this.isLastInput(inputIndex) ? this.focusFirstRowInput(rowIndex) : this.focusInput(rowIndex, inputIndex + 1)

         } else if (didPressEnter) {

            const isLastRow = this.isLastRow(rowIndex)
            const isLastInput = this.isLastInput(inputIndex)

            if (isLastRow && isLastInput) {
               event.preventDefault()
               if (this.config.autoAdd) {
                  this.addRow()
                  this.focusFirstRowTextInput(rowIndex + 1)
               }
               this.updateFooter()
               return
            }

            if (!isLastRow && isLastInput) {
               event.preventDefault()
               this.focusFirstRowInput(rowIndex + 1)
               this.updateFooter()
               return
            }

            this.focusInput(rowIndex, inputIndex + 1)
         }
      }

      //Quando o input é focado
      const handleFocus = () => {
         textInput.focus()
      }

      //Atualiza o valor na classe
      const handleInput = (value) => {
         if (readonly) return
         this.setInputValue(name, value, rowIndex, inputIndex)
         this.updateFooter()
         inputWrapper.removeClass('hasError')
      }

      //Caso for apenas leitura
      if (readonly) {
         inputWrapper.addClass('isReadOnly')
         textInput.attr('readonly', true)
      }

      //Caso tiver validate
      if (validate) {
         this.maskInput(textInput, validate)
      }

      //Configurando
      inputWrapper.attr('data-tooltip', tooltip)
      inputWrapper.attr('for', inputToken)
      textInput.attr('id', inputToken)
      textInput.val(String(value))
      textInput.css('color', color)
      textInput.attr('type', type)
      textInput.attr('autocomplete', 'off')
      textInput.attr('name', name)
      textInput.css('text-align', align)
      textInput.attr('placeholder', placeholder)
      textInput.on('focus', (event) => event.stopPropagation())
      textInput.on('input', ({ target }) => handleInput(target.value))
      textInput.on('keydown', (event) => handleKeyDown(event))
      inputWrapper.attr('data-input', inputIndex)
      inputWrapper.attr('data-name', name)
      inputWrapper.on('focus', (event) => handleFocus(event))
      inputWrapper.append(textInput)

      //Colocando o valor caso não possuir nenhum
      if (this.getInputValue(name, rowIndex, inputIndex) === undefined) {
         this.setInputValue(name, String(value), rowIndex, inputIndex)
      }

      if (typeof this.getInputValue(name, rowIndex, inputIndex) !== 'string') {
         this.setInputValue(name, String(value), rowIndex, inputIndex)
      }

      return inputWrapper
   }

   /**
    * Retorna caso a string se pareça com um link 
    */
   isPath(value) {
      return typeof value === 'string' && value.includes('.') && !value.includes('base64,')
   }

   /**
    * Cria um input select básico
    */
   createSelectInput({
      name,
      value,
      options = [],
      readonly,
      icon = 'down',
      rowIndex,
      inputIndex
   }) {
      const inputWrapper = new Label('ckl-ipts-row-ipt')
      const selectInput = new Div('ckl-ipts-row-ipt-sel')
      const selectText = new Div('ckl-ipts-row-ipt-sel-txt')
      const selectOptions = new Div('ckl-ipts-row-ipt-sel-mn')
      const selectIcon = new Icon(`ckl-ipts-row-ipt-sel-arr ${icon}`)

      //Retorna o valor atual, retorna o primeiro valor caso não houver
      const getValue = () => {
         const savedValue = this.getInputValue(name, rowIndex, inputIndex)

         const firstOptionValue = options[0]?.value

         return savedValue ?? value ?? firstOptionValue
      }

      //Retorna o texto atual, retorna o primeiro texto caso não houver
      const getText = () => {
         const optionSelected = options.find(opt => opt.value === getValue()) ?? options[0]

         return optionSelected?.text ?? optionSelected?.label
      }

      //Retorna a cor atual, retorna a primeira caso não tiver
      const getColor = () => {
         const optionSelected = options.find(opt => opt.value === getValue()) ?? options[0]

         return optionSelected.color
      }

      //Muda o texto do select
      const changeText = (value) => {
         selectText.text(value)
      }

      //Muda a cor da opção
      const changeColor = (color) => {
         selectText.css('color', color ?? '')
      }

      //Abre o menu do select
      const openMenu = () => {
         selectInput.addClass('isOpen')
      }

      //Fecha o menu do select
      const closeMenu = () => {
         selectInput.removeClass('isOpen')
      }

      //Altera o menu do select
      const toggleMenu = () => {
         selectInput.toggleClass('isOpen')
      }

      //Evento quando uma opção é clicada
      const handleOptionClick = (event, { text, color, value, label }) => {
         event.stopPropagation()

         changeColor(color)
         changeText(text ?? label)
         closeMenu()

         this.setInputValue(name, value, rowIndex, inputIndex)
         this.handleFocus(rowIndex, inputIndex)
         this.updateFooter()
      }

      //Cria uma opção
      const createOption = (optionData) => {
         const option = new Div('ckl-ipts-row-ipt-sel-mn-opt')
         option.text(optionData?.text ?? optionData?.label)
         option.css('color', optionData?.color ?? 'var(--primary)')
         option.click((event) => handleOptionClick(event, optionData))
         return option
      }

      //Quando o select receber foco
      const handleFocus = () => {
         this.blurAllInputs()
         openMenu()
      }


      //Escondendo o menu
      inputWrapper.on('mouseleave', () => setTimeout(() => closeMenu(), 50))

      //Eventos de clique
      selectInput.click(() => {
         if (readonly) return
         toggleMenu()
      })

      //Quando for focado
      inputWrapper.on('focus', () => {
         if (readonly) return
         handleFocus()
      })



      //Montando
      selectText.text(getText())
      inputWrapper.attr('data-input', inputIndex)
      inputWrapper.attr('data-name', name)

      //Caso não houver valor
      if (this.getInputValue(name, rowIndex, inputIndex) === undefined) {
         this.setInputValue(name, getValue(), rowIndex, inputIndex)
         changeText(getText())
         changeColor(getColor())
      }

      //Montando
      inputWrapper.append(selectInput)
      selectInput.append(selectText, selectIcon, selectOptions)
      selectOptions.append(options.map(createOption))

      return inputWrapper
   }

   /**
    * Foca um input 
    */
   focusInput(rowIndex, inputIndex) {
      this.inputsList.children(`[data-row=${rowIndex}]`).children(`[data-input=${inputIndex}]`).focus()
   }

   /**
    * Foca o primeiro input de uma linha
    */
   focusFirstRowInput(rowIndex) {
      this.inputsList.children(`[data-row=${rowIndex}]`).children(`[data-input=0]`).focus()
   }

   /**
    * Foca o ultimo input de uma linha
    */
   focusLastRowInput(rowIndex) {
      this.inputsList.children(`[data-row=${rowIndex}]`).children(`[data-input=${this.config.inputs.length - 1}]`).focus()
   }

   /**
    * Foca o primeiro input de texto de uma linha
    */
   focusFirstRowTextInput(rowIndex) {
      const firstTypeTextIndex = this.config.inputs.findIndex(input => !['checkbox', 'select'].includes(input.type))
      const hasTextinput = firstTypeTextIndex > -1

      if (!hasTextinput) {
         this.focusFirstRowInput(rowIndex)
         return
      }

      this.focusInput(rowIndex, firstTypeTextIndex)
   }

   /**
    * Aplica uma máscara em um input 
    */
   maskInput(input, validate) {
      if (!validate.type) return

      if (validate.type === 'percent') {
         input.mask('##0,00%', { reverse: true });
         return
      }

      const validationType = this.getValidation(JSON.parse(JSON.stringify(validate)))
      const useInputMask = validationType.maskAPI === API_INPUTMASK

      if (!validationType) {
         console.warn(`(Check List) Não foi encontrado a validação '${validate?.type ?? validate}'`)
         return
      }

      if (!validationType.mask) {
         console.warn(`(Check List) Não foi encontrado a máscara '${validate?.type ?? validate}'`)
         return
      }

      input.unmask()
      input.inputmask('remove')

      setTimeout(() => $(input)[useInputMask ? 'inputmask' : 'mask'](validationType.mask, validationType.maskOptions))
   }

   /**
    * Retorna se uma linha é a última no layout 
    */
   isLastRow(rowIndex) {
      return this.config.value.length === rowIndex + 1
   }

   setError(error) {
      this.errorContainer.html(error)
      this.errorContainer.attr("title", error)
   }

   /**
    * Retorna uma validação
    */
   getValidation() {

   }

   /**
    * Retorna se um input é a ultima de sua linha 
    */
   isLastInput(inputIndex) {
      return this.config.inputs.length === inputIndex + 1
   }

   /**
    * Retorna todos os valores de uma linha 
    */
   getAllRowValues(rowIndex) {
      return this.config.value[rowIndex]
   }

   /**
    * Retorna os dados de um evento de teclado 
    */
   getKeyboardEventData(event) {
      return {
         keyPressed: event.key.toUpperCase(),
         isHoldingKey: event.repeat,
         isShiftPressed: event.shiftKey,
         isCtrlPressed: event.ctrlKey,
         isAltPressed: event.altKey
      }
   }

   /**
    * Cria um input de checkbox
    */
   createCheckBoxInput({
      name,
      value,
      readonly,
      rowIndex,
      inputIndex,
      icon = 'check',
      color = 'var(--success)'
   }) {
      const inputWrapper = new Div('ckl-ipts-row-ipt')
      const inputLabel = new Label('ckl-ipts-row-ipt-ckb-lbl')
      const inputCheck = new Input('ckl-ipts-row-ipt-ckb')
      const inputIcon = new Icon(`ckl-ipts-row-ipt-ckb-i ${icon}`)
      const inputToken = crypto.randomUUID()

      //Tratamenos para o CSV
      if (value === 'true') this.setInputValue(name, true, rowIndex)
      if (value === 'false') this.setInputValue(name, false, rowIndex)

      //Quando for clicado
      const handleClick = (event) => {
         event.preventDefault()

         if (readonly) return

         const currentValue = this.getInputValue(name, rowIndex, inputIndex)
         const isActive = Boolean(currentValue)

         this.setInputValue(name, !isActive, rowIndex, inputIndex)
         this.handleFocus(rowIndex, inputIndex)
         this.updateFooter()

         inputCheck.prop('checked', !isActive)
         inputWrapper.removeClass('hasError')
      }

      //Quando for focado
      const handleFocus = (event) => {
         event.stopPropagation()
         inputCheck.focus()
      }

      //Configurando
      inputWrapper.attr('for', inputToken)
      inputCheck.attr('id', inputToken)
      inputCheck.prop('checked', Boolean(value))
      inputCheck.attr('name', name)
      inputCheck.attr('type', 'checkbox')
      inputWrapper.attr('data-name', name)
      inputLabel.css('--checkbox-color', color)

      //Eventos
      inputWrapper.on('focus', (event) => handleFocus(event))
      inputLabel.click((event) => handleClick(event))

      //Colocando valor caso não possuir
      if (this.getInputValue(name, rowIndex, inputIndex) === undefined) {
         this.setInputValue(name, Boolean(value ?? false), rowIndex, inputIndex)
      }

      //Montando
      inputLabel.append(inputIcon)
      inputWrapper.append(inputCheck, inputLabel)

      return inputWrapper
   }

   /**
    * Cria um input de checkbox
    */
   createToggleInput({
      name,
      value,
      readonly,
      rowIndex,
      inputIndex,
      color = 'var(--success)'
   }) {
      const inputWrapper = new Div('ckl-ipts-row-ipt')
      const inputLabel = new Label('ckl-ipts-row-ipt-tggl-lbl')
      const inputCheck = new Input('ckl-ipts-row-ipt-tggl')
      const inputToken = crypto.randomUUID()

      //Tratamenos para o CSV
      if (value === 'true') this.setInputValue(name, true, rowIndex)
      if (value === 'false') this.setInputValue(name, false, rowIndex)

      //Quando for clicado
      const handleClick = (event) => {
         event.preventDefault()

         if (readonly) return

         const currentValue = this.getInputValue(name, rowIndex, inputIndex)
         const isActive = Boolean(currentValue)

         this.setInputValue(name, !isActive, rowIndex, inputIndex)
         this.handleFocus(rowIndex, inputIndex)
         this.updateFooter()

         inputCheck.prop('checked', !isActive)
         inputWrapper.removeClass('hasError')
      }

      //Quando for focado
      const handleFocus = (event) => {
         event.stopPropagation()
         inputCheck.focus()
      }

      //Configurando
      inputWrapper.attr('for', inputToken)
      inputCheck.attr('id', inputToken)
      inputCheck.prop('checked', Boolean(value))
      inputCheck.attr('name', name)
      inputCheck.attr('type', 'checkbox')
      inputWrapper.attr('data-name', name)
      inputLabel.css('--toggle-color', color)

      //Eventos
      inputWrapper.on('focus', (event) => handleFocus(event))
      inputLabel.click((event) => handleClick(event))

      //Colocando valor caso não possuir
      if (this.getInputValue(name, rowIndex, inputIndex) === undefined) {
         this.setInputValue(name, Boolean(value ?? false), rowIndex, inputIndex)
      }

      //Montando
      inputWrapper.append(inputCheck, inputLabel)

      return inputWrapper
   }

   /**
    * Tenta criar uma nova linha respeitando o número máximo de linhas
    */
   addRow() {
      if (this.config.readonly) return

      const curRowsNumber = this.config.value.length
      const maxRowNumber = this.config.validate.max ?? Number.POSITIVE_INFINITY

      if (curRowsNumber + 1 > maxRowNumber) {
         this.setError(`Você atingiu o limite máximo de ${maxRowNumber} linha${maxRowNumber > 1 ? 's' : ''}.`)
         return
      }

      const newRowInputs = this.getInputs().map(input => ({ ...input, value: input.default }))
      const newRowIndex = this.getRowsAmount()
      const newRow = this.createRow(newRowInputs, newRowIndex)

      this.inputsList.append(newRow)
      this.setValue(this.config.value)
   }

   /**
    * Retorna todos os inputs que são daquele tipo 
    */
   getAllInputsByType(type) {
      return this.config.inputs.filter(input => input.type === type)
   }

   /**
    * Retorna o input por sua chave 
    */
   getInputByName(name) {
      return this.config.inputs.find(input => input.name === name)
   }

   /**
    * Tenta criar uma nova linha 
    */
   deleteRow(rowIndex, skipMessage = false) {
      if (!this.config.delete) return

      //Pegando as chaves na linha que possue um link uploadado
      const inputsThatUpload = [...this.getAllInputsByType('file_upload'), ...this.getAllInputsByType('image')]
      const uploadInputNames = inputsThatUpload.map(input => input.name)
      const curRowUploadedNames = uploadInputNames.filter(name => this.isPath(this.getInputValue(name, rowIndex)))

      //Callback para realmente remover os uploads e deletar alinha
      const deleteRowAndFiles = (warningModal) => {
         const allUploadUrls = curRowUploadedNames.map(name => this.getInputValue(name, rowIndex))

         this.filesToDelete.push(...allUploadUrls.map((link, index) => ({

            fileName: this.getFullFileNameFromURL(link),
            path: this.getOnlyPathFromURL(link),
            storage: this.getBucketNameFromStorage(this.getInputByName(curRowUploadedNames[index].storage))

         })))

         this.deleteRow(rowIndex, true)
         this.init(false)

         warningModal.close()
      }

      //Caso houver links uplodados e a mensagem ainda não foi mostrada mostra o modal, do contrário exclui direto
      if (curRowUploadedNames.length && skipMessage === false) {
         const warningModal = new Modal({
            icon: 'warning',
            style: 'alert',
            size: 'small',
            content: "Parece que esta linha possui arquivos salvos na nuvem,<br> ao prosseguir os mesmos serão deletados. Continuar?",
            buttons: {
               actionButtons: [{
                  label: 'Confirmar',
                  function: () => deleteRowAndFiles(warningModal)
               }]
            }
         })
         warningModal.show()
         return
      }

      //Deletando a linha por fim
      this.inputsList.children(`[data-row=${rowIndex}]`).remove()
      this.config.value.splice(rowIndex, 1)
      this.setError('')
      this.setValue(this.config.value)
   }

   /**
    * Retorna o nome do arquivo de uma extensão com url 
    */
   getFullFileNameFromURL(url) {
      return url.split('/').pop()
   }

   /**
    * Retorna o nome do bucket por uma url base
    */
   getBucketNameFromStorage(storage) {
      return this.config.storages[storage ?? 'default'].split('/').filter(Boolean).pop()
   }

   /**
    * Retorna o nome do arquivo de uma url 
    */
   getFileNameFromURL(url) {
      return url.split('/').pop().split('.').slice(0, -1)
   }

   /**
    * Retorna uma extensão de um arquivo 
    */
   getExtensionFromURL(url) {
      return url.split('.').pop()
   }

   /**
    * Retorna o caminho de um URL
    */
   getOnlyPathFromURL(url) {
      return url.split('/').slice(0, -1).join('/') + '/'
   }

   /**
    * Retorna o número de registros 
    */
   getRowsAmount() {
      return (this.config.value ?? []).length
   }

   /**
    * Sobreescreve o método de validação
    * Valida se o número mínimo e máximo de campos foi respeitado
    */
   validate() {
      const errorMessages = []

      const isEveryFieldValid = this.areFieldsValid()
      const isRespectingMin = this.getRowsAmount() >= (this.config.validate.min ?? Number.NEGATIVE_INFINITY)
      const isRespectingMax = this.getRowsAmount() <= (this.config.validate.max ?? Number.POSITIVE_INFINITY)
      const isFetchingStorages = this.isFetchingStorages

      const isValid = isRespectingMin && isRespectingMax && isEveryFieldValid && !isFetchingStorages

      //Adicionando as mensagens de erro
      if (!isRespectingMax) errorMessages.push(`Limite máximo excedido (${this.config.validate.max} linhas).`)
      if (!isRespectingMin) errorMessages.push(`Limite mínimo não atingido (${this.config.validate.min} linhas).`)
      if (!isEveryFieldValid) errorMessages.push(`Campos obrigatórios não preenchidos ou inválidos.`)
      if (isFetchingStorages) errorMessages.push(`Aguarde um momento, estamos buscando o diretório para salvar seus arquivos.`)

      //Adicionando/retirando mensagem de erro
      if (errorMessages.length) {
         this.setError(errorMessages.join(' '))
         this.highlightInvalidFields()
      } else {
         this.setError('')
      }

      return isValid
   }

   /**
    * Deixa em vermelho o placeholder de campos inválidos
    */
   highlightInvalidFields() {
      this.getAllRowsValidations().forEach(row => {
         row.forEach(validation => {
            if (!validation.valid) {

               this.inputsList.children(`[data-row=${validation.row}]`).children(`[data-name=${validation.name}]`).addClass('hasError')

            }
         })
      })
   }

   /**
    * Retorna se os campos 
    */
   areFieldsValid() {
      const allRowsValidation = this.getAllRowsValidations()
      const everyRowIsValid = allRowsValidation.flat(1).every(validation => !!validation.valid)

      return everyRowIsValid
   }

   /**
    * Retorna a validação de todas as linhas 
    */
   getAllRowsValidations() {
      return this.getClonedValue().map((row, rowIndex) => {
         return this.getRowValidation(row, rowIndex)
      })
   }

   /**
    * Retorna a validação de todas as linhas 
    */
   getRowValidation(row, rowIndex) {
      return this.getInputs().map(input => {

         const rowValue = row[input.name]
         const inputValidation = {
            valid: true,
            name: input.name,
            row: rowIndex,
            value: rowValue
         }

         //Se o input for ignore ele ignora 
         if (this.shouldIgnore(input)) {
            return inputValidation
         }

         //Se o input for required ele não passa pela validação 
         if (!this.isRequired(input)) {
            return inputValidation
         }

         //Caso o input for required e não possuir valor
         if (this.isRequired(input) && [null, undefined, ""].includes(rowValue)) {
            inputValidation.valid = false
            inputValidation.failed = 'required'
         }

         //Pegando a a validação
         const validation = {}

         //Validação de Regex
         if (validation.regexJS) {
            const regex = new RegExp(validation.regexJS, 'i')
            const isValid = regex.test(String(rowValue ?? ""))

            if (!isValid) {

               inputValidation.valid = false
               inputValidation.failed = validation.regexJS

            }
         }

         //Validação de funciontJS
         if (validation.functionJS) {
            try {

               if (!window[validation.functionJS](rowValue)) {
                  inputValidation.valid = false
                  inputValidation.failed = validation.functionJS
               }

            } catch (error) {

               ui.showError({ errorMessage: error })
               inputValidation.valid = false
               inputValidation.failed = 'error'

            }
         }

         return inputValidation
      })
   }

   /**
    * Retorna todos os inputs que são required
    */
   isRequired(input) {
      return (input.validate) && (input.validate.required === true)
   }

   /**
    * Retorna todos os inputs do Check_List
    */
   getInputs() {
      return this.config.inputs
   }

   /**
    * Salva as imagems que precisam ser salvas no bucket
    */
   async saveAllImagesOnCloud() {
      const hasSomeImageToSave = Object.keys(this.imagesToUpload).length

      if (!hasSomeImageToSave) return

      const imagesToSave = Object.values(this.imagesToUpload)
      const allRequests = Promise.all(imagesToSave.map(imageData => this.saveImageOnCloud(imageData)))

      return allRequests
   }

   /**
    * Deleta todas as imagems que foram removidas do check-list e estava uploadadas na nuvem 
    */
   async deleteRemovedImagesOnCloud() {
      const hasSomeImageToDelete = this.imagesToDelete.length

      if (!hasSomeImageToDelete) return

      const allDeleteRequests = Promise.all(this.imagesToDelete.map(imageData => this.deleteImageOnCloud(imageData)))

      return allDeleteRequests
   }

   /**
    * Deleta uma imagem da nuvem 
    */
   async deleteImageOnCloud({ fileName, path, storage }) {
      try {

         return await this.callCheckListAPI({
            action: 'deleteFile',
            fileName,
            path,
            storage
         })


      } catch (error) {

         console.error(error)
         console.log(`Erro ao apagar imagem: ${fileName}`)

      }
   }

   /**
    * Salva todos os aruivos na nuvem 
    */
   async saveAllFilesOnCloud() {
      const hasFileToSave = Object.keys(this.filesToUpload).length

      if (!hasFileToSave) return

      const filesToSave = Object.values(this.filesToUpload)
      const allRequests = Promise.all(filesToSave.map(fileData => this.saveFileOnCloud(fileData)))

      return allRequests
   }

   /**
    * Deleta todas os arquivos removeidos do check-list da nuvem 
    */
   async deleteRemovedFilesOnCloud() {
      const hasFileToDelete = this.filesToDelete.length

      if (!hasFileToDelete) return

      const allDeleteRequests = Promise.all(this.filesToDelete.map(fileData => this.deleteFileFromCloud(fileData)))

      return allDeleteRequests
   }

   /**
    * Deleta um arquivo da nuvem 
    */
   async deleteFileFromCloud({ path, fileName, storage }) {
      try {

         return await this.callCheckListAPI({
            action: 'deleteFile',
            fileName,
            path,
            storage
         })

      } catch (error) {

         console.error(error)
         console.log(`Erro ao deletar arquivo: ${fileName}`)

      }
   }

   /**
    * Chama a api para salvar uma imagem na nuvem 
    */
   async saveImageOnCloud({ fileName, base64, optimize, storage, path }) {
      try {

         return await this.callCheckListAPI({
            path: this.createPath(path).slice(0, -1).split('/').map((subpath) => ({ type: 'string', value: subpath })),
            action: 'saveFile',
            isImage: true,
            optimize: optimize,
            storage,
            fileName,
            base64,
         })

      } catch (error) {

         console.error(error)
         console.log(`Erro ao salvar a imagem: ${fileName}`)

      }
   }

   /**
    * Chama a api para salvar uma imagem na nuvem 
    */
   async saveFileOnCloud({ fileName, base64, path, extension, storage }) {
      try {

         return await this.callCheckListAPI({
            action: 'saveFile',
            path: this.createPath(path).slice(0, -1).split('/').map((subpath) => ({ type: 'string', value: subpath })),
            isImage: false,
            optimize: false,
            storage,
            fileName,
            extension,
            base64,
         })

      } catch (error) {

         console.error(error)
         console.log(`Erro ao salvar o arquivo: ${fileName}`)

      }
   }

   /**
    * Chama a api do checklist 
    */
   async callCheckListAPI(body) {
      return await fetch(DEFAULT_CHECK_LIST_URL, {
         method: "POST",
         cache: 'no-store',
         body: JSON.stringify(body)
      })
         .then(res => res.json())
         .then(res => res.result)
   }

   /**
    * Retorna se deve ignorar um input
    */
   shouldIgnore(input) {
      return !!input.ignore
   }

   /**
    * Retorna se deve sanetizar um input
    */
   shouldSanitize(input) {
      return !!input.datatype
   }

   /**
    * Retorna o valor do CheckList clonado 
    */
   getClonedValue() {
      return JSON.parse(JSON.stringify(this.config.value))
   }

   /**
    * Retorna se a propriedade de uma linha é do próprio CheckList
    */
   isCheckListProp(prop) {
      return [

         'id'

      ].includes(prop)
   }

   /**
    * Retorna todas as chaves de uma linha 
    */
   getRowNames(row) {
      return Object.keys(row)
   }

   /**
    * Retorna o valor da check-list com o formato de export passado no config
    */
   getValue() {

      const valueToReturn = this.getClonedValue()

      valueToReturn.forEach((row, rowIndex) => {
         this.getRowNames(row).forEach(name => {

            //Caso for uma propriedade do CheckList ou o input não existir mais não fazer nada
            if (this.isCheckListProp(name)) return
            if (!this.getInputByName(name)) return

            //O input que pertence a esta chave
            const input = this.getInputByName(name)

            //Verificando se há uma imagem/arquivo que pertence a esta linha e input 
            const imageToUpload = Object.values(this.imagesToUpload).find(image => (image.row === rowIndex) && (image.from === name))
            const fileToUpload = Object.values(this.filesToUpload).find(file => (file.row === rowIndex) && (file.from === name))

            //Muda o valor do input para o caminho futuro da imagem
            if (imageToUpload) {
               const pathToUse = this.createPath(imageToUpload.path)
               const extensionToUse = imageToUpload.optimize ? 'webp' : imageToUpload.extension

               row[name] = `${pathToUse}${imageToUpload.fileName}-1.${extensionToUse}`
            }

            //Muda o valor do input para o caminho futuro do arquivo
            if (fileToUpload) {
               const pathToUse = this.createPath(fileToUpload.path)
               const extensionToUse = fileToUpload.extension

               row[name] = `${pathToUse}${fileToUpload.fileName}-1.${extensionToUse}`
            }

            //Sanetizando os valores que precisam
            if (this.shouldSanitize(input)) {
               row[name] = sanitize(row[name], input.datatype)
            }

            //Deletar caso deva ignorar
            if (this.shouldIgnore(input)) {
               delete row[name]
            }

         })
      })

      //Caso for salvar como JSON
      if (this.config.save === 'json') {

         return JSON.stringify(valueToReturn)

      }

      //Caso for salvar como CSV
      if (this.config.save === 'csv') {

         return Array(this.config.value.length).fill([...this.config.inputs]).map((row, rowIndex) => {
            return row.map(input => {

               return valueToReturn[rowIndex][input.name] ?? ""

            }).join(',')
         }).join('\n')

      }
   }

   /**
    * Retorna o container do input
    */
   getView() {
      return this.inputContainer;
   }
}