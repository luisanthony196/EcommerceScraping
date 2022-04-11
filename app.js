const puppeteer = require('puppeteer')
const path = require('path')
const websites = require('./websites_alt.json')
const {reset} = require('./database/controller')

const scrap = async () => {
  const browser = await puppeteer.launch({headless: false})
  const page = await browser.newPage()

  await reset.emptyTables()
  await reset.createTables()

  await page.setRequestInterception(true)
  page.on('request', (request) => {
    if (['stylesheet', 'font'].indexOf(request.resourceType()) !== -1) {
      request.abort()
    } else {
      request.continue()
    }
  })

  for (const website of websites) {
    const scriptPath = path.join(__dirname, 'scripts', website.scriptName)
    await require(scriptPath)(page, website)
    console.log('Scraping done for', website.name)
  }

  browser.close()
}

scrap()
