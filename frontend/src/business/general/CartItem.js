import Badge from '../../core/Badge.js'
import DotsMenu from '../../core/DotsMenu.js'
import Item from '../../core/Item.js'
import MoneyViewer from '../../core/MoneyViewer.js'
import Tooltip from '../../core/Tooltip.js'
import Utils from '../../core/Utils.js'
import DataCart from '../../system/DataCart.js'
import { STORAGE_URL } from '../../api/Variables.js'
import { Div } from '../../utils/Prototypes.js'
import Translator from '../../translation/Translator.js'

export default class CartItem {

   #dataCart
   #item
   #index
   #menu

   /**
    * Instância a classe
    * @param {object} props Os dados
    * @param {DataCart} props.dataCart O produto que deseja ser visualizado
    * @param {number} props.index O índice deste produto no carrinho
    * @param {DotsMenu | null} props.menu O menu de opções caso houver
   */
   constructor({
      dataCart,
      index,
      menu
   }) {
      this.#dataCart = dataCart
      this.#index = index
      this.#menu = menu
      this.#item = this.#createItem(dataCart)
   }

   /**
    * Retorna o item
    * @returns {Item} O item
    */
   #createItem() {
      return new Item({
         onClick: ({ ctrlKey }) => ctrlKey && console.log(this.#dataCart),
         columns: ['1fr', '2fr', '2fr'],
         style: this.#getCartItemStyle(),
         left: this.#createLeftSection(),
         center: this.#createCenterSection(),
         right: this.#createRightSection(),
         footer: this.#createFooter()
      })
   }

   /**
    * Cria a seção da esquerda do produto
    * @returns {JQuery<HTMLElement>[]} Os elementos
    */
   #createLeftSection() {
      const image = Item.image(STORAGE_URL + this.#dataCart.getProductImage())
      const badge = this.#createFinishedStateBadge()

      return [
         image,
         badge
      ]
   }

   /**
    * Cria a seção central do produto
    * @returns {JQuery<HTMLElement>[]} Os elementos
    */
   #createCenterSection() {
      const number = Item.brand(`#${this.#index + 1}`)
      const title = Item.title(this.#dataCart.getProductTitle())
      const measuresTag = this.#createMeasuresTag()

      return [
         number,
         title,
         measuresTag
      ]
   }

   /**
    * Cria a tag que mostra as medidas do produto
    * @returns {JQuery<HTMLDivElement>} A tag
    */
   #createMeasuresTag() {
      const totalMeasuresText = this.#createTotalMeasuresText()
      const tag = Item.tag(totalMeasuresText, 'var(--fifth)')

      if (this.#dataCart.getMeasuresAmount() > 1) {
         this.#applyMeasuresTooltip(tag)
      }

      return tag
   }

   /**
    * Retorna as medidas totais em um texto
    * @returns {string} O texto das medidas totais
    */
   #createTotalMeasuresText() {
      const { width, height, area } = this.#dataCart.getTotalMeasures()

      const totalMeasures = [
         `${Utils.formatDecimals(width, 2)}m`,
         'x',
         `${Utils.formatDecimals(height, 2)}m`,
         '=',
         `${Utils.formatDecimals(area, 2)}m²`
      ]

      return totalMeasures.join(' ')
   }

   /**
    * Cria a tooltip que contem o valor das medidas
    * @param {JQuery<HTMLDivElement>} tag A tag de medidas totais
    */
   #applyMeasuresTooltip(tag) {
      const measures = this.#dataCart.getMeasures()
      const measureNodes = measures.map((measure, index) => this.#createMeasureNode(measure, index))

      new Tooltip({
         on: tag,
         background: 'var(--fourth)',
         position: 'bottom',
         padding: '0.75rem',
         color: 'var(--primary)',
         parentPos: 'relative',
         content: measureNodes
      })
   }

   /**
    * Cria o texto que representa uma medida
    * @param {object} measure A medida
    * @param {number} index O índice da medida
    */
   #createMeasureNode(measure, index) {
      const letter = Utils.alphabet(true)[index]
      const text = this.#createMeasureText(measure)

      return Tooltip.text(`${letter}: ${text}`)
   }

   /**
    * Cria o texto que representa uma medida
    * @param {object} measure Uma medida 
    * @returns {string} O texto que representa a medida
    */
   #createMeasureText(measure) {
      const { width, height, area } = measure

      const totalMeasures = [
         `${Utils.formatDecimals(width, 2)}m`,
         'x',
         `${Utils.formatDecimals(height, 2)}m`,
         '=',
         `${Utils.formatDecimals(area, 2)}m²`
      ]

      return totalMeasures.join(' ')
   }

   /**
    * Cria a seção da direita do item
    * @returns {JQuery<HTMLElement>[]} OS elementos
    */
   #createRightSection() {
      console.log(Translator.tC('common:classification'));
      
    
      const price = new MoneyViewer({
         css: 'isCartProductMoney',
         value: this.#dataCart.extract?.total ?? 0
      })
       
      const environment = Item.desc(
         this.#dataCart.getEnvironment()?.title ?? Translator.tC('empty:environment')
      )

      return [
         environment,
         price.getView()
      ]
   }

   /**
    * Retorna a badge do estado da montagem do produto
    * @returns {JQuery<HTMLDivElement>} O elemento
    */
   #createFinishedStateBadge() {
      const finishedState = {
         fontSize: 18,
         icon: 'ic-check',
         color: 'var(--green)'
      }

      const unfinishedState = {
         fontSize: 13,
         icon: 'ic-warning',
         color: 'var(--orange)'
      }

      const activeState = this.#dataCart.isFinished
         ? finishedState
         : unfinishedState

      return new Badge({
         left: 8,
         top: 8,
         size: 22,
         round: false,
         ...activeState
      }).getView()
   }

   /**
    * Cria o footer do item
    * @returns {JQuery<HTMLDivElement>[]} O footer
    */
   #createFooter() {
      const options = this.#createFooterIconsSection()
      const description = this.#createFooterDescription()

      return [
         description,
         options
      ]
   }

   /**
    * Cria a seção do footer com ícones
    * @returns {JQuery<HTMLDivElement>}
    */
   #createFooterIconsSection() {
      const warrantyDays = this.#dataCart.getWarranty()?.days ?? 0
      const deliveryDays = this.#dataCart.daysToProduce ?? Translator.t('empty:information')

      const deliveryInfo = deliveryDays === 0 ? Translator.tC('empty:information') : Translator.t('amount:days', { count: deliveryDays })
      const warrantyInfo = Translator.t('amount:years', { count: Math.floor(warrantyDays / 365) })

      const warrantyIcon = Div()
         .css('position', 'relative')
         .append(Item.icon('ic-warranty'))

      const expressedIcon = Div()
         .css('position', 'relative')
         .append(Item.icon('ic-delivery'))

      const icons = [
         warrantyIcon,
         expressedIcon
      ]

      new Tooltip({
         on: warrantyIcon,
         position: 'top',
         content: Tooltip.text(warrantyInfo)
      })

      new Tooltip({
         on: expressedIcon,
         position: 'top',
         content: Tooltip.text(deliveryInfo)
      })

      if (this.#menu instanceof DotsMenu) {
         icons.push(this.#menu.getView())
      }

      return Item.row(icons)
   }

   /**
    * Retorna a descrição do footer
    * @returns {string} A descrição
    */
   #createFooterDescription() {
      const modelName = this.#dataCart.getModel()?.title || Translator.tC('empty:model')
      const lineName = this.#dataCart.getLine()?.title || Translator.tC('empty:line')
      const classificationName = this.#dataCart.getClassification()?.title ?? Translator.tC('empty:classification')
      const description = [modelName, lineName, classificationName].join(' / ')

      return Item.desc(description)
   }

   /**
    * Retorna a configuração de estilo do item
    * @returns {object} O item
    */
   #getCartItemStyle() {
      return {
         right: {
            alignItems: 'flex-end',
            justifyContent: 'space-between',
         }
      }
   }

   /**
    * Retorna a visualização do item
    * @returns {JQuery<HTMLDivElement>} O elemento
    */
   getView() {
      return this.#item.getView()
   }
}