import { Div, Icon, TBody, TFoot, THead, Table, Td, Tr } from "../utils/Prototypes.js"
import Renderer from "./Renderer.js"
import $ from 'jquery'
import SearchBar from './SearchBar.js'

export default class Sheet {
   constructor(config) {

      this.config = $.extend(true, {

         layout: [],
         css: "",
         maxHeight: 'min-content',
         scrollabe: false,
         whenScrollHitBottom: () => { },
         align: 'center',
         render: {
            items: [],
            createFunc: (...args) => this.createBodyItem(...args),
         }

      }, config)

      //Elementos
      this.master = new Div('SP__sheet')
      this.table = new Table('SP__sheet__table')
      this.thead = new THead('SP__sheet__table__head')
      this.tbody = new TBody('SP__sheet__table__body')
      this.tfoot = new TFoot('SP__sheet__table__footer')
      this.render = new Renderer({ appendTo: this.tbody, ...this.config.render })

      //Configurando
      this.master.append(this.table)
      this.master.addClass(this.config.css)
      this.table.append(this.thead, this.tbody)


      //Casos especiais
      if (this.config.scrollabe) {
         this.master.addClass('isScrollabe')
         this.initHeaderSizeObserver()
         this.setOnScrollBottomHitListener()
      }
      if(this.config.layout.some(item => !!item.footer)){
         this.table.append(this.tfoot)
      }
      if (this.config.maxHeight) {
         this.master.css('max-height', this.config.maxHeight)
         this.master.css('min-height', '100%')
      }
 

      if(this.config.filter){
         this.searchBar = new SearchBar(this.config.filter)
         this.master.prepend(this.searchBar.getView().css({zIndex:4}))
      }  

      //Inicializando
      this.update() 
   }

   /**
    * Atualiza o header e o footer
    */
   update() {
      const headerNodes = this.config.layout.map(item => this.createHeaderItem(item))
      const footerNodes = this.config.layout.map(item => this.createFooterItem(item, this.render.getItems()))

      this.thead.empty()
      this.thead.append(...headerNodes)
      this.tfoot.empty()
      this.tfoot.append(...footerNodes)
   }

   /**
    * Adiciona um observador para a tabela com scroll
    */
   initHeaderSizeObserver() {
      let canRunCheck = true

      new ResizeObserver(([entry]) => {
         if (!canRunCheck) return

         canRunCheck = false
         setTimeout(() => canRunCheck = true, 1000 / 30)

         // Removed border-top setting for sticky positioning

      }).observe(this.thead[0])
   }

   /**
    * Adiciona o evento de scroll na tabela
    */
   setOnScrollBottomHitListener() {
      this.master.on('scroll', (event) => {
         const { scrollHeight, scrollTop, clientHeight } = event.target;
         const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1

         if (!isAtBottom) return

         this.config.whenScrollHitBottom()
      })
   }

   /**
    * Cria um item do footer 
    */
   createFooterItem({ size, footer }, data) {
      if(!footer) return new Td('SP__sheet__table__footer__item').css('width', size)

      const footerItem = new Td('SP__sheet__table__footer__item')

      footerItem.css('width', size)
      footerItem.css('text-align', footer.align ?? this.config.align)
      footerItem.css(footer.css ?? {})

      if (footer.label) {
         footerItem.append(footer.label)
      } else if (footer.transform) {
         footerItem.append(footer.transform(data))
      }

      return footerItem
   }

   /**
    * Cria um item do header
    */
   createHeaderItem({ label, align, size, labelClick, cursor }) {
      const headerItem = new Td('SP__sheet__table__head__item')

      headerItem.css('width', size)
      headerItem.css('text-align', align ?? this.config.align)
      headerItem.append(label)
      headerItem.click(() => labelClick && labelClick())
      headerItem.css('cursor', cursor ?? 'default')

      return headerItem
   }

   /**
    * Cria um item do corpo baseando se no header
    */
   createBodyItem(data, itemIndex, itemArray) {
      const itemRow = new Tr('SP__sheet__table__body__row')
      const allColumns = this.config.layout.map(({ keys = [], fallback, onClick, transform, css, bold, fontSize, color, size, align, joiner }) => {
         const column = new Td('SP__sheet__table__body__row__column')

         if(onClick){
            column.click((event) => onClick(event, data))
         }

         //Decidindo o texto
         const allValues = keys.map(key => data[key])

         
         const normalValue = allValues.join(joiner ?? ', ')
         const transformedVal = transform ? transform(...allValues, itemIndex, itemArray) : null
         const valueToPlace = transformedVal ?? normalValue ?? fallback ?? "[Erro]"
         
         
         //Decidindo o CSS
         const cssToPlace = typeof css === 'function' ? css(...allValues, itemIndex, itemArray) : css ?? null

         //Configurando
         if (size) column.css('width', size)
         if (bold) column.css('font-weight', 'bold')
         if (color) column.css('color', color)
         if (align) column.css('text-align', align)
         if (fontSize) column.css('font-size', fontSize + 'px')
         if (cssToPlace) column.css(cssToPlace)
         if (valueToPlace) column.append(valueToPlace)

         return column
      })

      //Clique
      if (this.config.rowClick) {
         itemRow.css('cursor', 'pointer')
         itemRow.click(() => this.config.rowClick(data))
      }

      //Montando
      itemRow.append(allColumns)

      return itemRow
   }

   /**
    * Retorna o header da tabela
    */
   getHeader() {
      return this.thead
   }

   /**
    * Retorna o nome que está sendo usado em todo o cabeçalho
    */
   getHeaderTitles(){
      return this.config.layout.map(config => config.label)
   }

   /**
    * Retorna o corpo da tabela 
    */
   getBody() {
      return this.tbody
   }

   /**
    * Retorna o node HTML 
    */
   getView() {
      return this.master
   }

   static block(...items) {
      return new Div('SP__sheet__block').append(...items)
   }

   static bold(...items) {
      return new Div('SP__sheet__bold').append(...items)
   }

   static desc(...items){
      return new Div('SP__sheet__desc').append(...items)
   }

   static pointer(...items){
      return new Div('SP__sheet__pointer').append(...items)
   }
   
   static capitalize(...items){
      items.forEach(item => item.addClass('SP__sheet__capitalize'))
      return $(...items)
   }
}