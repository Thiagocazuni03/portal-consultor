import Item from '../core/Item.js'
import Tab from '../components/Tab.js'
import SearchBar from '../core/SearchBar.js'
import Sheet from '../core/Sheet.js'
import FormulaTestTab from '../business/general/FormulaTestTab.js'
import Utils from '../core/Utils.js'
import Tooltip from '../core/Tooltip.js'
import Badge from '../core/Badge.js'
import { Div, P } from '../utils/Prototypes.js'
import { CURRENCY } from '../api/Variables.js'

export default class DatasheetTab extends Tab {
   constructor(config) {
      super({
         css: 'isFullLeft hasContentSidePadding',
         hasFooter: false,
         openAnimation: 'slide-reverse',
         title: 'Ficha Técnica',
         scrollable: true,
         desc: 'Confira a relação de componentes com seus consumos e pesos sobre este produto.',
         ...config,
      })

      this.datasheetGrid = new Div('SP__datasheet')
      this.sheetsContainer = new Div('SP__datasheet__container')

      this.searchBar = new SearchBar({
         label: '',
         css: 'isDatasheetSearch',
         onInput: ({ target }) => this.updateFiltering(target.value),
         onClear: () => this.updateFiltering('')
      })

      this.topbar = new Item({
         css: 'isDatasheetTopbar',
         columns: ['1fr'],
         left: this.getTopbarButtons().map(config => this.createTopbarButton(config)),
         footer: this.searchBar.getView(),
         style: {
            main: {
               'padding': '0.5rem',
            },
            left: {
               'column-gap': '0.5rem',
               'flex-direction': 'row'
            },
            footer: {
               padding: '0px 0.5rem'
            }
         },
      })

      this.inputsRender = new Sheet({
         css: 'isDatasheetSheet',
         scrollabe: true,
         render: { messageOnEmpty: 'Nenhum insumo foi aplicado.' },
         layout: this.getInputsLayout()
      })

      this.componentsRender = new Sheet({
         css: 'isDatasheetSheet',
         scrollabe: true,
         render: { messageOnEmpty: 'Nenhum componente foi aplicado' },
         layout: this.getComponentsLayout()
      })

      this.priceListRender = new Sheet({
         css: 'isDatasheetSheet',
         scrollabe: true,
         layout: this.getPriceListLayout(),
         render: {
            messageOnEmpty: 'Nenhum item foi aplicado',
            onRender: () => this.priceListRender && this.priceListRender.update()
         },
      })

      this.summaryRender = new Sheet({
         css: 'isDatasheetSheet',
         scrollabe: true,
         layout: this.getSummaryLayout(),
         render: {
            messageOnEmpty: 'Sem detalhes para mostrar',
            onRender: () => this.summaryRender && this.summaryRender.update()
         },
      })

      this.datasheetGrid.append(this.topbar.getView(), this.sheetsContainer)

      this.appendToContent(this.datasheetGrid)
      this.setActiveRender(this.inputsRender)
   }



   /**
    * Atualiza todas as renders 
    */
   update({ inputs, components, priceList, summary }) {
      this.priceListData = priceList

      this.inputsRender.render.setItems(inputs ?? [])
      this.componentsRender.render.setItems(components ?? [])
      this.priceListRender.render.setItems(priceList.categories.flatMap(category => category.items))
      this.summaryRender.render.setItems(summary ?? [])
   }

   /**
    * Atualiza a filtragem de todas as renders 
    */
   updateFiltering(searchText) {
      this.inputsRender.render.updateFilterFunction((items) => items.filter((input) => {
         return Utils.normalizeString(this.getAllInputText(input)).includes(Utils.normalizeString(searchText))
      }))

      this.componentsRender.render.updateFilterFunction((items) => items.filter((component) => {
         return Utils.normalizeString(this.getAllComponentText(component)).includes(Utils.normalizeString(searchText))
      }))

      this.priceListRender.render.updateFilterFunction((items) => items.filter((item) => {
         return Utils.normalizeString(this.getPriceListItemText(item)).includes(Utils.normalizeString(searchText))
      }))

      this.summaryRender.render.updateFilterFunction((items) => items.filter((item) => {
         return Utils.normalizeString(item.title).includes(Utils.normalizeString(searchText))
      }))
   }

   /**
    * Coloca um render como ativa 
    */
   setActiveRender(sheet) {
      this.removeAllRenders()
      this.sheetsContainer.append(sheet.getView())
   }

   /**
    * Remove todas as renders do layout
    */
   removeAllRenders() {
      this.getAllSheets().forEach(sheet => sheet.getView().detach())
   }

   /**
    * Cria um botão da topbar
    */
   createTopbarButton({ text, render }) {
      return new Item({

         onClick: () => this.setActiveRender(this[render]),
         cursor: 'pointer',
         css: 'noBorder isDatasheetTopbarBtn',
         columns: ['1fr'],
         left: Item.title(text).css('font-size', '14px'),

      }).getView()
   }

   /**
    * Cria uma mensagem de erro de fórmula
    */
   createFormulaErrorMessage({ title, message, formulaID, variables, formula }) {

      const itemTag = Item.tag(formulaID, 'var(--red)', 'white')
      const itemTitle = Item.title(title)
      const itemDesc = Item.desc(message)

      itemTag.css({
         padding: '0.25rem 0.5rem',
         fontSize: '12px',
         height: '100%',
         aspectRatio: '1/1',
         display: 'grid',
         placeItems: 'center'
      })

      itemTitle.css({
         fontSize: '14px'
      })

      itemDesc.css({
         fontSize: '12px',
         color: 'var(--primary)'
      })

      let isOpen = false

      const openFormulaTab = () => {
         if (!isOpen) new FormulaTestTab({
            autoOpen: true,
            formula: '//Váriaveis;\n\n' + Object.entries(variables).map(([key, value]) => `[${key}] = ${value};`).join('\n') + '\n\n//Formula;\n\n' + formula,
            onClose: () => isOpen = false,
            onOpen: () => isOpen = true
         })
      }

      const itemError = new Item({
         onClick: () => openFormulaTab(),
         cursor: 'pointer',
         columns: ['min-content', '1fr', 'min-content'],
         left: itemTag,
         center: [itemTitle, itemDesc],
         style: {
            item: {
               marginTop: '0.5rem',
               width: 'fit-content',
               backgroundColor: '#c84c4f38'
            },
            main: {
               width: 'fit-content',
               padding: '0.5rem'
            },
            center: {
               rowGap: '0px',
               justifyContent: 'center'
            },
         }
      })

      new Tooltip({
         on: itemError.getView(),
         content: Tooltip.text('Clique para ver mais detalhes'),
         position: 'right'
      })

      return itemError.getView()
   }

   /**
    * Retorna todo o texto de um insumo 
    */
   getAllInputText(input) {
      return [
         input.name,
         input.groupName,
         input.optionTitle,
         input.consumn,
         input.cMessage?.message,
         input.cMessage?.title,
         input.wMessage?.message,
         input.wMessage?.title,
         input.tMessage?.message,
         input.tMessage?.title,
      ].filter(Boolean).join(' ')
   }

   /**
    * Retorna o texto de uma linha da tabela de preço 
    */
   getPriceListItemText(item) {
      return [
         item.name,
         item.category,
         item.method,
         item.price,
         item.itemCategory
      ].filter(Boolean).join(' ')
   }

   /**
    * Retorna otdos os textos dos componentes  
    */
   getAllComponentText(component) {
      return [
         component.description,
         component.optionTitle,
         component.formula,
         component.meas,
         component.reference,
         component.title,
         component.weightFormula,
         component.consum
      ].filter(Boolean).join(' ')
   }

   /**
 * Desliga todas as renders
 */
   disableAllRenders() {
      this.getAllSheets().forEach(sheet => {
         sheet.render.disableRender()
         sheet.render.empty()
      })
   }

   /**
    * Liga todas as renders 
    */
   enableAllRenders() {
      this.getAllSheets().forEach(sheet => {
         sheet.render.enableRender()
         sheet.render.renderItems()
      })
   }

   /**
    * Retorna todas as renderes desta aba 
    */
   getAllSheets() {
      return [
         this.inputsRender,
         this.componentsRender,
         this.priceListRender,
         this.summaryRender,
      ]
   }

   /**
    * Retorna os json do botões da topbar 
    */
   getTopbarButtons() {
      return [
         {
            text: 'Insumos',
            render: 'inputsRender'
         },
         {
            text: 'Componentes',
            render: 'componentsRender'
         },
         {
            text: 'Tabela de Preço',
            render: 'priceListRender'
         },
         {
            text: 'Resumo',
            render: 'summaryRender'
         },
      ]
   }

   /**
    * Retorna o layout dos insumos 
    */
   getInputsLayout() {
      return [
         {
            align: 'left',
            label: 'Insumo',
            keys: ['name', 'groupName', 'optionTitle', 'cMessage', 'wMessage', 'tMesssage'],
            size: '55%',
            transform: (name, groupName, optionTitle, cMessage, wMessage, tMessage) => [
               optionTitle,
               Sheet.bold(name),
               groupName,
               cMessage ? this.createFormulaErrorMessage(cMessage) : null,
               wMessage ? this.createFormulaErrorMessage(wMessage) : null,
               tMessage ? this.createFormulaErrorMessage(tMessage) : null,
            ]
         },
         {
            label: 'Consumo',
            keys: ['consum', 'unitMeas', 'calculations'],
            size: '15%',
            transform: (consumn, unitMeas, calculations) => {
               const treatedConsumn = parseFloat(Number(consumn).toFixed(3)) + ' ' + unitMeas
               const wasFormulaUsed = (calculations?.consumn?.code === 0) && (calculations?.consumn?.result)

               const consumnText = Sheet.bold(treatedConsumn)
               const detailsButton = Sheet.desc('Detalhes')

               let isOpen = false

               const openFormulaTab = () => {
                  if(!isOpen) new FormulaTestTab({
                     onOpen: () => isOpen = true,
                     onClose: () => isOpen = false,
                     autoOpen: true,
                     formula: [
                        '//Váriáveis;\n\n',
                        ...Object.entries(calculations.consumn.variables).map(([key, value]) => `[${key}] = ${value};\n`),
                        '\n//Fórmula;\n\n',
                        calculations.consumn.formula
                     ].join('')
                  })
               }

               if(!wasFormulaUsed){
                  return consumnText
               }

               return Sheet.pointer(consumnText, detailsButton).click(() => openFormulaTab())
            }
         },
         {
            label: 'Peso',
            size: '10%',
            transform: () => '---'
         },
         {
            label: 'Custo',
            size: '10%',
            transform: () => '---'
         },
         {
            label: 'Total',
            size: '10%',
            transform: () => '---'
         }
      ]
   }

   /**
    * Retorna os layouts dos componentes 
    */
   getComponentsLayout() {
      return [
         {
            size: '70%',
            align: 'left',
            keys: ['title', 'description'],
            label: 'Opcional',
            transform: (title, description) => [
               Sheet.bold(title),
               Sheet.desc(description)
            ]
         },
         {
            size: '15%',
            keys: ['formula'],
            label: 'Consumo',
            fallback: '---',
            transform: (formulas) => {
               const consumnText = Sheet.bold(formulas.consumn.calculation.result ?? '0,00')
               const detailsButton = Sheet.desc('Detalhes')

               let isOpen = false

               const openFormulaTab = () => {
                  console.log(formulas);
                  if(!isOpen) new FormulaTestTab({
                     onOpen: () => isOpen = true,
                     onClose: () => isOpen = false,
                     autoOpen: true,
                     formula: [
                        '//Váriáveis;\n\n',
                        ...Object.entries(formulas.consumn.calculation.variables).map(([key, value]) => `[${key}] = ${value};\n`),
                        '\n//Fórmula;\n\n',
                        formulas.consumn.calculation.formula
                     ].join('')
                  })
               }

               // if(!wasFormulaUsed){
               //    return consumnText
               // } 
 
               return Sheet.pointer(consumnText, detailsButton).click(() => openFormulaTab())
            }
         },
         {
            size: '15%',
            keys: ['formula'],
            label: 'Peso',
            fallback: '---',
             transform: (formulas) => {

               const consumnText = Sheet.bold(formulas.weight.calculation.result ?? '0,00')
               const detailsButton = Sheet.desc('Detalhes')

               let isOpen = false 

               const openFormulaTab = () => {
                  console.log(formulas);
                  if(!isOpen) new FormulaTestTab({
                     onOpen: () => isOpen = true,
                     onClose: () => isOpen = false,
                     autoOpen: true,
                     formula: [
                        '//Váriáveis;\n\n',
                        ...Object.entries(formulas.weight.calculation.variables).map(([key, value]) => `[${key}] = ${value};\n`),
                        '\n//Fórmula;\n\n',
                        formulas.weight.calculation.formula
                     ].join('') 
                  })
               }

               // if(!wasFormulaUsed){
               //    return consumnText
               // } 
 
               return Sheet.pointer(consumnText, detailsButton).click(() => openFormulaTab())
            } 
            // transform: (formula) => {
            //    const weightCalculation = formula.weight
            //    const result = Sheet.bold(weightCalculation.calculation.result ?? '0,00')
            //    const detailsButton = Sheet.desc('Detalhes')

            //    console.log(weightCalculation);

            //    return Sheet.pointer(
            //       result,
            //       detailsButton
            //    )
            // }
         }
      ]
   }

   /**
    * Retorna o layout da tabela de preço 
    */
   getPriceListLayout() {
      return [
         {
            keys: ['name', 'itemCategory', 'priceMultiplier', 'formulaResult'],
            align: 'left',
            size: '40%',
            label: 'Referente',
            transform: (name, itemCategory, priceMultiplier, formulaResult) => {

               const items = [Sheet.bold(name), itemCategory]
               
               if(priceMultiplier){
                  const openFormulaTab = () => {
                     new FormulaTestTab({
                        autoOpen: true,
                        formula: [
                           '//Váriáveis;\n\n',
                           ...Object.entries(formulaResult.variables).map(([key, value]) => `[${key}] = ${value};\n`),
                           '\n//Fórmula;\n\n',
                           formulaResult.formula
                        ].join('')
                     })
                  }

                  items.push(new Badge({
                     onClick: () => openFormulaTab(),
                     static: true,
                     round: false,
                     title: 'Detalhes',
                     style: { border: '1px solid var(--fourth)', marginTop: '0.25rem' },
                     transform: [0, 0],
                     cursor: 'pointer',
                     textColor: 'var(--primary)',
                     color: 'var(--secondary)',
                     icon: 'ic-design2'
                  }).getView())
               }

               return items
            }
         },
         {
            size: '10%',
            keys: ['method'],
            label: 'Cobr'
         },
         {
            size: '8%',
            keys: ['quantity'],
            label: 'Qtd',
            footer: {
               label: 'Desc. Extras',
            }
         },
         {
            size: '16%',
            keys: ['unitary', 'methodUsed', 'priceMultiplier'],
            label: 'Uni',
            transform: (unitary, methodUsed, priceMultiplier) => {

               let formatedUnitary = priceMultiplier ? parseFloat((unitary / priceMultiplier).toFixed(2)) : unitary
               let formatedValue = formatedUnitary * methodUsed * (priceMultiplier ?? 1)

               const afterMethod = new P().text(`${CURRENCY} ${Utils.formatCurrency(formatedValue)}`)
               const unitaryVal = new P().text(`(${CURRENCY} ${Utils.formatCurrency(formatedUnitary)}${methodUsed & methodUsed !== 1 ? ` x ${methodUsed}` : ''}${priceMultiplier && priceMultiplier !== 1 ? ` x ${priceMultiplier}` : ''})`)

               new Tooltip({
                  on: unitaryVal,
                  header: Tooltip.title('Valores'),
                  style: { width: '200px' },
                  content: [
                     Tooltip.dot('Preço: ' + CURRENCY + Utils.formatCurrency(formatedUnitary)),
                     Tooltip.dot('Cobrança: ' + methodUsed),
                     Tooltip.dot('Fórmula de Preço: ' + (priceMultiplier ?? 'Nenhuma'))
                  ]
               })

               unitaryVal.css({
                  color: 'var(--fifth)',
               })

               if(methodUsed === 1 && !priceMultiplier){
                  return afterMethod
               }

               return [afterMethod, unitaryVal]
            },
            footer: {
               transform: () => {
                  if (!this.priceListData) return '---'
                  if(!this.priceListData.tax.percent && !this.priceListData.freight.percent) return '---'

                  const taxValue = Sheet.bold(this.priceListData.tax.percent + '%')
                  const freightValue = Sheet.bold(this.priceListData.freight.percent + '%')

                  taxValue.add(freightValue).css({
                     display: 'inline-block',
                     cursor: 'pointer',
                     color: 'var(--orange)'
                  })

                  new Tooltip({
                     position: 'top',
                     on: taxValue,
                     background: 'var(--orange)',
                     header: Tooltip.title(`Impostos (${this.priceListData.tax.percent}%)`),
                     content: Tooltip.text('- ' + CURRENCY + this.priceListData.tax.value)
                  })

                  new Tooltip({
                     position: 'top',
                     on: freightValue,
                     background: 'var(--orange)',
                     header: Tooltip.title(`Frete (${this.priceListData.freight.percent}%)`),
                     content: Tooltip.text('- ' + CURRENCY + this.priceListData.freight.value)
                  })

                  return [taxValue, ' + ', freightValue]
               }
            }
         },
         {
            size: '10%',
            keys: ['discounts', 'methodUsed'],
            label: 'Desc',
            css: (discounts) => ({ color: discounts.length ? 'var(--red)' : 'var(--primary)' }),
            transform: (discounts, methodUsed) => {

               const hasDiscount = !!discounts.length
               const discountNodes = discounts.map(({ type, value, discounted, promotion }) => {

                  const textToUse = type === 1 ? value + '%' : `${CURRENCY} ` + value
                  const textNode = Sheet.bold(textToUse)
                  const plusNode = Sheet.bold(' + ')

                  textNode.css('display', 'inline-block')
                  textNode.css('cursor', 'pointer')
                  plusNode.css('display', 'inline-block').css('color', 'var(--primary)')

                  new Tooltip({
                     on: textNode,
                     position: 'bottom',
                     background: promotion ? 'var(--orange)' : 'var(--red)',
                     header: Tooltip.title(`${promotion ? 'Promoção' : 'Desconto'} (${textToUse})`),
                     content: Tooltip.text('- ' + CURRENCY + (type === 1 ? Number(discounted * methodUsed).toFixed(2) : Number(discounted).toFixed(2)))
                  })

                  promotion
                     ? textNode.css('color', 'var(--orange)')
                     : textNode.css('color', 'var(--red)')

                  return [textNode, plusNode]
               })

               if (!hasDiscount) return '---'

               return discountNodes.flat(1).slice(0, -1)
            },
            footer: {
               label: 'Total',
            }
         },
         {
            size: '16%',
            keys: ['price'],
            label: 'Total',
            transform: (price) => {

               const finalValue = Sheet.bold(`${CURRENCY} ${Utils.formatCurrency(price)}`)

               finalValue.css('color', 'var(--green)')

               return finalValue
            },
            footer: {
               transform: () => this.priceListData ? `${CURRENCY} ` + this.priceListData.total : '---',
               css: { color: 'var(--green)' }
            }
         }
      ]
   }

   /**
    * Retorna o layout da tabela do sumário 
    */
   getSummaryLayout() {
      return [
         {
            keys: ['title'],
            align: 'left',
            size: '80%',
            bold: true,
            label: 'Referente',
            footer: {
               label: 'Total',
               align: 'right'
            }
         },
         {
            keys: ['value', 'quantity'],
            transform: (value, quantity) => quantity ? 'X ' + value : `${CURRENCY} ${Number(value).toFixed(2)}`,
            size: '20%',
            bold: true,
            label: 'Total',
            css: {
               color: 'var(--green)'
            },
            footer: {
               transform: (items) => {

                  const total = items.reduce((total, item) => item.quantity ? total : total + Number(item.value), 0)

                  return `${CURRENCY} ${Utils.formatCurrency(total)}`
               },
               css: {
                  color: 'var(--green)'
               }
            }
         }
      ]
   }
}