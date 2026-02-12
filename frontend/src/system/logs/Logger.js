/**
 * Classe responsável por resgistrar uma ação do usuário
 * @author Fernando Petri
 */
export class Logger {

   #id
   #date
   #logs

   /**
    * Instância a classe
    */
   constructor({ 
      id = crypto.randomUUID(), 
      date = Date.now(), 
      logs = []
   }) {
      this.#id = id
      this.#date = date
      this.#logs = logs
   }

   /**
    * Adiciona um log
    * @param {object} logData Os dados do novo log
    */
   addLog(logData = {}) {
      this.#logs.push(logData)
   }

   /**
    * Retorna o identificador do log
    * @returns {string} Um UUID 
    */
   getId(){
      return this.#id
   }

   /**
    * Retorna a data que o log foi criado
    * @returns {number} O número Epoch
    */
   getDate(){
      return this.#date
   }

   /**
    * Retorna a lista de logs registrados por este logger
    * @returns {object[]} A lista de logs
    */
   getLogs(){
      return this.#logs
   }

   

   // /**
   //  * Atualiza o valor do log na storage
   //  */
   // updateSavedLog(){
   //    const savedLogs = localStorage.getItem(Logger.STORAGE_KEY)
   //    const parsedLogs = JSON.parse(savedLogs ?? '{}')
      
   //    //Modificando
   //    parsedLogs[this.#id] = {
   //       product: this.product,
   //       logs: this.logs,
   //       addons: this.sections,
   //       description: this.description,
   //       createdAt: this.createdAt
   //    }
      
   //    localStorage.setItem(Logger.STORAGE_KEY, JSON.stringify(parsedLogs))
   // }
   
   // setDescription(description) {
   //    this.description = String(description)
   // }

   // addSection(section) {
   //    this.sections.push(section)
   // }

   // getAsText() {
   //    const header = this.getHeader()
   //    const body = this.getBody()
   //    const addons = this.getSections()


   //    return [...header, ...body, ...addons].join('\n')
   // }

   // getBody(){
   //    if(this.logs.length === 0) return [
   //       '## Montagem',
   //       'Não inicou a montagem.'
   //    ]

   //    const allLogs = [...this.logs]
   //    const formatedLogs = allLogs.map((log) => `${Logger.highlight(log.time, '#000000')} - ${this.getEmoji(log.type)} - ${log.message}`)
   //    const logsAsDiv = formatedLogs.map(log => `<div style='margin-bottom: 0.25rem'>${log}</div>`)

   //    return [
   //       '## Montagem',
   //       ...logsAsDiv,
   //       ''
   //    ]
   // }

   // getHeader() {
   //    return [
   //       `# ${this.#id}`,
   //       '',
   //       '## Detalhes',
   //       `- Descrição do problema: ${this.description || 'Sem descrição'}`,
   //       `- Produto: ${Logger.highlight(this.product, Logger.COLORS.SPECIAL)}`,
   //       `- Abertura do produto: ${Logger.highlight(this.createdAt, Logger.COLORS.TIME)}`,
   //       `- Quantidade de registros: ${Logger.highlight(this.logs.length, Logger.COLORS.NUMBER)}`,
   //       `- Edição: ${Logger.highlight(!!Session.get('currentProductToken'), Logger.COLORS.COMPONENT)}`
   //    ]
   // }

   // getSections(){
   //    return this.sections.flatMap(({ title, text }) => [
   //       `## ${title}`,
   //       text
   //    ])
   // }


   // getEmoji(type) {
   //    return {
   //       1: '🔹',
   //       2: '❌',
   //       3: '✅',
   //       4: '🚫',
   //    }[type]
   // }

   // download() {
   //    const link = document.createElement('a')
   //    const content = this.getAsText()

   //    link.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
   //    link.setAttribute('download', `${this.product} - ${this.#id}.md`)
   //    link.click()
   // }

   // getLogs() {
   //    return [...this.logs]
   // }
}