import { STORAGE_URL } from '../../api/Variables.js'
import Dropdown from '../../core/Dropdown.js'
import Tab from '../../components/Tab.js'
import MoneyViewer from '../../core/MoneyViewer.js'
import { Div, H3, Icon, P } from '../../utils/Prototypes.js'
import DotsMenu from '../../core/DotsMenu.js'
import Renderer from '../../core/Renderer.js'
import Badge from '../../core/Badge.js'
import Item from '../../core/Item.js'
import Utils from '../../core/Utils.js'

export default class ProductPriceTab extends Tab {
   constructor(config) {
      super({
         css: 'isProductPriceTab',
         scrollable: true,
         hasTitle: false,
         hasDesc: false,
         hasInfo: false,
         hasRightButton: false,
         hasLeftButton: false,
         hasLoader: true,
         ...config
      })

      //Dados
      this.product = this.config.product
      this.allProducts = this.config.allProducts
      this.isFinished = this.product.isFinished
      this.showMarkup = this.config.showMarkup
      this.productIndex = this.allProducts.findIndex(product => product.identifier === this.product.identifier)
      this.priceData = this.getPricingData(this.product)
      this.dropdowns = this.createAllCategories(this.priceData)

      //O dinheiro total do produto
      this.moneyViewer = new MoneyViewer({
         description: 'TOTAL DO PRODUTO',
         value: Utils.formatCurrency(this.showMarkup ? this.product.extract.markuped : this.product.extract.total)
      })

      //Badge de produto concluído ou não
      this.finishedProdBadge = new Badge({
         round: false,
         fontSize: 15,
         transform: ['0%', '0%'],
         title: this.isFinished ? 'Concluído' : 'Não concluído',
         hasTitle: true,
         icon: this.isFinished ? 'ic-check' : 'ic-close',
         color: `var(--${this.isFinished ? 'green' : 'red'})`,
         static: true,
      })

      //Card do produto no topo
      this.productPreview = new Item({
         style: {
            item: { width: '100%' }
         },
         css: 'noBorder noPadding',
         columns: ['60px', '1fr'],
         left: Item.image(STORAGE_URL + this.product.product.image),
         center: [
            Item.title(`${this.product.product.title} #${this.productIndex + 1}`),
            Item.desc([this.product.model.title ?? 'Sem modelo', this.product.model?.classification.title ?? 'Sem classificação', this.product.line.title ?? 'Sem linha'].filter(Boolean).join(' / ')),
            this.finishedProdBadge.getView()
         ]
      })

      this.header.addClass('isProductPreview hasBorderBottom')

      //Montando
      this.prependToHeader(this.productPreview.getView())
      this.appendToFooter(this.moneyViewer.getView())
      this.appendToContent(this.dropdowns.map(dropdown => dropdown.getView()))

      //Atualizando os dropdowns
      this.dropdowns.forEach(dropdown => dropdown.update())

      //Caso houver mais de um produto
      if (this.allProducts.length > 1) {
         this.appendToHeader(this.createNavigationTab())
      }
   }


   /**
    * Cria um menu de navegação para navegar entre os detalhes dos produtos
    */
   createNavigationTab() {
      const navigationTab = new Div('SP__navigation')
      const leftProduct = this.allProducts[this.productIndex - 1]
      const rightProduct = this.allProducts[this.productIndex + 1]
      const navItems = []

      //Fecha a aba atual e abre a próxima
      const openNewProductPriceTab = (product) => {
         this.close()
         new ProductPriceTab({
            autoOpen: true,
            product: product,
            allProducts: this.allProducts
         })
      }

      //Cria um item do nav
      const createNavItem = ({ title, type, onClick }) => {
         const itemWrapper = new Div('SP__navigation__item')
         const itemTitle = new P('SP__navigation__item__title')
         const itemArrow = new Icon('SP__navigation__item__icon')

         itemTitle.text(title)
         itemWrapper.click(() => onClick())

         if (type === 'left') {
            itemArrow.addClass('ic-prev')
            itemWrapper.addClass('isLeft')
            itemWrapper.append(itemArrow, itemTitle)
         }
         if (type === 'right') {
            itemArrow.addClass('ic-next')
            itemWrapper.addClass('isRight')
            itemWrapper.append(itemTitle, itemArrow)
         }
         if (type === 'center') {
            itemWrapper.addClass('isCenter')
            itemWrapper.append(itemTitle)
         }

         return itemWrapper
      }

      //Item com o nome do produto
      navItems.push({
         type: 'center',
         title: `${this.productIndex + 1} / ${this.allProducts.length}`,
         hasArrow: false
      })

      //Caso tiver um produto na esquerda
      if (leftProduct) {
         navItems.push({
            type: 'left',
            title: 'Anterior',
            onClick: () => openNewProductPriceTab(leftProduct)
         })
      }

      //Caso tiver um produto na direita
      if (rightProduct) {
         navItems.push({
            type: 'right',
            title: 'Próximo',
            onClick: () => openNewProductPriceTab(rightProduct)
         })
      }

      return navigationTab.append(navItems.map(createNavItem))
   }

   /**
    * Retorna os dados do produto com suas respectivas precificações 
    */
   getPricingData(product) {
      const cartGroups = product.group
      const pricingGroups = new Map()
      const allPriceItems = product.price

      //Modelo/Classificação/Linha
      const modelTotalPrice = allPriceItems.filter(item => item.type === 2).reduce((total, item) => total + item.price, 0)
      const hasClassification = product.model?.classification?.id

      pricingGroups.set('Outros', [
         { title: `${product.model.title} ${hasClassification ? '- ' + product.model.classification.title : ''}`.trim() || 'Sem modelo', desc: 'Modelo', price: modelTotalPrice },
         { title: product.line.title ?? 'Sem linha', desc: 'Linha', price: 0 },
      ])


      //Montando os grupos do carrinho
      for (let group of product.group) {
         pricingGroups.set(group.id, [])
      }

      //Passando por cada grupo do carrinho
      cartGroups.forEach(group => {
         const allCompositions = group.composition ?? []

         //Pàssando por todos as composições do grupo
         allCompositions.forEach(composition => {

            //Pegando os items que foram precificados em cima dessa composição
            const pricedUponItems = allPriceItems.filter(item => item.tokenParent === composition.tokenParent)
            const hasSomeItemPriced = pricedUponItems.length > 0
            const everyItemsIsFromThisGroup = pricedUponItems.every(item => Number(item.groupID) === Number(group.id))

            //Caso não tiver nenhum item coloque no grupo sem preço
            if (!hasSomeItemPriced) {
               pricingGroups.get(group.id).push({
                  title: composition.description,
                  desc: composition.optionTitle,
                  forms: composition.form,
                  price: null
               })
               return
            }

            //Caso os items não forem deste grupo
            if (!everyItemsIsFromThisGroup) {
               pricedUponItems.forEach(item => {
                  pricingGroups.get(item.groupID).push({
                     origin: `Origem: ${group.title}`,
                     title: composition.description,
                     desc: composition.optionTitle,
                     forms: composition.form,
                     price: Utils.formatCurrency(this.showMarkup ? item.markupPrice : item.price)
                  })
               })
               return
            }

            //Caso seja deste mesmo grupo
            pricingGroups.get(group.id).push({
               title: composition.description,
               desc: composition.optionTitle,
               forms: composition.form,
               price: Number(pricedUponItems.reduce((total, item) => total + (this.showMarkup ? item.markupPrice : item.price), 0).toFixed(2))
            })
         })

      })

      return pricingGroups
   }

   createAllCategories(priceData) {
      return Array.from(priceData).map(([key, items], index, array) => {

         //Título e preço da categoria
         const categoryTotal = items.reduce((total, item) => isNaN(item.price) ? total : total + item.price, 0)
         const isEmpty = items.length === 0
         const dropdownTitle = isNaN(key) ? key : this.product.group.find(group => Number(group.id) === Number(key)).title

         //Render dos items interiores
         const itemsRender = new Renderer({
            createFunc: (item) => this.createItem(item),
            items: items,
            hasAnimation: true,
            rowGap: 0,
            css: 'noInnerPadding',
            hasGoToTopButton: false,
         })

         //Altera o sort e abre o dropdown
         const updateDropdownSort = (newFunction) => {
            itemsRender.changeSortFunc(newFunction)
            dropdown.open()
         }

         //Opções de ordenação
         const sortOptions = new DotsMenu({
            icon: 'ic-bars2',
            isBold: true,
            iconSize: 16,
            options: [
               {
                  text: 'Sem Ordernação',
                  onClick: () => updateDropdownSort(null)
               },
               {
                  text: 'Preço Crescente',
                  onClick: () => updateDropdownSort(items => items.sort((itemA, itemB) => itemB.price - itemA.price))
               },
               {
                  text: 'Preço Decrescente',
                  onClick: () => updateDropdownSort(items => items.sort((itemA, itemB) => itemA.price - itemB.price))
               },
               {
                  text: 'Ordem Alfabética',
                  onClick: () => updateDropdownSort(items => items.sort((itemA, itemB) => itemA.title < itemB.title ? -1 : itemA.title > itemB.title ? 1 : 0))
               }
            ]
         })

         const categoryTotalItem = new Item({
            columns: ['1fr', '1fr'],
            style: {
               item: { border: 'none' },
               main: { padding: '0px' },
               left: { justifyContent: 'center' },
               right: { alignItems: 'flex-end' }
            },
            left: Item.title('Total'),
            right: new MoneyViewer({
               value: Number(categoryTotal).toFixed(2),
               css: 'isMedium'
            }).getView()
         })

         //O dropdown da categoria
         const dropdown = new Dropdown({
            title: `${dropdownTitle} ${isEmpty ? '(Vazio)' : ''}`,
            css: 'isProductDetailsDropdown',
            open: isEmpty ? false : true,
            disabled: isEmpty,
            appendToContent: isEmpty ? [] : itemsRender.getView(),
            appendToOptions: isEmpty ? [] : sortOptions.getView(),
            appendToFooter: categoryTotal > 0 ? categoryTotalItem.getView() : []
         })

         dropdown.getView().css('animation-delay', (index * 150) + 'ms')
         dropdown.getView().css('z-index', array.length - index)

         return dropdown
      })
   }

   /**
    * Cria o preview do produto para ser adicionado no header 
    */
   createHeaderProductCard({ image, title, details }) {

      //Tratando/decidindo dados
      const IMAGE_IF_NULL = './assets/images/no-image.jpg'
      const imageSrc = image ? STORAGE_URL + image : IMAGE_IF_NULL
      const modelsAsText = (details ?? []).join(' / ')

      //Criando elementos
      const previewWrapper = new Div('SP__header__preview')
      const previewThumb = new Div('SP__header__preview__thumb')
      const previewInfo = new Div('SP__header__preview__info')
      const previewTitle = new H3('SP__header__preview__info__title')
      const previewDesc = new P('SP__header__preview__info__desc')

      //Configurando
      previewThumb.css('background-image', `url(${imageSrc})`)
      previewTitle.text(title)
      previewDesc.text(modelsAsText)

      //Montando
      previewInfo.append(previewTitle, previewDesc)
      previewWrapper.append(previewThumb, previewInfo)

      return previewWrapper
   }

   createItem({ title, desc, price, forms, origin }) {
      const accordion = new Div('SP__accordion isProductPriceDetails')
      const accordionItem = new Div('SP__accordion__item')
      const accordionOrigin = new P('SP__accordion__tip')
      const accordionTitle = new P('SP__accordion__title')
      const accordionDesc = new P('SP__accordion__desc')
      const accordionPrice = new MoneyViewer({
         value: price,
         description: '',
         css: 'isProductPriceMoney'
      })

      accordionTitle.text(title)
      accordionDesc.text(desc)
      accordion.append(accordionItem)
      accordionItem.append(accordionTitle, accordionDesc)

      if (origin) {
         accordion.addClass('hasTip')
         accordionItem.prepend(accordionOrigin)
         accordionOrigin.text(origin)
      }
      if (price > 0) {
         accordionItem.append(accordionPrice.getView())
      }

      return accordion
   }
}