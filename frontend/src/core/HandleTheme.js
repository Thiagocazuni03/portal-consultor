const storedConfig = (localStorage.getItem('SESSION') ?? '{}')
const parsedConfig = JSON.parse(storedConfig)
const themeToUse = parsedConfig['isThemeDark'] ? 'dark' : 'light'
document.querySelector('html').className = themeToUse
