import Tab from '../../components/Tab.js'
import Modal from '../../core/Modal.js'
import Renderer from '../../core/Renderer.js'
import { AssemblyLogger } from '../../system/logs/AssemblyLogger.js'
import { AssemblyLoggerStorage } from '../../system/logs/AssemblyLoggerStorage.js'
import { AssemblyLoggerView } from '../../system/logs/AssemblyLoggerView.js'
import { Logger } from '../../system/logs/Logger.js'
import { Div, Icon } from '../../utils/Prototypes.js'

export default class OldLogsTab extends Tab {
   constructor(config) {
      super({
         title: 'Logs Salvos',
         desc: 'Veja os seus logs salvos nesta sessão.',
         hasFooter: false,
         ...config
      })

      //Pegando os logs
      const savedLogs = AssemblyLoggerStorage
         .getLogs()
         .map(logData => new AssemblyLogger(logData))


      //Render de logs
      this.logsRender = new Renderer({
         css: 'isTabRender',
         items: savedLogs,
         rowGap: '1rem',
         messageOnEmpty: 'Parece que você não possui nenhum log registrado',
         createFunc: (logger, index) => this.createLogPreview(logger, index),
         sortFunc: (items) => items.sort((itemA, itemB) => itemB.getDate() - itemA.getDate())
      })

      //Caso não houver logs mostre a mensagem de vazio
      if (savedLogs.length === 0) {
         this.logsRender.setItems([])
      }

      //Botão de excluir todas logs
      this.deleteLogsBtn = new Icon('SP__header__options__icon ic-trash')
      this.deleteLogsBtn.click(() => this.openDeleteLogsModal())

      this.prependToOptions(this.deleteLogsBtn)
      this.appendToContent(this.logsRender.getView())
   }

   /**
    * Cria um preview de um log
    * @param {AssemblyLogger} logger O logger 
    */
   createLogPreview(logger) {
      const logWrapper = new Div('SP__log')
      const logInfo = new Div('SP__log__info')
      const logDescription = new Div('SP__log__info__desc')
      const logTitle = new Div('SP__log__info__title')
      const logDownload = new Icon('SP__log__download')

      logTitle.text(logger.getProduct())
      logDescription.append('Teste')
      logDownload.addClass('ic-upload')
      logDescription.text(`Iniciado em ${new Date(logger.getDate()).toLocaleString('pt-BR').split(', ').join(' às ')}`)
      logInfo.append(logTitle, logDescription)
      logWrapper.append(logInfo, logDownload)
      logDownload.click(() => this.tryToDownloadLog(logger))


      return logWrapper
   }

   /**
    * Tenta baixar um log
    * @param {AssemblyLogger} logger O logger
    */
   tryToDownloadLog(logger){
      const logView = new AssemblyLoggerView(logger)

      logView.build()
      logView.download()
   }

   /**
    * Abre o modal para confirmar o delete de todos os logs
    */
   openDeleteLogsModal() {
      new Modal({
         title: 'Excluir Logs?',
         autoOpen: true,
         icon: 'ic-warning',
         color: 'var(--red)',
         message: 'Isso excluirá __todos__ os logs. Essa ação é __irreversível__.',
         buttons: [{
            type: 'blank',
            text: 'Cancelar'
         }, {
            type: 'filled',
            color: 'var(--red)',
            text: 'Excluir',
            onClick: () => {
               localStorage.removeItem(Logger.STORAGE_KEY)
               this.logsRender.setItems([])
            }
         }]
      })
   }
}