const puppeteer = require('puppeteer');
let browser;
const url = "https://aurion.junia.com/";
const menu_items = {"grades": ".item_3623182", "absences": ".item_44398", "grades_after_absence": ".item_7447431"};
const timeout = 10000;

async function openBrowser () {
    browser = await puppeteer.launch({
        // executablePath: '/usr/bin/chromium-browser',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=fr-FR']
    });
    browser.on('disconnected', () => {
        browser = null;
    })   
}

async function closeBrowser(context) {
    await context.close();
    if ((await browser.browserContexts()).length == 1){
        console.log("Closing browser...");
        await browser.close();
    } else {
        console.log("Closing context...");
    }
};


//SCRAPPER
function scrap({req, res}){
    logIn(req.session.email, req.session.password).then(function(result) {
        req.session.loggedIn = result.success;
        if(result.success){
            console.log(`Started scraping classes of ${req.session.email.replace(/@.*$/, '')}`);
            
            getCalendar(result.page, req.session.weeks).then(function(calendar) {
                req.session.planning = calendar;
                console.log(`Started scraping grades of ${req.session.email.replace(/@.*$/, '')}`);
                
                getMenuContent(result.page, "grades").then(function(grades) {
                    req.session.grades = grades;
                    console.log(`Started scraping absences of ${req.session.email.replace(/@.*$/, '')}`);
                    
                    getMenuContent(result.page, "absences").then(function(absences) {
                        req.session.absences = absences;
                        res.send({success: true, message: "Login success"});
                        
                        closeBrowser(result.context);
                    });
                });
                
            });
        } else {
            res.send({success: false, message: result.message});
        }
    });
}
module.exports = { scrap };


//LOGIN
function logIn(email, password) {
    return (connectToAurion(email, password));
}


//CONNECTION
async function connectToAurion(email, password){
    if (browser == null){
        await openBrowser();
    }

    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setExtraHTTPHeaders({'Accept-Language': 'fr'});
	await page.setViewport({ width: 970, height: 500 });
    await page.setDefaultNavigationTimeout(0);
    await page.goto(url);
    try {
        await page.type('.ui-inputfield.ui-inputtext', email);
        await page.type('.ui-inputfield.ui-password', password);
        await Promise.all([
            page.click('.ui-button-text.ui-c'),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]);
    } catch (error) {
        console.log("Error : " + error);
        closeBrowser(context);
        return {success: false, message: "Couldn't reach Aurion's login..."};
    }

    if (page.url() == "https://aurion.junia.com/login") {
        console.log(`Authentification of ${email} failed`);
        closeBrowser(context);
        return {success: false, message: "Email or password is incorrect..."};
    } else {
        console.log(`Authentification of ${email.replace(/@.*$/, '')} complete`);
        return {success: true, message: "Login success...", page: page, context: context};
    }
}


//SUB MENUS
async function getMenuContent(page, element){
    await page.setDefaultTimeout(timeout); // Default timeout

    let data = [];
    let myPage = 0;

    try {
        await page.waitForSelector('.submenu_44413');
        await page.click('.submenu_44413');
        await page.waitForSelector(menu_items[element]);
        await page.click(menu_items[element]);
        await page.waitForSelector('.ui-datatable-data');
    } catch (error) {
        console.error("Couldn't find " + element);
        return;
    }

    const max = 12;

    await page.setDefaultTimeout(1200); // Timeout
    for (let index = 0; index < max; index++) {
        try {
            const wait_for_next_page = await page.waitForSelector('[data-ri="' + myPage*20 + '"]');
            if(wait_for_next_page){
                if (element == "grades"){
                    await grabGrades(page).then(async function(result){
                        data.push(...result);
                        myPage++;
                    });
                } else {
                    await grabAbsences(page).then(async function(result){
                        data.push(...result);
                        myPage++;
                    });
                }
                index < max-1 ? await page.click('.ui-icon-seek-next') : null;
            }
        } catch (error) {
            console.log(`All ${data.length}, ${element} found...`);
            return data;
        }
    }
    console.log(`${data.length}, ${element} found...`);  
    return data;
}


//ABSENCES
async function grabAbsences(page){
    let absences = await page.evaluate(()=>{
        let table = document.querySelector(".ui-datatable-data");
        let absence = [];
        Array.from(table.childNodes).forEach((row, index) =>{
            absence[index] = [];
            absence[index][0] = row.childNodes[1].childNodes[1] ? row.childNodes[1].childNodes[1].nodeValue : "";
            absence[index][0] = absence[index][0].indexOf("non") == -1 ? 1 : 0;

            absence[index][1] = row.childNodes[0].childNodes[1] ? row.childNodes[0].childNodes[1].nodeValue : "";

            absence[index][2] = row.childNodes[3].childNodes[1] ? row.childNodes[3].childNodes[1].nodeValue : "";
            absence[index][2] = absence[index][2].replace(/-/g, '');

            absence[index][3] = row.childNodes[4].childNodes[1] ? row.childNodes[4].childNodes[1].nodeValue : "";
            absence[index][3] = absence[index][3].indexOf('-') != -1 ? absence[index][3].slice(0, absence[index][3].indexOf('-')) : absence[index][3];
            
            absence[index][4] = row.childNodes[5].childNodes[1] ? row.childNodes[5].childNodes[1].nodeValue : "";
            console.log(absence[index])
        });
        return absence;
    });
    return absences;
}


//GRADES
async function grabGrades(page){
    let grades = await page.evaluate(()=>{
        let table = document.querySelector(".ui-datatable-data");
        let grade = [];
        Array.from(table.childNodes).forEach((row, index) =>{
            grade[index] = [];
            grade[index][0] = row.childNodes[0].childNodes[1].innerHTML;
            grade[index][1] = row.childNodes[1].childNodes[1].innerHTML;
            grade[index][2] = row.childNodes[3].childNodes[1].innerHTML;
        });
        return grade;
    })
    return grades
}


// CALENDAR
async function getCalendar(page, nbWeeks){
    await page.setDefaultTimeout(timeout); // Timeout
    await page.click('.item_2169484');
    
    let planning = [];

    for (let i = 0; i < nbWeeks; i++) {
        try {
            await page.waitForSelector('.fc-title');
            await grabClasses(page).then(async function(result){
                planning[i] = result;
            });
            await page.setDefaultTimeout(4500); // Timeout
            console.log(`Found ${planning[i].length} classes for week ${i}`);
        } catch (error) {
            planning[i] = [];
            console.log(`Week ${i} is empty`);
        }
        i < nbWeeks - 1 ? await page.click('.fc-next-button') : null;
    }
    return planning;
}

async function grabClasses(page){
    let classes = await page.evaluate(() => {
        let elems = Array.from(document.querySelectorAll('.fc-title'));
        let elems_time = Array.from(document.querySelectorAll('.fc-time:not(.ui-widget-content)'));
        let calendar;
        let day = [];
        let info = [];
        let infos = [];
        let i = 0;
        if (elems.length > 0) {
            calendar = Array.from(document.getElementsByClassName('fc-content-skeleton'))[0].childNodes[0].childNodes[0].childNodes[0];
        }
        console.log(elems)
        for (let item of elems) {
            infos[i] = {};
            day[i] = Array.prototype.indexOf.call(calendar.children, item.parentElement.parentElement.parentElement.parentElement.parentElement);
            info = item.innerHTML.replace(/\n|\(H\)|-|  /g, '');
            info = info.split('<br>');

            infos[i].title = info[0];
            infos[i].time = elems_time[i].childNodes[0].innerHTML.replace(/ - /g, ' '); // Time
            infos[i].description = info.slice(1, -2).join('<br>'); // Description
            infos[i].teacher = info[info.length - 1].replace(/Madame/g, 'Mme.').replace(/Monsieur/g, 'M.'); // Teacher
            infos[i].isExam = item.parentElement.parentElement.classList.contains('est-epreuve');

            if (!infos[i].isExam) infos[i].description = info.slice(1, -2).reverse().join('<br>');

            i++;
        }
        elems = new Array(elems.length);
        for (let j = 0; j < elems.length; j++) {
            elems[j] = {};
            elems[j].day = day[j];
            Object.assign(elems[j], infos[j]);
        }
        return elems;
    });
    return classes;
}