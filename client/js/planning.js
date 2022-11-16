let table_planning;
let data_planning;
let current_class;

let date, day, hour, minutes;

const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

let interval;
let displayed_week = 0;
let ready = false;

Array.from(document.querySelectorAll(".week_btn")).forEach((week_btn, btn_index) => {
    week_btn.addEventListener("click", function() {
        const btn_value = (-1)*((-1)**btn_index);
        showWeek(displayed_week + btn_value);
    })
});


btn_planning.addEventListener("click", function() {
    resetPage();
    div_planning.style.display = "block";
    resetBurgerAndBackground();
    getPlanning();
});



getData()
.then(() => {
    console.log("Data loaded");
    ready = true;
    getPlanning();
});


function refreshTime() {
    date = new Date();
    day = date.getDay();
    hour = date.getHours();
    minutes = date.getMinutes();
}


function diff_hours(hour1, hour2) {
    return hour2 - hour1
}


function showWeek(to_show) {
    const weeks = Array.from(document.querySelectorAll(".week"));
    if (weeks[to_show]) {
        weeks.forEach(week => {
            week.classList.add("hidden");
        });
        weeks[to_show].classList.remove("hidden");
        displayed_week = to_show;
    }
}


$(document).ready(function () {
    $(window).focus(function () {
        if (!ready) return;
        if (div_planning.style.display == "block") {
            console.log("Started refreshing again")
            clearInterval(interval);
            refreshProgression(data_planning);
            interval = setInterval(refreshProgression, 3*60*1000, data_planning);
        }
    }).blur(function () {
        console.log("Stopped refreshing");
        clearInterval(interval);
    });
});


function getPlanning(){
    refreshTime();
    refreshPlanning();
    refreshProgression();
    interval = setInterval(refreshProgression, 3*60*1000);
}


function refreshProgression(){
    refreshTime();

    if (current_class == -1) {
        console.log("Not in class");
        refreshPlanning();
        return;
    }

    let html_current_class = document.getElementById("class_0_" + current_class);
    [start, end] = [html_current_class.getAttribute("class-start").split(":"), html_current_class.getAttribute("class-end").split(":")];

    let remaining_time = diff_hours(hour * 60 + minutes, parseInt(end[0])*60 + parseInt(end[1]));
    let progression = (100 - (remaining_time / (parseInt(html_current_class.getAttribute("class-length")) * 60)) * 100).toFixed(2);

    html_current_class.childNodes[html_current_class.childNodes.length-1].classList.remove("hidden");
    html_current_class.classList.add("current_class");
    
    if (remaining_time <= 0) {
        html_current_class.classList.add("done");
        progression = 100; 
        setTimeout(() =>{
            html_current_class.classList.remove("hidden");
        }, 1600)
        setTimeout(() =>{
            html_current_class.classList.remove("current_class");
            getPlanning();
        }, 2700)
    }
    html_current_class.childNodes[html_current_class.childNodes.length-1].style.width = progression + "%";
}


function refreshPlanning() {
    while (div_weeks.firstChild) {
        div_weeks.removeChild(div_weeks.firstChild);
    }
    current_class = -1;

    JSON.parse(localStorage.getItem("planning")).forEach((week, week_index) => {
        const div_week = document.createElement("div");
        div_week.id = "week_" + week_index;	
        div_week.classList.add("week");

        week_index > 0 ? div_week.classList.add("hidden") : null;
        
        let week_announce = document.createElement('h1');

        week_index == 0 ? 
         week_announce.innerHTML = "Cette semaine :" : 
         week_announce.innerHTML = (week_index < 2 ? "Semaine prochaine :" : `Dans ${week_index} semaines :`);
        
         div_week.appendChild(week_announce);

        table_planning = document.createElement('table');
        table_planning.classList.add("table_planning");
        table_planning.id = 'week_' + week_index;
        let i = 0;
        let currentDay;
        let day_div;

        week.forEach((class_, i) => {
            if(class_.time.length == 11) { // If the class has a start and end time
                [start, end] = [class_.time?.split(" ")[0].split(":"), class_.time?.split(" ")[1].split(":")]
                if (week_index == 0 && (class_.day < day || (class_.day == day && diff_hours(hour*60 + minutes, parseInt(end[0])*60 + parseInt(end[1])) <= 0))){
                    return;
                }

                if(week_index == 0 && class_.day == day && hour >= start[0] && hour <= end[0] && diff_hours(hour * 60 + minutes, parseInt(end[0])*60 + parseInt(end[1])) >= 0){
                    console.log(diff_hours(hour * 60 + minutes, parseInt(end[0])*60 + parseInt(end[1])));
                    console.log(`Currently with ${class_.teacher}, in ${class_.title} until ${class_.time.split(" ")[1]}`);
                    current_class = i
                }
            }

            if (currentDay != class_.day){
                day_div = document.createElement('div');
                let text = document.createElement('h2');
                const day_date = new Date();
                day_date.setDate(date.getDate() - date.getDay() + week_index*7 + class_.day);
                text.innerHTML = days[class_.day] + " " + day_date.getDate() + "/" + (day_date.getMonth() + 1);
                day_div.classList.add("day");
                currentDay = class_.day;
                day_div.appendChild(text);
                table_planning.appendChild(day_div);
            }

            let j = 0;
            let tr = document.createElement('tr');
            tr.id = "class_0_" + i;
            
            Object.entries(class_).slice(1,-1).forEach(info => {
                let td = document.createElement('td');
                let text = document.createElement('p');
                td.id =  "" + i + j;
                td.classList.add("class")
                td.classList.add("td_" + i + j)
                text.innerHTML = info[1].replace("<br><br><br>", "<br><br>");
                if (text.innerHTML.indexOf("<br>") == 0) text.innerHTML = text.innerHTML.slice(4);
                td.appendChild(text);
                tr.appendChild(td);
                j++;
            })
            
            const length = Math.floor( (diff_hours(start[0]*60 + parseInt(start[1]), end[0]*60 + parseInt(end[1]))) / 60);
            tr.setAttribute("class-start", start[0] + ":" + start[1]);
            tr.setAttribute("class-end", end[0] + ":" + end[1]);
            tr.setAttribute("class-length", length);
            tr.style.minHeight = (80 * length) + "px"

            class_.isExam ? tr.classList.add("exam") : null;

            let div = document.createElement('div');
            div.classList.add("progression");
            div.classList.add("hidden"); 
            tr.appendChild(div);
            day_div.appendChild(tr);
            table_planning.appendChild(day_div);
            i++;
        });
        div_week.appendChild(table_planning);

        if (table_planning.childNodes.length == 0) {
            let no_class_message = document.createElement('p');
            no_class_message.innerHTML = "Pas de classes trouvées";
            no_class_message.classList.add("no-class-message");
            table_planning.appendChild(no_class_message);
        }

        let week_end = document.createElement('div');
        week_end.classList.add("week-end");
        div_week.appendChild(week_end);

        div_weeks.appendChild(div_week);
    })

    showWeek(displayed_week);
}