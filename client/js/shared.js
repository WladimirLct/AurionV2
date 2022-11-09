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

function refresh(){
    if (isRefreshing) return;
    isRefreshing = true;
    document.getElementById("refresh").classList.add('refreshing');

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
    };
    fetch('/refresh', options)
     .then(() => {
        window.location.href = '/dashboard';
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