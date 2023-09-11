import express, { json } from 'express';
var app = express()
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-extra';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const port = process.env.PORT || 8080;

process.setMaxListeners(0)



app.get('/', function(req, res) {
  res.sendFile(join(__dirname, './index.html'));
    console.log("Successful client connection")
    
  });



async function find_top_values(page, title){
	const unfixedtext = await page.evaluate(() => Array.from(document.querySelectorAll('span.odds-value--green'), element => element.textContent));
	const fixedtext = unfixedtext.map(entry => entry.trim());


const result = [];
let subarray = [];
let uniqueNumbers = new Set();

//cursed number/arr manipulation to handle the scrape ordering

fixedtext.forEach(number => {
  if (subarray.length < 2 && !uniqueNumbers.has(number)) {
    subarray.push(number);
    uniqueNumbers.add(number);
  } else if (subarray.length === 2 && !uniqueNumbers.has(number)) {
    uniqueNumbers.add(number);
    result.push(subarray.slice()); // Add a copy of the subarray to the result
    subarray = [number];
  } else if (subarray.length === 1 && number !== subarray[0]) {
    uniqueNumbers.add(number);
    subarray.push(number);
  }
});

if (subarray.length === 2) {
  result.push(subarray.slice()); // Add a copy of the subarray to the result
}

console.log(result)

	arb_bet_calc(result, title)
	//console.log(result)
}

async function Main(URL) {
	try {
		const browser = await puppeteer.launch({headless:false,
			args:['--start-maximized' ]})
			
		const page = await browser.newPage()
		await page.setDefaultNavigationTimeout(0);

		await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 600000 })

		const xpath = "/html/body/div[1]/div/div/div[5]/div/ul/li";

		const result = await page.evaluate((xpath) => {
		  const elements = document.evaluate(
			xpath,
			document,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
			null
		  );
		
		  return elements.snapshotLength;
		}, xpath);
		
		
		//console.log(result)

		await page.evaluate((result) => {
			//console.log(result)
		  const xpath = `/html/body/div[1]/div/div/div[5]/div/ul/li[${result}]/div`;
		  const element = document.evaluate(
			xpath,
			document,
			null,
			XPathResult.FIRST_ORDERED_NODE_TYPE,
			null
		  ).singleNodeValue;
			console.log(element)
			if (element) {
			  const clickEvent = new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true
			  });
			  element.dispatchEvent(clickEvent);	
			} else {
			  console.log("Element not found.");
			}
		  }, result)
		  let title = await page.title()


		  await page.waitForFunction(() => {
			const newElements = Array.from(document.querySelectorAll('span.odds-value--green:not(.processed)'));
			if (newElements.length > 0) {
			  newElements.forEach(element => element.classList.add('processed'));
			  return true;
			}
			return false;
		  }); // Wait for new elements with the updated class

		  await page.waitForTimeout(2000)


		await find_top_values(page, title).then(); // Call the find_top_values function after dispatching the click event


		await browser.close()	
	} catch (error) {
		console.error(error)
	}
}


 function arb_bet_calc(odds, title){


odds.forEach(element => {

//calculate if the odds allow for an arbitrage oppertunity or not.

	let cash_bet_amount = 500
	let bet_one_win_chance = ((1/element[0])*100)
	let bet_two_win_chance = ((1/element[1])*100)
	let res= bet_one_win_chance+bet_two_win_chance
	//console.log(res)
	if(res<100){
		console.log(title)
	let bet_one = (cash_bet_amount*bet_one_win_chance)/res
	let bet_two = (cash_bet_amount*bet_two_win_chance)/res
	//res/100 to get decimal value for ez math
	let total_profitability = (cash_bet_amount/(res/100))-cash_bet_amount
	console.log("first bet should be " + Math.round(bet_one) + "kr")
	console.log("second bet should be " + Math.round(bet_two) + "kr")
	console.log("for a total profit of " +  Math.round(total_profitability) + "kr profit")
	}
	else{
		//warning?
	}
});

}

async function findhrefs(){

//scrapes the links attached to the buttons instead of clicking on them for performance and speed improvements along with along with calculation and manipulation ease.

	try {
		const URL = 'https://1x2.se/odds/2023-07-26#hero-tabs'
		const browser = await puppeteer.launch({headless:true})
			
		const page = await browser.newPage()

		await page.goto(URL, { waitUntil: 'domcontentloaded' })

		const hrefs = await page.evaluate(() => {
			const elements = Array.from(document.getElementsByClassName('matchRow'));
			return elements.map(element => element.href);
		  });
		  
console.log(hrefs)


//we open only 1 of the scraped links at a time to fool bot detection systems and prevent our system from looking like a DDOS. Should prevent time-out issues and IP/MAC blocking. Investigate if VPNs might be needed
for (let i = 0; i < hrefs.length; i++) {
			  await Main(hrefs[i]);
			}


await browser.close()	


}
catch(errors){
console.log(errors)
}
}


findhrefs()



app.listen(port);
console.log('Server started at http://localhost:' + port);

