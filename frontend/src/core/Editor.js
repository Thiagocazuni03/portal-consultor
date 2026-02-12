import { Div } from '../utils/Prototypes.js'
import $ from 'jquery'

export default class Editor {
   constructor(config) {

      //Configurações
      this.config = $.extend({

         formula: '',
         onInput: () => { }

      }, config)

      //Elementos
      this.wrapper = new Div('SP__editor')
      this.header = new Div('SP__editor__header')
      this.sidebar = new Div('SP__editor__sidebar')
      this.code = new Div('SP__editor__code')
      this.footer = new Div('SP__editor__footer')

      //Estado
      this.highlights = {}

      //Configurando
      this.code.attr('contenteditable', true)
      this.code.on('paste', (event) => this.handlePaste(event))
      this.code.on('copy', (event) => this.handleCopy(event))
      this.code.on('keydown', (event) => this.handleKeyDown(event))
      this.code.on('input', (event) => this.handleInput(event))
      this.code.attr('spellcheck', false)

      //Montando
      this.code.text(this.config.formula)
      this.wrapper.append(this.header, this.sidebar, this.code, this.footer)

      //Incializando
      this.prepareHighlights()
      this.updateSidebar()

      setTimeout(() => this.updateHighlights())
   }

   handleInput() {
      this.updateSidebar()
      this.updateHighlights()

      const allLines = this.getLines()
      const widestLineLength = Math.max(...allLines.map(line => line.length))

      this.code.css('width', widestLineLength + 'ch')


      this.config.onInput()
   }

   /**
    * Prepare as highlights
    */
   prepareHighlights() {
      this.prepareInstances()
      this.prepareStyle()
   }

   prepareStyle() {
      const styleTag = document.createElement('style')

      this.getHiglights().forEach(({ name, css }) => {
         styleTag.append(`
            ::highlight(${name}){
               ${Object.entries(css).map(([key, value]) => `${key}: ${value};`).join('\n')}
            }
         `)
      })

      document.body.appendChild(styleTag)
   }

   prepareInstances() {
      this.getHiglights().forEach(({ name }) => {
         const highlight = new Highlight()

         this.highlights[name] = highlight
         CSS.highlights.set(name, highlight)
      })
   }

   /**
    * Atualiza os highlights
    */
   updateHighlights() {
      this.clearHighlights()
      this.applyHighlights()
   }

   applyHighlights() {
      this.getRangesToHighlight().forEach(({ name, ranges }) => {
         ranges.forEach(({ result, start, end }) => {
            const range = new Range()

            range.setStart(this.getTextNode(), start)
            range.setEnd(this.getTextNode(), end)

            this.highlights[name].add(range)
         })
      })
   }

   getRangesToHighlight() {
      return this.getHiglights().map(({ name, regex }) => {
         const text = this.getText()
         const ranges = this.findMatches(regex, text)

         return {
            name,
            ranges
         }
      })
   }

   findMatches(regex, string) {
      let matches = []
      let match = null

      while (match = regex.exec(string)) {
         matches.push({
            result: match[0],
            start: match.index,
            end: match.index + match[0].length
         })
      }

      return matches
   }


   getHiglights() {
      return [
         {
            name: 'comments',
            regex: /\/\/[^;]*/gim,
            css: {
               color: '#72C061'
            }
         },
         {
            name: 'number',
            regex: /[\d.]+/gi,
            css: {
               color: '#FFAA5C'
            }
         },
         {
            name: 'replacements',
            regex: /\{[a-z0-9_]+?\}/gi,
            css: {
               color: '#A968FF'
            }
         },
         {
            name: 'variables',
            regex: /\[[a-z0-9_]+?\]/gi,
            css: {
               'color': '#FF7F7F',
               'font-weight': 'bold'
            }
         },
         {
            name: 'operators',
            regex: /[-+=*/√¹²³ªº><!()?:;]+/gi,
            css: {
               color: '#639EFF'
            }
         }
      ]
   }

   /**
    * Limpa todas as highlights
    */
   clearHighlights() {

   }



   /**
    * Lida com o keydown
    */
   handleKeyDown(event) {
      const keyPressed = event.originalEvent.key
      const isEnter = keyPressed === 'Enter'

      if (isEnter) {
         event.preventDefault()
         this.breakLine()
         this.updateSidebar()
         this.updateHighlights()
      }

      return true
   }

   /**
    * Quebra uma linha na seleção atual
    */
   breakLine() {
      const selection = window.getSelection()
      const range = selection.getRangeAt(0)
      const start = range.startOffset
      const node = document.createTextNode(start === this.getTextLength() ? '\n\n' : '\n')

      range.deleteContents()
      range.insertNode(node)

      this.setText(this.getText())
      this.setSelection(start + 1, start + 1)
   }

   /**
    * Seleciona algo a partir de um começo e um fim 
    */
   setSelection(start, end) {
      const selection = window.getSelection()
      const range = new Range()
      const node = this.getTextNode()

      range.setStart(node, Math.max(start, 0))
      range.setEnd(node, Math.min(end, this.getTextLength()))

      selection.empty()
      selection.addRange(range)
   }

   /**
    * Lida com o copiar do editor
    */
   handleCopy() {
   }

   /**
    * Lida com o paste dentro do editor 
    */
   handlePaste() {

   }

   updateSidebar() {
      let validLinesCount = 0

      const allLines = this.getLines()
      const lineNumbers = allLines.map(line => {
         const isLineBlank = line.trim() === ''
         const isLineComment = line.trim().startsWith('/')

         if (isLineBlank || isLineComment) return new Div('SP__editor__sidebar__dot')

         validLinesCount += 1

         return new Div('SP__editor__sidebar__number').text(validLinesCount)
      })

      this.sidebar.empty()
      this.sidebar.append(lineNumbers)
   }

   setText(text) {
      this.code.text(text)
   }

   /**
    * Retorna o texto do editor 
    */
   getText() {
      return this.code.text()
   }

   /**
    * Retorna o tamanho do texto 
    */
   getTextLength() {
      return this.getText().length
   }

   /**
    * Retorna o node de texto 
    * @returns {Node}
    */
   getTextNode() {
      return this.code[0].firstChild
   }

   /**
    * Retorna linhas de textos do editor 
    */
   getLines() {
      return this.getText().split('\n')
   }

   /**
    * Retorna o node do Editor 
    */
   getView() {
      return this.wrapper
   }
}