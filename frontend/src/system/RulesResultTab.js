import Badge from '../core/Badge.js'
import Dropdown from '../core/Dropdown.js'
import Item from '../core/Item.js'
import Tab from '../components/Tab.js'
import Renderer from '../core/Renderer.js'
import SearchBar from '../core/SearchBar.js'
import Tooltip from '../core/Tooltip.js'
import Utils from '../core/Utils.js'
import { Div } from '../utils/Prototypes.js'
import Ruler from './Ruler.js'
import { ResourceNamesProvider } from './resources/ResourcesNamesProvider.js'

export default class RulesResultTab extends Tab {
   constructor(config) {
      super({
         title: 'Regras de Montagem',
         css: 'isFullLeft hasContentSidePadding',
         desc: 'Veja o resultado de suas regras de montagem e seus componentes.',
         hasFooter: false,
         openAnimation: 'slide-reverse',
         config: null,
         resources: null,
         dataCart: null,
         ...config
      })      

      //Objeto de busca
      this.searchFilter = {
         source: Ruler.SOURCES.COMPOSITION,
         search: '',
         action: null,
         activated: null
      }

      //Limitando opcionais e insumos
      this.inputsShown = 0
      this.optionalsShown = 0

      //Elementos
      this.container = new Div({
         display: 'grid',
         gridTemplateRows: 'min-content 1fr',
         height: '100%',
      })

      //A render das composições
      this.rulesRender = new Renderer(this.getRendererConfiguration())

      //SearchBar do item
      this.searchBar = new SearchBar(this.getSearchBarConfiguration())
      
      //O cara que lida com nomes
      this.namesProvider = new ResourceNamesProvider(this.config.resources)

      this.rulesRender.setItems([])
      this.rulesRender.disableRender()

      this.container.append(
         this.searchBar.getView(),
         this.rulesRender.getView()
      )

      this.appendToContent(this.container)
   }

   /**
    * Atualiza a aba com novas regras
    * @param {object[]} results Os grupos de regras verificados 
    */
   update(results) {
      this.inputsShown = 0
      this.optionalsShown = 0
      this.rulesRender.setItems(results)
   }

   /**
    * Lida com a mudança de filtros
    */
   handleFilterChange() {
      this.inputsShown = 0
      this.optionalsShown = 0
      this.rulesRender.renderItems()
   }

   /**
    * Cria a visualização de um resultado de um grupo
    */
   createGroupInfo(ruleGroup) {

      const groupTitle = this.namesProvider.getGroupName(ruleGroup.groupID)
      const ruleGroupTitle = ruleGroup.title || 'Grupo de regra sem título.'
      const sourceTitle = ruleGroup.from
      const validRulesAmount = ruleGroup.rules.filter(rule => rule.isRuleValid).length
      const totalRulesAmount = ruleGroup.rules.length

      //A badge se foi aplicado ou não
      const resultBadge = new Badge({
         static: true,
         transform: [0, 0],
         round: false,
         color: ruleGroup.isValid ? 'var(--green)' : 'var(--red)',
         title: ruleGroup.isValid ? 'Aplicado' : 'Não foi aplicado',
         icon: ruleGroup.isValid ? 'ic-check' : 'ic-close',
      })

      //A badge de ação da regra
      const actionBadge = new Badge({
         static: true,
         transform: [0, 0],
         round: false,
         color: ruleGroup.action === Ruler.ACTIONS.HIDE ? 'var(--fifth)' : 'var(--orange)',
         title: ruleGroup.action === Ruler.ACTIONS.HIDE ? 'Ocultar' : 'Exibir',
         icon: ruleGroup.action === Ruler.ACTIONS.HIDE ? 'ic-eye-close' : 'ic-eye-open',
      })

      //O dropdown com as regras dentro
      const detailsDropdown = new Dropdown({
         title: `Regras (${validRulesAmount}/${totalRulesAmount})`,
         css: 'isRuleDetails',
         appendToContent: ruleGroup.rules.map(rule => this.createRuleInfo(rule))
      })

      //O item
      const groupItem = new Item({
         columns: ['1fr', '0px', '0px'],
         header: [
            Item.row(Item.title(sourceTitle), Item.desc(groupTitle)).css('column-gap', '0.5rem'),
            Item.row(resultBadge.getView(), actionBadge.getView())
         ],
         left: [
            Item.brand('#' + ruleGroup.id),
            Item.title(ruleGroupTitle),
            Item.desc(ruleGroup.message || 'Sem mensagem de aviso.')
         ],
         footer: detailsDropdown.getView()
      })

      return groupItem.getView()

   }

   /**
    * Cria a visualização do resultado de uma regra 
    */
   createRuleInfo(rule) {

      //Regras interiores de cada regrea
      const subRulesDetails = this.getRuleInfo(rule)
      const subRuleNodes = subRulesDetails.map(subRule => this.createSubRuleInfo(subRule))

      //Estilização
      const itemStyle = {
         header: {
            border: 'none'
         },
         item: {
            border: 'none',
            margin: '0.5rem 0',
            borderLeft: `2px solid var(--${rule.isRuleValid ? 'green' : 'red'})`,
            backgroundColor: 'var(--third)'
         },
         center: {
            borderLeft: '2px solid var(--fourth)'
         },
         main: {
            paddingTop: 0
         }
      }

      //A visualização
      return new Item({

         style: itemStyle,
         columns: ['1fr', '1fr'],
         header: Item.title(`Regra #${rule.id}`).css('color', rule.isRuleValid ? 'var(--green)' : 'var(--red)'),
         left: subRuleNodes.slice(0, 4),
         right: subRuleNodes.slice(4)

      }).getView()
   }

   createSubRuleInfo({ name, hasRule, isValid, containRule, type, items }) {

      const ruleRow = new Div()
      const ruleMessage = Item.desc()
      const ruleIcon = Item.icon(isValid ? 'ic-check' : 'ic-close')
      const ruleDetails = Item.row(Item.icon('ic-info-circle'))

      let colorToUse = null
      let titleToUse = null

      //Decidindo mensagem para mostrar
      isValid
         ? titleToUse = `(${name}) Passou na verificação.`
         : titleToUse = `(${name}) Não passou na verificação.`

      //Decidindo cor para mostrar
      isValid
         ? colorToUse = 'var(--green)'
         : colorToUse = 'var(--red)'

      //Caso nãp possuir regra
      if (!hasRule) {

         titleToUse = `(${name}) Não possui verificação.`
         colorToUse = 'var(--fifth)'

      }

      //Nome do tipo de regra
      const getContainRuleName = () => ({
         [Ruler.TYPES.CONTAIN_ALL]: 'Contêm Todos:',
         [Ruler.TYPES.CONTAIN_ONE]: 'Contêm Um:',
         [Ruler.TYPES.DONT_CONTAIN_ALL]: 'Não Contêm Todos:',
         [Ruler.TYPES.DONT_CONTAIN_ONE]: 'Não Contêm Um:',
      })

      //Retorna o cabeçalho que deve ser usado
      const getHeaderTitle = (type) => {
         const headerTypes = {

            0: () => getContainRuleName()[containRule],
            7: () => 'Medidas'

         }


         const hasType = !!headerTypes[type]
         const header = headerTypes[hasType ? type : 0]()

         return header
      }

      //Retorna o conteúdo da tooltip
      const getContent = (type) => {
         const contentTypes = {

            0: () => Tooltip.dot(items.join(', ')),
            1: () => items.map(name => Tooltip.dot(name)),
            3: () => items.map(name => Tooltip.dot(name)),
            4: () => items.map(name => Tooltip.dot(name)),
            5: () => items.map(name => Tooltip.dot(name)),
            6: () => items.map(name => Tooltip.dot(name)),
            7: () => items.map(name => Tooltip.dot(name)),

         }

         const hasType = !!contentTypes[type]
         const content = contentTypes[hasType ? type : 0]

         return content
      }

      ruleMessage.text(titleToUse)
      ruleMessage.css('color', colorToUse)
      ruleRow.append(ruleIcon, ruleMessage)

      setTimeout(() => {
         ruleIcon.css('color', colorToUse)
      }, 25)

      ruleRow.css({
         width: '100%',
         display: 'grid',
         gridTemplateColumns: 'min-content 1fr min-content',
         columnGap: '0.5rem',
         alignItems: 'center'
      })

      if (hasRule) {
         ruleRow.append(ruleDetails)

         new Tooltip({
            on: ruleDetails,
            parentPos: 'relative',
            position: 'left',
            style: { width: '300px' },
            header: Tooltip.title(getHeaderTitle(type)),
            content: getContent(type)

         })
      }

      return ruleRow
   }

   /**
    * Retorna os dados de uma regra
    */
   getRuleInfo({
      rule,
      isLineRuleValid,
      isPrintRuleValid,
      isCompositionRuleValid,
      isOptionalRuleValid,
      isClassificationRuleValid,
      isVariableRuleValid,
      isMeasureRuleValid,
      hasLineRule,
      hasPrintRule,
      hasCompositionRule,
      hasOptionalRule,
      hasClassificationRule,
      hasVariableRule,
      hasMeasureRule
   }) {
      return [
         {
            type: 1,
            name: 'Linha',
            hasRule: hasLineRule,
            isValid: isLineRuleValid,
            containRule: rule.ruleLine,
            items: Utils.parseNumbersString(rule.lines).map(modeLineID => {
               return this.namesProvider.getModelLineName(modeLineID)
            })
         },
         {
            type: 2,
            name: 'Estampa',
            hasRule: hasPrintRule,
            isValid: isPrintRuleValid,
            containRule: rule.rulePrint,
            items: Utils.parseNumbersString(rule.prints)
         },
         {
            type: 3,
            name: 'Componente',
            hasRule: hasCompositionRule,
            isValid: isCompositionRuleValid,
            containRule: rule.ruleComposition,
            items: Utils.parseNumbersString(rule.compositions).map(categoryID => {
               return this.namesProvider.getCompositionCategoryName(categoryID)
            })
         },
         {
            type: 4,
            name: 'Opcional',
            hasRule: hasOptionalRule,
            isValid: isOptionalRuleValid,
            containRule: rule.ruleOptional,
            items: Utils.parseNumbersString(rule.optionals).map(optID => {
               return this.namesProvider.getOptionalNameWithGroup(optID)
            })
         },
         {
            type: 5,
            name: 'Classificação',
            hasRule: hasClassificationRule,
            isValid: isClassificationRuleValid,
            containRule: rule.ruleClass,
            items: Utils.parseNumbersString(rule.classifications).map(classID => {
               return this.namesProvider.getClassificationName(classID)
            })
         },
         {
            type: 6,
            name: 'Variável',
            hasRule: hasVariableRule,
            isValid: isVariableRuleValid,
            containRule: rule.ruleVariable,
            items: (rule.variables || []).map((row) => `${row.variable1 || 'Não foi preenchido'}  ${row.operator}  ${row.variable2 || 'Não foi preenchido'}`)
         },
         {
            type: 7,
            name: 'Medida',
            hasRule: hasMeasureRule,
            isValid: isMeasureRuleValid,
            containRule: rule.ruleMeasure,
            items: [
               `Altura Mínima: ${Number(rule.minHeight) || 'Nenhuma'}.`,
               `Altura Máxima: ${Number(rule.maxHeight) || 'Nenhuma'}.`,
               `Largura Mínima: ${Number(rule.minWidth) || 'Nenhuma'}.`,
               `Largura Máxima: ${Number(rule.maxWidth) || 'Nenhuma'}.`,
               `Área Mínima: ${Number(rule.minArea) || 'Nenhuma'}.`,
               `Área Máxima: ${Number(rule.maxArea) || 'Nenhuma'}.`,
            ]
         }
      ]
   }

   /**
    * Filtra os items 
    */
   filterItems() {
      this.inputsShown = 0
      this.optionalsShown = 0

      this.rulesRender.renderItems()
   }

   /**
    * Retorna se um grupo de regras bate nas pesquisa
    * @param {object} ruleGroup O grupo de regras
    * @returns {boolean} Se deve estar visíviel ou não 
    */
   shouldRuleGroupBeShown(ruleGroup) {
      if (this.isRuleGroupExceedingTypeLimit(ruleGroup)) {
         return false
      }

      const { search, action, source, activated } = this.getSearchFilter()

      const validations = []
      const groupText = Utils.normalizeString(this.compactRuleGroupText(ruleGroup))

      if (search) {
         validations.push(groupText.includes(search))
      }

      if (action) {
         validations.push(ruleGroup.action === action)
      }

      if (source) {
         validations.push(ruleGroup.source === source)
      }

      if (activated !== null) {
         validations.push(ruleGroup.isValid === activated)
      }

      const isValid = validations.every(Boolean)


      if (isValid) {
         if (ruleGroup.source === Ruler.SOURCES.OPTIONAL) this.optionalsShown++
         if (ruleGroup.source === Ruler.SOURCES.COMMODITY) this.inputsShown++
      }

      return isValid
   }

   /**
    * Compacta todo o texto de um grupo de regras em um string
    * @param {object} ruleGroup O grupo de regras
    * @returns {string} O grupo de regras
    */
   compactRuleGroupText(ruleGroup) {
      const texts = []

      if (ruleGroup.title) {
         texts.push(ruleGroup.title)
      }

      if (ruleGroup.message) {
         texts.push(ruleGroup.message)
      }

      if (ruleGroup.from) {
         texts.push(ruleGroup.from)
      }

      return texts.join(' ')
   }

   /**
    * Retorna se um grupo de regras está excedendo o limite de tipo
    * @param {object} ruleGroup O grupo de regra
    * @returns {boolean} Se passou ou não 
    */
   isRuleGroupExceedingTypeLimit(ruleGroup) {
      if (ruleGroup.source === Ruler.SOURCES.OPTIONAL && this.optionalsShown >= 50) {
         return true
      }
      if (ruleGroup.source === Ruler.SOURCES.COMMODITY && this.inputsShown >= 50) {
         return true
      }

      return false
   }

   /**
    * Retorna a configuração da renderer
    * @returns {object} A configuração
    */
   getRendererConfiguration() {
      return {
         items: [],
         messageOnEmpty: 'Nenhuma regra foi verificada.',
         hasAnimation: false,
         animation: 'appear',
         css: 'isRuleRender noInnerPadding',
         hasGoToTopButton: false,
         createFunc: (ruleGroup) => this.createGroupInfo(ruleGroup),
         filterFunc: (ruleGroups) => ruleGroups.filter(ruleGroup => this.shouldRuleGroupBeShown(ruleGroup))
      }
   }

   /**
    * Retorna a configuração da barra de pesquisa
    * @returns {object} A configuração
    */
   getSearchBarConfiguration() {
      return {
         css: 'isRulesSearchBar',
         label: 'Pesquisa',
         placeholder: 'Digite algo e pressione Enter...',
         onInput: ({ target }) => {
            this.handleSearchTextChange(target.value)
            this.handleFilterChange()
         },
         onClear: () => {
            this.handleSearchTextClear()
            this.handleFilterChange()
         },
         options: [
            {
               label: 'Tipo',
               type: 'select',
               options: [
                  {
                     text: 'Componentes',
                     icon: 'ic-group',
                     value: Ruler.SOURCES.COMPOSITION
                  },
                  {
                     text: 'Opcionais',
                     icon: 'ic-subclasses',
                     value: Ruler.SOURCES.OPTIONAL
                  },
                  {
                     text: 'Validadores',
                     icon: 'ic-cubes',
                     value: Ruler.SOURCES.COMMODITY
                  },
               ],
               onChange: (state) => {
                  this.handleSearchSourceChange(state.value)
                  this.handleFilterChange()
               }
            },
            {
               label: 'Ação',
               type: 'select',
               options: [
                  {
                     text: 'Todas',
                     icon: 'ic-check',
                     value: null
                  },
                  {
                     text: 'Ocultar',
                     icon: 'ic-close',
                     value: Ruler.ACTIONS.HIDE
                  },
                  {
                     text: 'Exibir',
                     icon: 'ic-editor-view',
                     value: Ruler.ACTIONS.SHOW
                  },
               ],
               onChange: (state) => {
                  this.handleSearchActionChange(state.value)
                  this.handleFilterChange()
               }
            },
            {
               label: 'Resultado',
               type: 'select',
               options: [
                  {
                     text: 'Todos',
                     icon: 'ic-check',
                     value: null
                  },
                  {
                     text: 'Aplicado',
                     icon: 'ic-check',
                     value: true
                  },
                  {
                     text: 'Não aplicado',
                     icon: 'ic-close',
                     value: false
                  },
               ],
               onChange: (state) => {
                  this.handleSearchResultChange(state.value)
                  this.handleFilterChange()
               }
            }
         ]
      }
   }

   /**
    * Lida com a mudança do texto da barra de pesquisa
    * @param {string} search A nova pesquisa 
    */
   handleSearchTextChange(search) {
      this.searchFilter.search = Utils.normalizeString(search)
   }

   /**
    * Lida quando o usuário limpa o texto da barra de pesquisa
    */
   handleSearchTextClear() {
      this.searchFilter.search = ''
   }

   /**
    * Lida com a mudança de tipo da pesquisa
    * @param {number} source O tipo
    */
   handleSearchSourceChange(source) {
      this.searchFilter.source = source
   }

   /**
    * Lida com a mudança de ação da pesquisa
    * @param {number} action A ação
    */
   handleSearchActionChange(action) {
      this.searchFilter.action = action
   }

   /**
    * Lida com a mudança de filtragem de resultado da pesquisa
    * @param {boolean} result O resultado
    */
   handleSearchResultChange(result) {
      this.searchFilter.activated = result
   }

   /**
    * Retorna os filtros atuais
    * @returns {object} Os filtros
    */
   getSearchFilter() {
      return this.searchFilter
   }
}