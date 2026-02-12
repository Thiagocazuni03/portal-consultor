import $ from 'jquery'

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLUListElement>} Um elemento JQuery
 */
export function Ul(css) { return $('<ul>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLPreElement>} Um elemento JQuery
 */
export function Pre(css) { return $('<pre>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

export function Strong(css) { return $('<strong>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Footer(css) { return $('<footer>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLCanvasElement>} Um elemento JQuery
 */
export function Canvas(css) { return $('<canvas>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Code(css) { return $('<code>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Main(css) { return $('<main>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<SVGElement>} Um elemento JQuery
 */
export function Svg(css) { return $('<svg>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLTableElement>} Um elemento JQuery
 */
export function Table(css) { return $('<table>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLTableSectionElement>} Um elemento JQuery
 */
export function THead(css) { return $('<thead>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLTextAreaElement>} Um elemento JQuery
 */
export function TextArea(css) { return $('<textarea>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Header(css) { return $('<header>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Aside(css) { return $('<aside>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Section(css) { return $('<section>')[typeof css === 'object' ? 'css' : 'addClass'](css) }


/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Colgroup(css) { return $('<colgroup>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLTableColElement>} Um elemento JQuery
 */
export function Col(css) { return $('<col>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLHeadingElement>} Um elemento JQuery
 */
export function H1(css) { return $('<h1>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLHeadingElement>} Um elemento JQuery
 */
export function H2(css) { return $('<h2>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLHeadingElement>} Um elemento JQuery
 */
export function H3(css) { return $('<h3>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLHeadingElement>} Um elemento JQuery
 */
export function H4(css) { return $('<h4>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLHeadingElement>} Um elemento JQuery
 */
export function H5(css) { return $('<h5>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLHeadingElement>} Um elemento JQuery
 */
export function H6(css) { return $('<h6>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLIFrameElement>} Um elemento JQuery
 */
export function Iframe(css) { return $('<iframe>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLSpanElement>} Um elemento JQuery
 */
export function Span(css) { return $('<span>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLLabelElement>} Um elemento JQuery
 */
export function Label(css) { return $('<label>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLDivElement>} Um elemento JQuery
 */
export function Div(css) { return $('<div>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Article(css) { return $('<article>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLSelectElement>} Um elemento JQuery
 */
export function Select(css) { return $('<select>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLDetailsElement>} Um elemento JQuery
 */
export function Details(css) { return $('<details>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLDialogElement>} Um elemento JQuery
 */
export function Dialog(css) { return $('<dialog>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLFormElement>} Um elemento JQuery
 */
export function Form(css) { return $('<form>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLTableSectionElement>} Um elemento JQuery
 */
export function TBody(css) { return $('<tbody>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLTableRowElement>} Um elemento JQuery
 */
export function Tr(css) { return $('<tr>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLTableCellElement>} Um elemento JQuery
 */
export function Td(css) { return $('<td>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLTableCellElement>} Um elemento JQuery
 */
export function Th(css) { return $('<th>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLImageElement>} Um elemento JQuery
 */
export function Img(css) { return $('<img>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLParagraphElement>} Um elemento JQuery
 */
export function P(css) { return $('<p>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLOptionElement>} Um elemento JQuery
 */
export function Option(css) { return $('<option>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Caption(css) { return $('<caption>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLElement>} Um elemento JQuery
 */
export function Summary(css) { return $('<summary>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLLIElement>} Um elemento JQuery
 */
export function Li(css) { return $('<li>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLInputElement>} Um elemento JQuery
 */
export function Input(css) { return $('<input>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLButtonElement>} Um elemento JQuery
 */
export function Button(css) { return $('<button>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLLinkElement>} Um elemento JQuery
 */
export function Link(css) { return $('<link>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLAnchorElement>} Um elemento JQuery
 */
export function A(css) { return $('<a>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<HTMLTableSectionElement>} Um elemento JQuery
 */
export function TFoot(css) { return $('<tfoot>')[typeof css === 'object' ? 'css' : 'addClass'](css) }

/**
 * @param {string} css Classes CSS do elemento
 * @returns {JQuery<SVGElement>} Um elemento JQuery
 */
export function Icon(css = '') {

   const iconClass = css.split(' ').filter(Boolean).find(className => !!$(`#svg-defs > #${className}`).length)
   const hasSvgIcon = iconClass && !!$(`#svg-defs > #${iconClass || 'whatever'}`).length

   const svgElem = $(document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
   const useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use')

   svgElem.append(useElem)
   useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + (hasSvgIcon ? iconClass : 'warning'))
   svgElem.addClass(css)
   svgElem.css('color', hasSvgIcon ? '' : 'var(--danger)')

   if (!hasSvgIcon) {
      svgElem.find('title').remove()
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
      title.innerHTML = iconClass
      svgElem.append(title)
      if (iconClass) console.warn('Icone não encontrado: ' + iconClass)
   }

   new MutationObserver(() => {

      const classes = (svgElem.attr('class') ?? '').split(' ').reverse()
      const newIconClass = classes.find(className => !!$(`#svg-defs > #${className}`).length)
      const hasSvgIcon = newIconClass && !!$(`#svg-defs > #${newIconClass || 'whatever'}`).length

      if (!newIconClass) {
         return
      }

      if (!hasSvgIcon) {
         svgElem.find('title').remove()
         const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
         title.innerHTML = newIconClass
         svgElem.append(title)
         if (newIconClass) console.warn('Icone não encontrado: ' + newIconClass)
      }

      useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + (hasSvgIcon ? newIconClass : 'warning'))
      svgElem.css('color', hasSvgIcon ? '' : 'var(--danger)')

   }).observe(svgElem[0], {
      attributes: true,
      attributeFilter: ['class']
   })

   return svgElem
}
