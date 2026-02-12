import Translator from '../translation/Translator.js'

/**
 * Converte dias em um texto amigável
 * @param {number} days Os dias
 * @returns {string} O texto 
 */
export function convertDaysToFriendlyTime(days) {
   const text = []

   const years = Math.floor(days / 365)
   const remainingMonths = Math.floor(days % 365 / 30)
   const remainingWeeks = Math.floor(days % 365 % 30 / 7)
   const remainingDays = Math.floor(days % 365 % 30 % 7)

   if (years) {
      text.push(Translator.t('amount:years', { count: years }))
   }

   if (remainingMonths) {
      text.push(Translator.t('amount:months', { count: remainingMonths }))
   }

   if (remainingWeeks) {
      text.push(Translator.t('amount:weeks', { count: remainingWeeks }))
   }

   if (remainingDays) {
      text.push(Translator.t('amount:days', { count: remainingDays }))
   }

   return text.join(', ')
}