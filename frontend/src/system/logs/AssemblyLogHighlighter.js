import { LogHighlighter } from '../LogHighlighter.js'

/**
 * Classe responsável por criar um highlight em palavras dos logs da montagem
 * @abstract Não deve ser instânciada
 * @author Fernando Petri
 */
export class AssemblyLogHighlighter {

   /**
    * Lista de cores definidas para o highlight da montagem
    */
   static #COLORS = Object.freeze({
      SPECIAL: '#ff00f9',
      TIME: '#4daf5b',
      NUMBER: '#9a4ede',
      NAMES: '#8F5AC4',
      COMPONENT: '#c52d2d',
      OPTION: '#5299bc',
      MODEL: '#ee6405',
      LINE: '#ab954c',
      INPUT: '#5299bc',
      PIECE: '#5869c5'
   })

   /**
    * Previne a instânciação da classe
    */
   constructor() {
      throw new Error(`A classe ${this.constructor.name} não deve ser instânciada.`)
   }

   /**
    * Adiciona highlight de coisas especiais
    * @param {string} text O texto para o highlight
    * @returns {string} O texto com o highlight
    */
   static accentSpecial(text) {
      return LogHighlighter.highlight(text, AssemblyLogHighlighter.#COLORS.SPECIAL)
   }

   /**
    * Adiciona highlight de tempos
    * @param {string} text O texto para o highlight
    * @returns {string} O texto com o highlight
    */
   static accentTime(text) {
      return LogHighlighter.highlight(text, AssemblyLogHighlighter.#COLORS.TIME)
   }

   /**
    * Adiciona highlight de um número
    * @param {string} text O texto para o highlight
    * @returns {string} O texto com o highlight
    */
   static accentNumber(text) {
      return LogHighlighter.highlight(text, AssemblyLogHighlighter.#COLORS.NUMBER)
   }

   /**
    * Adiciona highlight de nomes
    * @param {string} text O texto para o highlight
    * @returns {string} O texto com o highlight
    */
   static accentNames(text) {
      return LogHighlighter.highlight(text, AssemblyLogHighlighter.#COLORS.NAMES)
   }

   /**
    * Adiciona highlight de componentes
    * @param {string} text O texto para o highlight
    * @returns {string} O texto com o highlight
    */
   static accentComponent(text) {
      return LogHighlighter.highlight(text, AssemblyLogHighlighter.#COLORS.COMPONENT)
   }

   /**
    * Adiciona highlight de opcionais
    * @param {string} text O texto para o highlight
    * @returns {string} O texto com o highlight
    */
   static accentOptional(text) {
      return LogHighlighter.highlight(text, AssemblyLogHighlighter.#COLORS.OPTION)
   }

   /**
    * Adiciona highlight de modelos
    * @param {string} text O texto para o highlight
    * @returns {string} O texto com o highlight
    */
   static accentModel(text) {
      return LogHighlighter.highlight(text, AssemblyLogHighlighter.#COLORS.MODEL)
   }

   /**
    * Adiciona highlight de linhas
    * @param {string} text O texto para o highlight
    * @returns {string} O texto com o highlight
    */
   static accentLine(text) {
      return LogHighlighter.highlight(text, AssemblyLogHighlighter.#COLORS.LINE)
   }

   /**
    * Adiciona highlight de peças
    * @param {string} text O texto para o highlight
    * @returns {string} O texto com o highlight
    */
   static accentPiece(text) {
      return LogHighlighter.highlight(text, AssemblyLogHighlighter.#COLORS.PIECE)
   }
}