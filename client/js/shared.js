const localStorage = window.localStorage;
const blobs = document.querySelectorAll('.blob');
let isRefreshing = false;

Array.from(blobs).forEach(blob => {
    blob.style.rotate = Math.random() * 360 + 'deg';
    blob.style.transform = 'translateX(' + Math.random() * 100 + 'px)';
});

const div_menu = document.getElementById("menu");
const div_grades = document.getElementById("grades");
const div_planning = document.getElementById("planning");
const div_absences = document.getElementById("absences");
const div_weeks = document.getElementById("weeks");
const burger_btn = document.getElementById("burger_btn");
const cross_btn = document.getElementById("cross_btn");
const background = document.querySelector(".background");
const btn_planning = document.getElementById("btn_planning");
const btn_grades = document.getElementById("btn_grades");
const btn_absences = document.getElementById("btn_absences");
const css = getComputedStyle(document.documentElement);

div_grades.style.display = "none";
div_absences.style.display = "none";

burger_btn.addEventListener("click", function() {
    div_menu.classList.add('shown');
    burger_btn.classList.add('hidden');
    cross_btn.classList.remove('hidden');
});

cross_btn.addEventListener("click", function() {
    resetBurgerAndBackground();
});

function resetPage(){
    div_grades.style.display = "none";
    div_planning.style.display = "none";
    div_absences.style.display = "none";
    resetBurgerAndBackground();
}

function resetBurgerAndBackground(){
    div_menu.classList.remove('shown');
    burger_btn.classList.remove('hidden');
    cross_btn.classList.add('hidden');
    div_planning.style.display == "none" ? background.classList.add('hidden') : background.classList.remove('hidden') ;
}


async function getData(){
    const url = '/getData';
    const options = {
        method: 'POST',
    }
    await fetch(url, options)
     .then(res=>res.json())
     .then(data => {
        localStorage.setItem('planning', JSON.stringify(data.planning));
        localStorage.setItem('grades', JSON.stringify(data.grades));
        localStorage.setItem('absences', JSON.stringify(data.absences));

        if (localStorage.getItem('planning') && localStorage.getItem('grades') && localStorage.getItem('absences')) {
            console.log("Found data");
        } else {
            console.log("No data found");
        }
     })
}


function refresh(){
    if (isRefreshing) return;
    
    isRefreshing = true;
    document.getElementById("refresh").classList.add('refreshing');
    document.getElementById("refresh").classList.remove('red');

    const data = {
        email: localStorage.getItem('email'),
        password: localStorage.getItem('password'),
        weeks: localStorage.getItem('weeks'),
    }
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };

    fetch('/refresh', options)
     .then((response) => {
        if (response.ok) {
            window.location.href = '/dashboard';
        } else {
            isRefreshing = false;
            document.getElementById("refresh").classList.remove('refreshing');
            document.getElementById("refresh").classList.add('red');
        }
     })
     .catch((error) => {
        isRefreshing = false;
        document.getElementById("refresh").classList.remove('refreshing');
        document.getElementById("refresh").classList.add('red');
     });
}

function logout(){
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    fetch('/logout', options)
     .then(() => {
        window.location.href = '/';
    });
}