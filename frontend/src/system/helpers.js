
export function formatCurrency(value, currency = 'pt-br') {

   value ? value = value : value = 0.00;

   typeof value != 'string' ? value = value.toString() : '';

   switch (currency) {
      case 'pt-br':
         if (value) {
            if (value.replace(/\D/g, '') > 999 && value.indexOf('.') <= 1) {
               value = value.replace('.', '').replace('.', ',');
            } else {
               value = value.replace('.', ',');
            }
         }
         return value;
      case 'us':
         if (value) {
            if (value.replace(/\D/g, '') > 999 && value.indexOf(',') > 1) {
               value = value.replace('.', '').replace(',', '.');
            } else if (value.replace(/\D/g, '') > 999 && value.indexOf('.') <= 1) {
               value = value.replace('.', '');
            } else {
               value = value.replace(',', '.');
            }
         }
         return value;
      default:
         value = value.replace('.', ',');
         return value;
   }
}