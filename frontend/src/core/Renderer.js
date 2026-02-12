import { Div, Icon, P } from '../utils/Prototypes.js'
import Loader from '../components/Loader.js'
import $ from 'jquery'

export default class Renderer {
   constructor({
      css,
      items = [],
      rowGap = '1rem',
      columnGap = '1rem',
      identifierKey = 'id',
      animation = 'appear',
      columnCount = [1],
      hasAnimation = false,
      style = {},
      canRender = true,
      hasGoToTopButton = true,
      messageOnEmpty = 'Nada encontrado',
      whenScrollHitBottom = () => { },
      hasLoader = true,
      onRender = () => { },
      iconOnEmpty = 'ic-info-circle',
      appendTo,
      flatMap = false,
      filterFunc,
      createFunc,
      swiper = false,
      sortFunc
   }) {

      this.wrapper = new Div('SP__render')
      this.grid = new Div('SP__render__grid')
      this.loader = new Loader()
      this.items = items
      this.flatMap = flatMap
      this.filterFunc = filterFunc
      this.identifierKey = identifierKey
      this.hasGoToTopButton = hasGoToTopButton
      this.messageOnEmpty = messageOnEmpty
      this.iconOnEmpty = iconOnEmpty
      this.whenScrollHitBottom = whenScrollHitBottom
      this.hasAnimation = hasAnimation
      this.animation = animation
      this.canRender = canRender
      this.hasLoader = hasLoader
      this.swiper = swiper
      this.bottomMessage = null
      this.isFirstRender = true
      this.appendTo = (appendTo ?? this.grid)
      this.onRender = onRender

      //CSS
      this.wrapper.addClass(css)
      this.rowGap = rowGap
      this.columnGap = columnGap
      this.columnCount = columnCount

      //FUNÇÔES
      this.createFunc = createFunc
      this.sortFunc = sortFunc

      this.wrapper.css(style)
      this.wrapper.append(this.title)
      this.wrapper.append(this.grid)

      new ResizeObserver(() => this.handleColumnCount()).observe(document.body)

      //INICIALIZANDO
      this.applyCSS()
      this.handleColumnCount()
      this.renderItems()
      this.setupStartButton()
      this.setScrollListener()

      setTimeout(() => {
         if (this.swiper) {
            this.wrapper.addClass('swiper')
            this.grid.addClass('swiper-wrapper')

            const swiperConfig = {
               slidesPerView: 4
            }
   
            this.swiper = new Swiper(this.wrapper[0], $.extend(swiperConfig, this.swiper))
         }
      })
   }

   setScrollListener() {
      let isTimeoutOn = null

      this.wrapper.on('scroll', ({ target }) => {
         const isScrollAtBottom = Math.abs(target.scrollHeight - target.clientHeight - target.scrollTop) < 1
         const hasSomeFunction = this.whenScrollHitBottom
         const shouldFunctionRun = !isTimeoutOn && hasSomeFunction && isScrollAtBottom

         if (shouldFunctionRun) {
            isTimeoutOn = true
            setTimeout(() => isTimeoutOn = false, 200)
            this.whenScrollHitBottom()
         }
      })
   }

   handleColumnCount() {
      if (window.innerWidth < 600) {

         this.grid.css('grid-template-columns', '1fr '.repeat(this.columnCount[0] ?? 1))

      } else if (window.innerWidth < 1280) {

         this.grid.css('grid-template-columns', '1fr '.repeat(this.columnCount[1] ?? this.columnCount[0] ?? 1))

      } else {

         this.grid.css('grid-template-columns', '1fr '.repeat(this.columnCount[2] ?? this.columnCount[1] ?? this.columnCount[0] ?? 1))

      }
   }

   setBottomMessage(message) {
      this.bottomMessage?.remove()
      this.bottomMessage = new Div('SP__render__message')
      this.bottomMessage.text(message)
      this.bottomMessage.click(() => this.scrollToRenderTop())
      this.wrapper.append(this.bottomMessage)
   }

   scrollToRenderTop() {
      this.wrapper.animate({ scrollTop: 0 }, 700)
   }

   changeColumnCount(count) {
      this.columnCount = count
      this.applyCSS()
      this.animateItems()
   }

   checkIfScrollIsAtMax(element) {
      return element[0].scrollHeight - element[0].scrollTop === element[0].clientHeight
   }

   setupStartButton() {
      if (!this.hasGoToTopButton) return

      const startButton = new Icon('SP__render__start')
      startButton.addClass('ic-up')
      startButton.attr('active', false)
      startButton.click(() => this.scrollToRenderTop())
      this.wrapper.on('scroll', () => {
         const rendererScroll = this.wrapper.scrollTop()
         const shouldButtonBeVisible = rendererScroll >= 500
         startButton.attr('active', shouldButtonBeVisible)
      })

      this.wrapper.prepend(startButton)
   }


   setLoader() {
      this.appendTo.find('.SP__empty').remove()
      this.appendTo.append(this.loader.getView())
   }

   hideLoader() {
      this.loader.getView().remove()
   }

   empty() {
      this.appendTo.empty()
   }

   getGridChildren() {
      return [...this.appendTo.children()]
   }

   createOption({ icon, onClick }) {
      const option = new Icon('SP__render__options__icon')

      option.addClass(icon)
      option.click(() => {
         option.siblings().attr('active', false)
         option.attr('active', true)
         onClick()
      })

      return option
   }

   applyCSS() {
      this.appendTo.css('columnGap', this.columnGap)
      this.appendTo.css('rowGap', this.rowGap)
      this.appendTo.css('grid-template-columns', '1fr '.repeat(this.columnCount))
   }

   addItems(...items) {
      this.items.push(...items)
      this.renderItems({
         shouldScrollToTop: false,
         animationTargets: { start: -items.length }
      })
   }

   setItems(items) {
      this.items = items
      this.renderItems()
   }

   editItem(identifier, newValue) {
      this.items[this.findItem(identifier)] = newValue
      this.renderItems()
   }

   deleteItem(identifier) {
      this.items.splice(this.findItem(identifier), 1)
      this.renderItems()
   }

   findItem(identifier) {
      return this.items.findIndex(item => item[this.identifierKey] === identifier)
   }

   getItems() {
      return this.items
   }

   throwError(message) {
      throw new Error(message)
   }

   createNodes(items) {
      return this.createFunc
         ? items[this.flatMap ? 'flatMap' : 'map']((data, index, array) => this.createFunc(data, index, array))
         : items[this.flatMap ? 'flatMap' : 'map']((data, index, array) => this.createSimpleView(data, index, array))
   }

   sortItems(items) {
      return this.sortFunc
         ? this.sortFunc([...items])
         : items
   }

   filterItems(items) {
      return this.filterFunc
         ? this.filterFunc([...items])
         : items
   }

   createSimpleView(itemData) {
      const itemView = new P('SP__render__grid__simple')
      itemView[0].innerText = JSON.stringify(itemData, null, 4)
      return itemView
   }

   changeSortFunc(newSortFunc) {
      this.sortFunc = newSortFunc
      this.renderItems()
   }

   renderItems({

      shouldAnimate = true,
      shouldScrollToTop = true,
      animationTargets = {}

   } = {}) {
      if (!this.canRender) return

      // if(this.items.length > 0){
      //    console.log(this.items);
      //    debugger
      // }
      
      
      const filtredItems = this.filterItems(this.items)
      const sortedItems = this.sortItems(filtredItems)
      const itemsNodes = this.createNodes(sortedItems)
      const isItemsEmpty = itemsNodes.length === 0

      if (this.swiper) {
         itemsNodes.forEach(node => {
            $(node).addClass('swiper-slide')
         })
      }

      this.appendTo.empty()
      this.appendTo.append(itemsNodes)

      if (shouldScrollToTop) {
         this.wrapper.scrollTop(0)
      }
      if (shouldAnimate) {
         const rangeStart = animationTargets.start ?? 0
         const rangeEnd = animationTargets.end ?? this.items.length
         const nodeTargets = itemsNodes.slice(rangeStart, rangeEnd)

         this.animateItems(nodeTargets)
      }

      
      
      if (isItemsEmpty) {
         this.isFirstRender && this.hasLoader
            ? this.setLoader()
            : this.setupEmptyMesssage()
      }

      if (this.onRender) {
         this.onRender(this)
      }

      this.isFirstRender = false
   }

   enableRender() {
      this.canRender = true
   }

   disableRender() {
      this.canRender = false
   }

   setupEmptyMesssage(config = {}) {

      console.trace('setupEmptyMesssage');
      
      const emptyWrapper = new Div('SP__empty')
      const emptyIcon = new Icon('SP__empty__icon')
      const emptyMessage = new P('SP__empty__message')

      emptyIcon.addClass((config.icon ?? this.iconOnEmpty))
      emptyMessage.text((config.message ?? this.messageOnEmpty))
      emptyWrapper.append(emptyIcon, emptyMessage)

      this.appendTo.find('.SP__empty').remove()
      this.appendTo.find('.SP__loader').remove()
      this.appendTo.append(emptyWrapper)
   }

   setupFailMessage(message) {
      this.setupEmptyMesssage({
         icon: 'ic-close',
         message: message
      })
   }

   updateFilterFunction(newFunction) {
      this.filterFunc = newFunction
      this.renderItems()
   }

   updateSortFunction(newFunction) {
      this.sortFunc = newFunction
      this.renderItems()
   }

   animateItems(targets) {
      if (!this.hasAnimation) return

      const { pastCSS, newCSS } = this.getAnimation(this.animation)

      targets.forEach((node) => $(node).css(pastCSS))
      targets.forEach((node, index) => setTimeout(() => {

         $(node).animate(newCSS, 300)

      }, 50 + 50 * index))
   }

   getAnimation(type) {
      const ANIMATIONS = {
         'appear': {
            pastCSS: { opacity: 0 },
            newCSS: { opacity: 1 }
         }
      }

      return ANIMATIONS[type]
         ? ANIMATIONS[type]
         : this.throwError(`Nenhuma animação encontrada. Busca: ${type}`)
   }

   getView() {
      return this.wrapper
   }
}