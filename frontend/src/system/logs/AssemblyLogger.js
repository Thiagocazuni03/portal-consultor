import Utils from '../../core/Utils.js'
import { Logger } from './Logger.js'
import { AssemblyLogHighlighter } from './AssemblyLogHighlighter.js'

/**
 * Classe responsável por registrar as ações do usuário na montagem
 * @author Fernando Petri
 */
export class AssemblyLogger extends Logger {

   /**
    * Os tipos de ações disponíveis
    */
   static ACTIONS = Object.freeze({
      ACTION: 1,
      CANCEL: 2,
      CONFIRM: 3,
      PROHIBITED: 4
   })

   #product
   #description

   /**
    * Instância a classe 
    */
   constructor({ product, description = '', ...props }) {
      super(props)

      this.#product = product
      this.#description = description
   }

   /**
    * Registra um log de ação da montagem
    * @param {object} logData Os dados do log 
    * @override
    */
   addLog(logData) {
      this.getLogs().push({
         ...logData,
         ...this.getInitialAppendedData()
      })
   }

   /**
    * Retorna os dados que deve ser adicionados em todo log inicialmente
    * @returns {object} Os dados
    */
   getInitialAppendedData() {
      return {
         date: Date.now(),
         id: crypto.randomUUID()
      }
   }

   /**
    * Retorna o nome do produto
    * @returns {string} O nome do produto
    */
   getProduct(){
      return this.#product
   }

   /**
    * Retorna a descrição do log
    * @returns {string} A descrição
    */
   getDescription(){
      return this.#description
   }

   /**
    * Retorna os dados para salvar na storage
    * @returns {object} Os dados para salvar
    */
   getDataToSave(){
      return {
         description: this.getDescription(),
         product: this.getProduct(),
         id: this.getId(),
         date: this.getDate(),
         logs: this.getLogs()
      }
   }

   /**
    * Define a descrição do log
    * @param {string} description A descrição 
    */
   setDescription(description){
      this.#description = description
   }

   /**
    * Adiciona um registro de falha de peça
    * @param {number} maximumPieces A quantia máxima de peças
    */
   registerAddPieceFail(maximumPieces) {
      const maximum = AssemblyLogHighlighter.accentNumber(maximumPieces)
      const content = `Tentou adicionar uma peça quando estava no limite de ${maximum} do produto.`

      this.addLog({
         type: AssemblyLogger.ACTIONS.PROHIBITED,
         content
      })
   }

   /**
    * Registra uma tentativa falha de deletar a única peça
    */
   registerDeletePieceFail() {
      const minimum = AssemblyLogHighlighter.accentNumber(1)

      this.addLog({
         type: AssemblyLogger.ACTIONS.PROHIBITED,
         content: `Tentou remover uma peça quando só tinha ${minimum} peça.`
      })
   }

   /**
    * Registra a adição de uma nova peça
    * @param {number} piecesAmount O número de peças
    */
   registerPieceAddition(piecesAmount) {
      const amount = AssemblyLogHighlighter.accentNumber(piecesAmount)
      const pieceLetter = Utils.alphabet(true)[piecesAmount - 1]
      const newPiece = AssemblyLogHighlighter.accentPiece(`Peça ${pieceLetter}`)

      this.addLog({
         type: AssemblyLogger.ACTIONS.CONFIRM,
         content: `Adicionou a peça ${newPiece} totalizando ${amount} peça(s).`
      })
   }

   /**
    * Registra a deleção de uma peça do produto
    * @param {number} piecesAmount A quantidade de peças 
    */
   registerPieceDeletion(piecesAmount){
      const amount = AssemblyLogHighlighter.accentNumber(piecesAmount)
      const pieceLetter = Utils.alphabet(true)[piecesAmount]
      const newPiece = AssemblyLogHighlighter.accentPiece(`Peça ${pieceLetter}`)

      this.addLog({
         type: AssemblyLogger.ACTIONS.CANCEL,
         content: `Deletou a peça ${newPiece} totalizando ${amount} peça(s).`
      })
   }

   /**
    * Registra a mudança de valor de uma peça digitada pelo usuário
    * @param {number} pieceID O ID da peça 
    * @param {number} newValue O novo valor da peça
    * @param {string} measureChanged O nome da medida alterada
    */
   registerPieceMeasureChange(pieceID, newValue, measureChanged){
      const measure = AssemblyLogHighlighter.accentNames(measureChanged)
      const value = AssemblyLogHighlighter.accentNumber(newValue)
      const pieceLetter = Utils.alphabet(true)[pieceID - 1]
      const pieceName = AssemblyLogHighlighter.accentSpecial(`Peça ${pieceLetter}`)

      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: `Definiu a ${measure} da ${pieceName} para ${value}`
      })
   }

   /**
    * Registra a ação de abrir modal de modelos
    */
   registerModelModalOpening(){
      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: 'Abriu o modal de seleção do modelo'
      })
   }

   /**
    * Registra a confirmação da seção de modelos
    * @param {object} model O modelo selecionado
    * @param {object | null} classification A classificação selecionada ou nulo
    * @param {object | null} subclassification A subclassificação selecionada ou nulo
    */
   registerModelConfirm(model, classification, subclassification){
      const modelSelection = []

      if(model){
         modelSelection.push(AssemblyLogHighlighter.accentModel(model.title))
      }

      if(classification){
         modelSelection.push(AssemblyLogHighlighter.accentModel(classification.title))
      }
      
      if(subclassification){
         modelSelection.push(AssemblyLogHighlighter.accentModel(subclassification.title))
      }

      this.addLog({
         type: AssemblyLogger.ACTIONS.CONFIRM,
         content: `Confirmou o modelo ${modelSelection.join(' - ')}`
      })
   }

   /**
    * Registra o cancelamento de um modelo
    */
   registerModelCancel(){
      this.addLog({
         type: AssemblyLogger.ACTIONS.CANCEL,
         content: 'Cancelou o modelo previamente selecionado'
      })
   }

   /**
    * Registra a confirmação de uma linha
    * @param {*} lineSelected 
    */
   registerLineConfirm(lineSelected){
      const line = AssemblyLogHighlighter.accentLine(lineSelected.title)

      this.addLog({
         type: AssemblyLogger.ACTIONS.CONFIRM,
         content: `Confirmou a linha ${line}`
      })
   }

   /**
    * Registra o cancelamento da linha
    */
   registerLineCancel(){
      this.addLog({
         type: AssemblyLogger.ACTIONS.CANCEL,
         content: 'Cancelou a linha previamente selecionada'
      })
   }

   /**
    * Registra o clique em uma combinação
    * @param {object} combinationClicked A combinação clicada
    * @param {object} parentOptional O opcional pai da combinação
    */
   registerCombinationClick(combinationClicked, parentOptional){
      const combinationName = AssemblyLogHighlighter.accentSpecial(combinationClicked.title)
      const optionalName = AssemblyLogHighlighter.accentOptional(parentOptional.title)
      const hideCommodities = Boolean(parentOptional.options.hideCommodity)

      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: `Clicou na combinação ${combinationName}${hideCommodities ? ' com insumos escondidos' : ''} do opcional ${optionalName}`
      })
   }

   /**
    * Registra o clique me um opcional com formulários
    * @param {object} optionalWithForms O opcional com formulários
    */
   registerOptionalWithFormsClick(optionalWithForms){
      const optionalName = AssemblyLogHighlighter.accentOptional(optionalWithForms.title)

      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: `Clicou no opcional ${optionalName} que possuía formulários`
      })     
   }

   /**
    * Registra o clique me um opcional sem combinações
    * @param {object} optional O opcional sem combinações
    */
   registerOptionalWithoutCombinationsClick(optional){
      const optionalName = AssemblyLogHighlighter.accentOptional(optional.title)

      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: `Clicou no opcional ${optionalName} que não possuía combinações`
      })    
   }

   /**
    * Registra o clique em um opcional com combinações escondidas
    * @param {object} optional O opcional 
    */
   registerOptionalWithHiddenCombinations(optional){
      const optionalName = AssemblyLogHighlighter.accentOptional(optional.title)

      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: `Clicou no opcional ${optionalName} que possuía combinações escondidas`
      })
   }

   /**
    * Registra o clique na seleção padrão de uma composição
    * @param {object} composition A composição
    * @param {string} optionalDisplayName O nome de display do opcional
    */
   registerDefaultSelectionClick(composition, optionalDisplayName){
      const optionalName = AssemblyLogHighlighter.accentOptional(optionalDisplayName)
      const compositionName = AssemblyLogHighlighter.accentComponent(composition.title)

      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: `Clicou na seleção padrão ${optionalName} da composição ${compositionName}`
      })
   }

   /**
    * Registra o cancelamento da seleção padrão de uma composição
    * @param {object} composition A composição
    * @param {string} optionalDisplayName O nome de display do opcional
    */
   registerDefaultSelectionCancel(composition, optionalDisplayName){
      const optionalName = AssemblyLogHighlighter.accentOptional(optionalDisplayName)
      const compositionName = AssemblyLogHighlighter.accentComponent(composition.title)

      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: `Cancelou a seleção padrão ${optionalName} da composição ${compositionName}`
      })
   }

   /**
    * Registra o clique em um opcional com seleção de cor automatica
    * @param {string} optionalCombinationName O nome conjunto do opcional e da combinação
    */
   registerColorAutomaticClick(optionalCombinationName){
      const finalDisplayName = AssemblyLogHighlighter.accentSpecial(optionalCombinationName)

      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: `Clicou na seleção de cor automática ${finalDisplayName}`
      })
   }

   /**
    * Registra o cancelamento da cor automatica de um opcional
    * @param {string} optionalCombinationName O nome conjunto do opcional e da combinação
    */
   registerColorAutomaticCancel(optionalCombinationName){
      const finalDisplayName = AssemblyLogHighlighter.accentSpecial(optionalCombinationName)

      this.addLog({
         type: AssemblyLogger.ACTIONS.ACTION,
         content: `Cancelou a seleção de cor automática ${finalDisplayName}`
      })
   }

   /**
    * Registra a confirmação de um opcional
    * @param {object} optional O opcional
    * @param {object} composition A composição pai
    */
   registerOptionalConfirm(optional, composition){
      const optionalName = AssemblyLogHighlighter.accentOptional(optional.view.title)
      const compositionName = AssemblyLogHighlighter.accentComponent(composition.title)

      this.addLog({
         type: AssemblyLogger.ACTIONS.CONFIRM,
         content: `Confirmou o opcional ${optionalName} da composição ${compositionName}`
      })
   }

   /**
    * Registra a confirmação de um insumo
    * @param {object} commodity O insumo
    * @param {object} composition A composição
    */
   registerCommodityConfirm(commodity, composition){
      const commodityName = AssemblyLogHighlighter.accentOptional(commodity.view.title)
      const compositionName = AssemblyLogHighlighter.accentComponent(composition.title)

      this.addLog({
         type: AssemblyLogger.ACTIONS.CONFIRM,
         content: `Confirmou o insumo ${commodityName} da composição ${compositionName}`
      })
   }

   /**
    * Registra o cancelamento de uma opção
    * @param {object} item O item confirmado 
    */
   registerOptionCancel(item){
      const itemTitle = AssemblyLogHighlighter.accentSpecial(item.view.title)
      const groupID = AssemblyLogHighlighter.accentSpecial(item.groupID)

      this.addLog({
         type: AssemblyLogger.ACTIONS.CANCEL,
         content: `Cancelou a opção ${itemTitle} e as opções subsequentes do grupo ${groupID}`
      })
   }
}