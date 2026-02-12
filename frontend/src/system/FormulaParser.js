import Utils from '../core/Utils.js'

export default class FormulaParser {

   /**
    * Calcula uma fórmula 
    */
   static calculate(formula = '', variables = {}) {
      try {


         if (!formula) this.throwError(1, 'Fórmula vazia.')

         const treatedFormula = this.treatFormula(formula)
         const withoutComments = this.removeComments(treatedFormula)
         const formulaResult = this.processLineByLine(withoutComments, variables)

         return {
            code: 0,
            formula,
            variables,
            message: '',
            result: formulaResult
         }

      } catch (error) {

         return {
            formula,
            variables,
            result: null,
            hints: this.getHints(this.removeComments(this.treatFormula(formula))),
            ...JSON.parse(error)
         }

      }
   }

   /**
    * Divide as fórmulas em linhas separadas por ;
    * Remove todos os espaços desncescessários 
    * Retorna uma nova string
    */
   static treatFormula(formula) {
      return formula
         .trim()
         .split(';')
         .map(line => line.trim())
         .join(';')
         .replaceAll('\n', '')
   }


   /**
    * Filtra as linhas que começam como comentários (//)
    * Retorna uma nova string
    */
   static removeComments(formula) {
      return formula
         .trim()
         .split(';')
         .filter(line => !line.startsWith('//'))
         .join(';')
   }

   /**
    * Passa por cada linha da fórmula e faz todos os cálculos, substituição de váriaveis, funções, etc 
    */
   static processLineByLine(formula, variables) {
      const allLines = formula.split(';')
      const returnIndex = allLines.findIndex(line => line.startsWith('='))

      for (let [index, line] of allLines.entries()) {
         try {

            line = this.handleBetween(line)
            line = this.replaceOptionalVariables(line, variables)
            line = this.replaceVariables(line, variables, index)
            line = this.handleRounding(line)
            line = this.handleRoots(line)
            line = this.handleExponents(line)
            line = this.removeIfs(line)

            if (returnIndex === index){
               const isStringReturn = line.startsWith('=#')
               const returnValue = isStringReturn ?  line.slice(2) : this.evaluate(line.slice(1))

               return returnValue
            }

            this.processAssignments(line, variables)

         } catch (error) {

            const errorObject = Utils.isJSON(error)   
               ? {...JSON.parse(error), variables }
               : { code: 4, message: `Erro de sintaxe na linha ${index + 1}.`, variables }

            this.throwError(errorObject.code, errorObject.message)

         }
      }
   }

   /**
    * Verifica se um valor está entre um mínimo e máximo 
    * Lida com os `betweens`
    * 
    * Exemplo: {valor}[0,100]
    * Substitui para: ({valor} > 0 && {valor} < 100)
    */
   static handleBetween(line) {
      const betweenMatch = (/\{\s*?(\w+?)\s*?\}\[(.*?)\]/).exec(line)

      if (!betweenMatch) return line

      const variableKey = betweenMatch[1].trim()
      const minimun = betweenMatch[2].split(',')[0].trim()
      const maximum = betweenMatch[2].split(',')[1].trim()
      const newString = line.replace(betweenMatch[0], `({${variableKey}} > ${minimun} && {${variableKey}} < ${maximum})`)

      return this.handleBetween(newString)
   }

   /**
    * Lida com as raizes da fórmula
    * Substitui √(numero) para um Math.sqrt(numero)
    * Caso possuir um ³ antes da raiz substitui para Math.cbrt(numero)
    */
   static handleRoots(line){
      const rootMatch = (/([²³]?)√\(/gi).exec(line)

      if(!rootMatch) return line

      const isCubic = rootMatch[1] === '³'
      const toReplace = isCubic ? 'Math.cbrt(' : 'Math.sqrt('
      const newLine = line.replace(rootMatch[0], toReplace)

      return newLine
   }

   /**
    * Lida com o arredondamento
    * Exemplo ²(1.5)
    * Substitui para: Math.ceil(1.5)
    */
   static handleRounding(line) {
      const roundingMatch = (/([¹²³ªº])\((.*?)\)/).exec(line)

      if (!roundingMatch) return line

      const roundingMethods = {
         '¹': (value) => `Math.round(${value})`,
         '²': (value) => `Math.ceil(${value})`,
         '³': (value) => `Math.floor(${value})`,
         'ª': (value) => `(2 * Math.round(${value} / 2) + 1)`,
         'º': (value) => `(2 * Math.round(${value} / 2))`
      }

      const roundingType = roundingMatch[1]
      const valueToRound = roundingMatch[2]
      const substitute = roundingMethods[roundingType](valueToRound)
      const newString = line.replace(roundingMatch[0], substitute)

      return this.handleRounding(newString)
   }

   /**
    * Lida com exponentes
    * Exemplo (1.5)² ou 1.5²
    * Substitui para: (1.5 ** 2)
    */
   static handleExponents(line) {
      const exponentMatch = (/(\(.*?\)|\d+?)([¹²³])/).exec(line)

      if (!exponentMatch) return line

      const possibleExponents = {
         '¹': (value) => `(${value} ** 1)`,
         '²': (value) => `(${value} ** 2)`,
         '³': (value) => `(${value} ** 3)`,
      }

      const exponent = exponentMatch[2]
      const valueToExponent = exponentMatch[1]
      const substitute = possibleExponents[exponent](valueToExponent)
      const newString = line.replace(exponentMatch[0], substitute)

      return this.handleExponents(newString)
   }

   /**
    * Coloca as variáveis no lugar
    * Exemplo: {variavel}
    */
   static replaceVariables(line, variables, index) {
      const variableMatch = (/\{(?:\\s+)?([^\^]+?)(?:\\s+)?\}/).exec(line)

      
      if (!variableMatch) return line

      const variableKey = variableMatch[1].trim().replaceAll('.', '')
      const variableValue = variables[variableKey]

      if (variableValue === undefined) this.throwError(2, `Variavel indefinida {${variableKey}} na linha ${index + 1}.`)

      const variableRegex = new RegExp(`\{(?:\\s+)?${variableKey}(?:\\s+)?\}`, 'g')
      const newString = line.replace(variableRegex, variableValue)

      return this.replaceVariables(newString, variables, index)
   }

   /**
    * Coloca as váriaveis opcionais na formula
    * Exemplo: {^OPCIONAL}
    * Quando não encontrar: 0 
    */
   static replaceOptionalVariables(line, variables) {
      const optVariableMatch = (/\{\^(?:\\s+)?(.+?)(?:\\s+)?\}/).exec(line)

      if (!optVariableMatch) return line

      const variableKey = optVariableMatch[1].trim()
      const variableValue = variableKey[variables] ?? 0
      const newString = line.replace(optVariableMatch[0], variableValue)

      return this.replaceOptionalVariables(newString, variables)
   }

   /**
    * Solta um erro que é retornado como resposta para o usuário
    */
   static throwError(code, message) {
      throw (JSON.stringify({
         code,
         message
      }))
   }

   /**
    * Remove todos os `SE` da fórmula, deixando o código como ternário 
    */
   static removeIfs(line) {
      return line.replace(/SE\(/g, '(')
   }

   /**
    * Verifica caso a linha seja uma declaração de váriavel
    * Caso for processa a linha e atribui o resultado a um valor as variáveis
    */
   static processAssignments(line, variables) {
      const assignmentMatch = (/^\[(.*?)\](?:\s*?)=(.*)/s).exec(line)

      if (!assignmentMatch) return null

      const variableName = assignmentMatch[1].trim()
      const lineLeftover = assignmentMatch[2].trim()
      const result = this.evaluate(lineLeftover)

      variables[variableName] = result

      return result
   }

   /**
    * Retorna as dicas
    */
   static getHints(formula){
      const allHints = []
      const charMap = {
         '(': 0,
         ')': 0,
         '[': 0,
         ']': 0,
         '{': 0,
         '}': 0,
      }

      //Anotando número de parenteses, chaves, e colchetes abertos
      formula.split('').forEach(char => {
         if(charMap.hasOwnProperty(char)) charMap[char] += 1
      })

      //Mensagem de erro quando números inequais de parenteses
      if(charMap['('] !== charMap[')']) allHints.push(`Número de parenteses abertos e fechados diferente (Abrindo: ${charMap['(']}, Fechando: ${charMap[')']}).`)
      if(charMap['['] !== charMap[']']) allHints.push(`Número de colchetes abertos e fechados diferente (Abrindo: ${charMap['[']}, Fechando: ${charMap[']']}).`)
      if(charMap['{'] !== charMap['}']) allHints.push(`Número de chaves abertos e fechados diferente (Abrindo: ${charMap['{']}, Fechando: ${charMap['}']}).`)

      return allHints
   }

   /**
    * Processa uma string como código Javascript 
    */
   static evaluate(line) {
      return eval(line)
   }
}


