const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const { getgid } = require('process');
const puppeteer = require('puppeteer');
const port = process.env.PORT || 2004;

const url = "https://aurion.junia.com/";

const clientPath = path.normalize(__dirname + '/../client/');

const session = require('express-session')({
    secret: '5f24da74a89e101858436f91fbe9eec73233d4fa73c6b983e89e79d69892763b',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 8,
        secure: false,
    },
});

let browser;
let waitingList = [];
const menu_items = {"grades": ".item_3623182", "absences": ".item_44398", "grades_after_absence": ".item_7447431"};

const closePageOrBrowser = (async () => {
    if (waitingList.length == 1){
        console.log("Closing browser...");
        browser.close();
    }
});

const startNextLogin = (async () => {
    waitingList.shift();
    if (waitingList.length == 0) return;
    scrap(waitingList[0]);
});

function logIn(email, password) {
    return (connectToAurion(email, password));
}

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
    await page.type('.ui-inputfield.ui-inputtext.ui-widget.ui-state-default.ui-corner-all', email);
    await page.type('.ui-inputfield.ui-password.ui-widget.ui-state-default.ui-corner-all', password);
    await Promise.all([
        page.click('.ui-button-text.ui-c'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
    if (page.url() == "https://aurion.junia.com/login") {
        await page.close();
        closePageOrBrowser();
        return {success: false, message: "Email or password is incorrect"};
    } else {
        console.log("Authentification of " + email.replace(/@student.junia.com/g, '') + " complete");
        return {success: true, message: "Login success", page: page, context: context};
    }
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
            infos[i] = [];
            day[i] = Array.prototype.indexOf.call(calendar.children, item.parentElement.parentElement.parentElement.parentElement.parentElement);
            info = item.innerHTML.replace(/\n|\(H\)|-|  /g, '');
            info = info.replace('<br><br>', '<br>').split('<br>');
            infos[i][0] = info[0];
            infos[i][1] = elems_time[i].childNodes[0].innerHTML.replace(/ - /g, ' '); // Time
            infos[i][3] = info[info.length - 1].replace(/Madame/g, 'Mme.').replace(/Monsieur/g, 'M.'); // Teacher
            infos[i][4] = item.parentElement.parentElement.classList.contains('est-epreuve');
            info = info.slice(1, -2);
            infos[i][2] = info.reverse().join('<br>'); // Text
            i++;
        }
        elems = new Array(elems.length);
        for (let j = 0; j < elems.length; j++) {
            elems[j] = [];
            elems[j][0] = day[j];
            elems[j][1] = infos[j];
        }
        return elems;
    });
    return classes;
}

async function getCalendar(page, nbWeeks){
    await page.setDefaultTimeout(5500); // Timeout
    await page.click('.item_2169484');
    
    let planning = [];

    for (let i = 0; i < nbWeeks; i++) {
        try {
            await page.waitForSelector('.fc-title');
            await grabClasses(page).then(async function(result){
                planning[i] = result;
            });
            await page.setDefaultTimeout(4500); // Timeout
        } catch (error) {
            planning[i] = [];
        }
        i < nbWeeks - 1 ? await page.click('.fc-next-button') : null;
        console.log(`Found ${planning[i].length} classes for week ${i}`);
    }
    return planning;
}


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


async function getMenuContent(page, element){
    await page.setDefaultTimeout(5500); // Default timeout

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


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(clientPath));
app.use(session);

if (app.get('env') === 'production') {
    app.set('trust proxy', 1);
    session.cookie.secure = true;
}

app.get('/', function(req, res) {
    if (req.session.loggedIn){
        res.redirect('/dashboard');
    } else {
        res.sendFile(clientPath + 'html/index.html');
    }
});

app.get('/dashboard', function(req, res) {
    if (req.session.loggedIn){
        res.sendFile(clientPath + 'html/dashboard.html');
    } else {
        res.redirect('/');
    }
});

function scrap({req, res, isRefresh}){
    logIn(req.session.email, req.session.password).then(function(result) {
        req.session.loggedIn = result.success;
        if(result.success){
            console.log("Started scraping classes...");

            getCalendar(result.page, req.session.weeks).then(function(calendar) {
                req.session.calendar = calendar;
                console.log("Started scraping grades...");

                getMenuContent(result.page, "grades").then(function(grades) {
                    req.session.grades = grades;
                    console.log("Started scraping absences...");

                    getMenuContent(result.page, "absences").then(function(absences) {
                        req.session.absences = absences;
                        res.send({success: true, message: "Login success"});

                        result.context.close();
                        closePageOrBrowser().then(()=>{
                            startNextLogin();
                        });
                    });

                });

            });
        } else {
            res.send({success: false, message: "Incorret email or password..."});
            startNextLogin();
        }
    });
}

app.post('/login', function(req, res) {
    console.log("\nLogin request, " + waitingList.length + " in queue...");
    req.session.email = req.body.email;
    req.session.password = req.body.password;
    if (req.body.weeks < 1 || req.body.weeks > 8){
        req.session.weeks = 1;
    } else {
        req.session.weeks = req.body.weeks;
    }
    if (waitingList.length > 0) {
        waitingList.push({req: req, res: res});
    } else {
        waitingList.push({req: req, res: res});
        scrap(waitingList[0]);
    }
})

app.post('/getGrades', function(req, res) {
    res.send({grades: req.session.grades});
});

app.post('/getPlanning', function(req, res) {
    res.send({planning: req.session.calendar});
});

app.post('/getAbsences', function(req, res) {
    res.send({absences: req.session.absences});
});

app.post('/getPosition', function(req, res) {
    res.send({position: waitingList.length==0?0:waitingList.length-1});
});

app.post('/refresh', function(req, res) {
    console.log("\nRefresh request, " + waitingList.length + " in queue...");
    if (waitingList.length > 0) {
        waitingList.push({req: req, res: res, isRefresh: true});
    } else {
        waitingList.push({req: req, res: res, isRefresh: true});
        scrap(waitingList[0]);
    };
});

app.post('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

server.listen(port, ()=>{
    console.log('Server started on port', port);
})
