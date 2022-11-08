let grades;
let table_grades;

btn_grades.addEventListener("click", function() {
    clearInterval(interval);
    resetPage();
    div_grades.style.display = "block";
    getGrades();
});

function displayGrades(grades) {
  if (table_grades) {
    table_grades = document.querySelector('.table_grades');
    while (table_grades.firstChild) {
      table_grades.removeChild(table_grades.firstChild);
    }
  } else {
    table_grades = document.createElement('table');
  }
  table_grades.classList.add('table_grades');
  table_grades.classList.add('row_table');
  let i = 0;
  grades.forEach(grade => {
    let j = 0;
    let tr = document.createElement('tr');
    grade.forEach(cell => {
        let td = document.createElement('td');
        td.id =  "" + i + j;
        td.classList.add("grade")
        td.classList.add("td_" + i + j)
        td.innerHTML = cell.replaceAll("_", " ");
        if (j == 2){
            if(cell >= 10){
                td.classList.add("green")
            } else {
                td.classList.add("red")
            }
        }
        tr.appendChild(td);
        j++;
    })
    i++;
    table_grades.appendChild(tr);
  });
  div_grades.appendChild(table_grades);
}

function getGrades(){
  const url = '/getGrades';
  const options = {
      method: 'POST',
  }
  fetch(url, options)
  .then(res=>res.json())
  .then(data => {
    if (data.grades) {
        displayGrades(data.grades)
    } else {
        console.log("Failed to get grades from JUNIA");
    }
  })
  .catch(err => {
        console.log(err);
  })
}