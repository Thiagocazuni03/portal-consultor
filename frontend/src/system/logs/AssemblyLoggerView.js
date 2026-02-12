import { AssemblyLogger } from './AssemblyLogger.js'

/**
 * Cria a vsualização de um log
 * @author Fernando Petri
 */
export class AssemblyLoggerView {

   /**
    * Qual emoji vai para cada tipo
    */
   static #LOG_TYPE_EMOJIS = Object.freeze({
      [AssemblyLogger.ACTIONS.ACTION]: '➖',
      [AssemblyLogger.ACTIONS.CONFIRM]: '✅',
      [AssemblyLogger.ACTIONS.CANCEL]: '❌',
      [AssemblyLogger.ACTIONS.PROHIBITED]: '🚫',
   })

   #content
   #logger

   /**
    * Instânciando a classe
    * @param {AssemblyLogger} logger O logger 
    */
   constructor(logger) {
      if (!logger) {
         throw new Error('Não é possível criar a visualização de um log nulo')
      }

      this.#logger = logger
      this.#content = []
   }

   /**
    * Constrói a visualização
    */
   build() {
      this.#setupInformationSection()
      this.#setupAssemblyStepsSection()
   }

   /**
    * Baixa o log no computador do usuário
    */
   download() {
      const blob = new Blob([this.#getFinalContent()], {
         type: 'text/markdown' 
      })

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = url
      anchor.download = 'README.md'
      anchor.click()

      URL.revokeObjectURL(url)
   }

   /**
    * Define a seção de informações
    */
   #setupInformationSection() {
      const title = '# Sobre'
      const details = [
         `**Produto**: ${this.#logger.getProduct()} <br>`,
         `**Aberto em**: ${new Date(this.#logger.getDate()).toLocaleString('pt-BR')} <br>`,
         `**Problema**: ${this.#logger.getDescription()} <br>`
      ]

      this.#content.push(title, ...details)
   }

   /**
    * Define a seção de passos
    */
   #setupAssemblyStepsSection() {
      const title = '# Montagem'
      const steps = this.#logger.getLogs().map(log => this.#createLogDetails(log))

      this.#content.push(title, ...steps)
   }

   /**
    * Cria os detalhes de um log
    * @param {object} log Os detalhes do log
    * @returns {string} Os dados como texto
    */
   #createLogDetails({ content, type }) {
      const emoji = AssemblyLoggerView.#LOG_TYPE_EMOJIS[type]
      const message = content

      return `${emoji} - ${message} <br>`
   }

   #getFinalContent(){
      return this.#content.join('\n')
   }
}