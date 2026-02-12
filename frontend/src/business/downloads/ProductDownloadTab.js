import { Div, H3, P, Img, Icon } from '../../utils/Prototypes.js'
import Tab from '../../components/Tab.js'
import { STORAGE_URL } from '../../api/Variables.js'

export default class ProductDownloadTab extends Tab {
   constructor(config) {
      super({ ...config, hasFooter: false })

      //Configurações base
      this.header.addClass('isProductPreview')
      this.title.remove()
      this.desc.remove()
      this.leftButton.remove()
      this.rightButton.remove()

      //Parte dos downloads
      this.productData = this.config.productData
      this.downloadsGrid = new Div('SP__downloads')

      //Inicializando
      this.appendToHeader()
      this.fetchAndCreateDownloads()
      this.appendToContent(this.downloadsGrid)
   }

   async fetchAndCreateDownloads() {
      const prodDownloads = await this.fetchProductDownloads()
      const downloadNodes = prodDownloads.map(this.createDownload.bind(this))

      this.downloadsGrid.append(downloadNodes)
   }

   async fetchProductDownloads() {
      try {

         const BASE_URL = STORAGE_URL
         const URL_SUFFIX = this.productData.id + '.json'
         const downloadRequest = await fetch(BASE_URL + URL_SUFFIX)
         const downloadsJSON = await downloadRequest.json()
         return downloadsJSON

      } catch (error) {
         return []
      }
   }

   createDownload({ title, URL }) {

      const fileExtension = URL.split('.').pop()
      const iconsExtensions = 'ai,audio,cdr,doc,handler,pdf,video,xml,xls,psd,json,eps,csv'.split(',')
      const iconToUse = iconsExtensions.includes(fileExtension) ? fileExtension : 'blank'

      const downloadWrapper = new Div('SP__file')
      const downloadIcon = new Icon('SP__file__icon')
      const downloadTitle = new H3('SP__file__title')
      const downloadDesc = new H3('SP__file__desc')
      const downloadButton = new Icon('SP__file__download')

      downloadTitle.text(title)
      downloadIcon.addClass(`ic-file-${iconToUse}`)
      downloadDesc.text('Arquivo ' + fileExtension)
      downloadButton.addClass('ic-export')
      downloadButton.click(() => window.open(STORAGE_URL + URL))
      downloadWrapper.append(downloadIcon, downloadTitle, downloadDesc, downloadButton)

      return downloadWrapper
   }
}
