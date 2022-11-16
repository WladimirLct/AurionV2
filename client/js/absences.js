let table_absences;

let count = 0;
let hours_absent = 0;

btn_absences.addEventListener("click", function() {
    clearInterval(interval);
    resetPage();
    div_absences.style.display = "block";
    displayAbsences();
});

function getSchoolYear(){
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    if (month >= 8){
        return [year, year + 1];
    } else {
        return [year - 1, year];
    }
}

function classLength(time1, time2) {
    const T1 = time1.split(":");
    const T2 = time2.split(":");
    const diff = new Date(0, 0, 0, T1[0] - T2[0], T1[1] - T2[1], 0);
    return (diff.getHours()*60 + diff.getMinutes());
}

function checkIfDateIsInSchoolYear(date){
    let schoolYear = getSchoolYear();
    let schoolYearStart = new Date(schoolYear[0], 8, 1);
    let schoolYearEnd = new Date(schoolYear[1], 6, 30);
    if (date >= schoolYearStart && date <= schoolYearEnd){
        return true;
    } else {
        return false;
    }
}

function updateAbsencesInfo(){
    document.getElementById("nb_absences").innerHTML = count;
    document.getElementById("nb_hours_absent").innerHTML = Math.floor(hours_absent/60) + ":" +  hours_absent%60;
}

function displayAbsences() {
    if (table_absences) {
        table_absences = document.querySelector('.table_absences');
        count = 0;
        hours_absent = 0;
        while (table_absences.firstChild) {
            table_absences.removeChild(table_absences.firstChild);
        }
    } else {
        table_absences = document.createElement('table');
    }
    table_absences.classList.add('table_absences');
    table_absences.classList.add('row_table');


    JSON.parse(localStorage.getItem("absences")).forEach((absence, i) => {
      let tr = document.createElement('tr');
      absence.forEach((cell, j) => {
        let td = document.createElement('td');
        td.id =  "" + i + j;
        td.classList.add("absence")
        td.classList.add("td_" + i + j)
        td.innerHTML = cell;
        if (j == 0){
            td.innerHTML = "";
          if(cell == 1){
              td.insertAdjacentHTML('afterbegin', '<i class="icon fas fa-check green"></i>');
          } else {
              td.insertAdjacentHTML('afterbegin', '<i class="icon fas fa-times red"></i>');
          }
        } else if (j == 1){ 
            const date = cell.split("/");
            if (checkIfDateIsInSchoolYear(new Date("20"+date[2], date[1] - 1, date[0]))){
                count++;
                hours_absent +=classLength(absence[2].split(" ")[2], absence[2].split(" ")[0]);
            }
        }
        tr.appendChild(td);
      })
      table_absences.appendChild(tr);
    });

    div_absences.appendChild(table_absences);
    updateAbsencesInfo();
  }