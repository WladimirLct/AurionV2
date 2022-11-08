let table_planning;
let current_class;
let data_planning;

let date, day, hour, minutes;

const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

let interval;
let displayed_week = 0;


Array.from(document.querySelectorAll(".week_btn")).forEach((week_btn, btn_index) => {
    week_btn.addEventListener("click", function() {
        const btn_value = (-1)*((-1)**btn_index);
        console.log(btn_value);
        showWeek(displayed_week + btn_value);
    })
});

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

getPlanning();

btn_planning.addEventListener("click", function() {
    resetPage();
    div_planning.style.display = "block";
    resetBurgerAndBackground();
    getPlanning();
});

function diff_hours(hour1, hour2) {
    return hour2 - hour1
}

function refreshProgression(planning){
    refreshTime();
    if (current_class == -1) {
        console.log("Not in class");
        refreshPlanning(planning);
        return;
    }

    let html_current_class = document.getElementById("class_0_" + current_class);
    [start, end] = [html_current_class.childNodes[1].innerHTML.split(" ")[0].split(":"), html_current_class.childNodes[1].innerHTML.split(" ")[1].split(":")]
    let remaining_time = diff_hours(hour * 60 + minutes, end[0]*60 + parseInt(end[1]));
    let progression = (100 - (remaining_time / diff_hours(start[0]*60 + parseInt(start[1]), end[0]*60 + parseInt(end[1]))) * 100).toFixed(2);

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

function refreshTime() {
    date = new Date();
    day = date.getDay();
    hour = date.getHours();
    minutes = date.getMinutes();
}

function refreshPlanning(weeks) {
    while (div_weeks.firstChild) {
        div_weeks.removeChild(div_weeks.firstChild);
    }
    current_class = -1;

    weeks.forEach((week, week_index) => {
        const div_week = document.createElement("div");
        div_week.id = "week_" + week_index;	
        div_week.classList.add("week");

        week_index > 0 ? div_week.classList.add("hidden") : null;
        
        let week_announce = document.createElement('h1');
        week_index == 0 ? week_announce.innerHTML = "Cette semaine :" : week_announce.innerHTML = "Dans " + week_index + " semaine(s) :";
        div_week.appendChild(week_announce);

        table_planning = document.createElement('table');
        table_planning.classList.add("table_planning");
        table_planning.id = 'week_' + week_index;
        let i = 0;
        let currentDay;
        let day_div;

        week.forEach((class_, i) => {
            if(class_[1][1].length == 11) { // If the class has a start and end time
                [start, end] = [class_[1][1]?.split(" ")[0].split(":"), class_[1][1]?.split(" ")[1].split(":")]
                if(week_index == 0 && (class_[0]<day || class_[0]==day && end[0]<hour || class_[0]==day && end[0]==hour && end[1]<=minutes)){
                    return;
                } else if (week_index == 0 && class_[0] == day && end[0] >= hour && hour >= start[0]) {
                    if((start[0] == hour && start[1] <= minutes) || (parseInt(start[0]) + 1 == hour) || (end[0] == hour && end[1] > minutes)){
                        console.log("Currently in :", class_[1][3], "from",class_[1][1].split(" ")[0], "to", class_[1][1].split(" ")[1]);
                        current_class = i
                    }
                }
            }

            if (currentDay != class_[0]){
                day_div = document.createElement('div');
                let text = document.createElement('h2');
                const day_date = new Date();
                day_date.setDate(date.getDate() - date.getDay() + week_index*7 + class_[0]);
                text.innerHTML = days[class_[0]] + " " + day_date.getDate() + "/" + (day_date.getMonth() + 1);
                day_div.classList.add("day");
                currentDay = class_[0];
                day_div.appendChild(text);
                table_planning.appendChild(day_div);
            }

            let j = 0;
            let tr = document.createElement('tr');
            tr.id = "class_0_" + i;
            class_[1].slice(0, -1).forEach(info => {
                let td = document.createElement('td');
                td.id =  "" + i + j;
                td.classList.add("class")
                td.classList.add("td_" + i + j)
                td.innerHTML = info;
                tr.appendChild(td);
                j++;
            })
            
            class_[1][4] ? tr.classList.add("exam") : null;

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

$(document).ready(function () {
    $(window).focus(function () {
        if (div_planning.style.display == "block") {
            console.log("Started refreshing again")
            clearInterval(interval);
            refreshProgression(data_planning);
            interval = setInterval(refreshProgression, 5*60*1000, data_planning);
        }
    }).blur(function () {
        console.log("Stopped refreshing");
        clearInterval(interval);
    });
});

function getPlanning(){
    const url = '/getPlanning';
    const options = {
        method: 'POST',
    }
    fetch(url, options)
    .then(res=>res.json())
    .then(data => {
        if (data.planning) {
            data_planning = data.planning;
            clearInterval(interval);
	        refreshTime();
            refreshPlanning(data.planning);
            refreshProgression(data.planning);
            interval = setInterval(refreshProgression, 5*60*1000, data.planning);
        } else {
            console.log("Failed to get planning form JUNIA");
        }
    })
    .catch(err => {
        console.log(err);
    })
  }