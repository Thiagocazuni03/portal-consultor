export default class TemplateHandler{
   constructor({ template, data }){
      this.template = template ?? ''
      this.data = data ?? {}
   }

   static process(template, data){
      return TemplateHandler.purifyTempalte(
         TemplateHandler.minifyTemplate(
            TemplateHandler.replaceDoubleCurlyBraces(template, data)
         )
      )
   }

   static replaceDoubleCurlyBraces(string, data){
      return Object.entries(data).reduce((resultStr, [key, value]) => {

         const hasSomeChars = (/[a-zA-Z_]+/g).test(resultStr)
         const regexToTargetKey = new RegExp('{{(?:\\s+)?(' + key + ')(?:\\s+)?}}', 'g')

         return hasSomeChars  
            ? resultStr.replace(regexToTargetKey, value)
            : resultStr

      }, string)
   }

   static minifyTemplate(string){
      return string
         .replace(/(\r\n|\n|\r|\t)/gm, '')
         .replace(/> *</gm, '><')
   }

   static purifyTempalte(string){
      return string
      return DOMPurify.sanitize(string)
   }

   init(){
      this.template = TemplateHandler.process(this.template, this.data)
   }

   getTemplate(){
      return this.template
   }
}


// export default function TemplateHandler(config) {

//    let self = this;

//    // Define a configuração padrão da classe
//    this.config = {};

//    // Sobreescreve a configuração padrão da classe
//    if (config) {
//       this.config = $.extend(true, this.config, config);
//    }

   

//    // Inicializa
//    this.init = function () {
//       this.template = this.config.template;

//       if (!this.config.data) {

//          this.config.data = [];
//       }

//       this.config.data['DEFAULT_URL'] = VARIABLES.DEFAULT_URL;
//       this.config.data['VARIABLES.DEFAULT_TITLE'] = VARIABLES.DEFAULT_TITLE;

//       for (let key in this.config.data) {
//          const value = this.config.data[key];
//          this.template = this.replaceDoubleCurlyBraces(this.template, key, value);
//       }
//    }

//    // Substitui variáveis com chaves duplas {{var}}
//    this.replaceDoubleCurlyBraces = function (string, find, replace) {
//       if ((/[a-zA-Z_]+/g).test(string)) {
//          return string.replace(new RegExp('\{\{(?:\\s+)?(' + find + ')(?:\\s+)?\}\}', 'g'), replace);
//       } else {
//          console.warn('Variável não encontrada');
//          return string;
//       }
//    }

//    /**
//     * Compressa uma string HTML
//     */
//    this.minify = function (stringHTML) {
//       stringHTML = stringHTML.replace(/(\r\n|\n|\r|\t)/gm, '');
//       stringHTML = stringHTML.replace(/> *</gm, '><');

//       return stringHTML;
//    }

//    /**
//     * @returns string
//     */
//    this.getTemplate = function () {
//       return this.minify(this.template);
//    }
// }