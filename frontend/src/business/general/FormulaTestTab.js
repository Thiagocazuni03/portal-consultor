import Tab from '../../components/Tab.js'
import Editor from '../../core/Editor.js'
import { Icon } from '../../utils/Prototypes.js'
import FormulaParser from '../../system/FormulaParser.js'
import Item from '../../core/Item.js'

export default class FormulaTestTab extends Tab {
   constructor(config) {
      super({
         title: 'Fórmulas',
         desc: 'Digite uma fórmula aqui para testa-lá.',
         css: 'useFlexColumn hasContentSidePadding',
         hasFooter: false,
         scrollable: true,
         formula: '[N1] = 10;\n[RESULTADO] = {N1}²;\n=({RESULTADO})',
         variables: {},
         ...config
      })

      this.variables = Object.entries(this.config.variables).map(([key, value]) => ({ key, value }))

      this.resetIcon = new Icon('SP__header__options__icon ic-refresh')

      this.resetIcon.click(() => {
         this.close()
         new FormulaTestTab(config).open()
      })

      this.editor = new Editor(this.getEditorConfig())

      this.output = new Item({
         columns: ['1fr', '0px', '0px'],
         header: Item.title('Resultado'),
         style: { header: { backgroundColor: 'var(--third)' } }
      })

      this.editor.getView().css('animation-delay', 0 + 'ms')
      this.output.getView().css('animation-delay', 150 + 'ms')

      this.appendToContent(this.editor.getView())
      this.appendToContent(this.output.getView())
      this.prependToOptions(this.resetIcon)
      this.updateOutput()
   }


   getEditorConfig() {
      return {
         formula: this.config.formula,
         onInput: () => this.updateOutput()
      }
   }

   updateOutput() {

      const formula = this.editor.getText()
      const variables = Object.fromEntries(this.variables.map(({ key, value }) => [key, value]))
      const calculation = FormulaParser.calculate(formula, variables)

      if (calculation.code !== 0) {

         this.output.left.empty()
         this.output.left.append(Item.desc(calculation.message).css('color', 'var(--red)'))

      } else {

         this.output.left.empty()
         this.output.left.append(Item.desc(calculation.result ?? 'Fórmula sem retorno.'))

      }
   }
}