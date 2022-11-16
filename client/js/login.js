const login_form = document.getElementById('login-form');
const email = document.getElementById('login-email');
const password = document.getElementById('login-password');
const weeks = document.getElementById('week-number');
const login_button = document.getElementById('login-submit');
const loading_text = document.getElementById('loading-text');
const loading_div = document.getElementById('loading-div');
const localStorage = window.localStorage;

loading_div.style.display = 'none';

login_form.addEventListener('submit', (e) => {
    login_form.style.display = 'none';
    loading_div.style.display = 'block';
    e.preventDefault();
    const email_value = email.value;
    const password_value = password.value;
    const weeks_value = weeks.value;
    sendLoginRequest(email_value, password_value, weeks_value);
});

function sendLoginRequest(email_value, password_value, weeks_value){
    localStorage.setItem('email', email_value);
    localStorage.setItem('password', password_value);
    localStorage.setItem('weeks', weeks_value);

    const data = {
        email: email_value,
        password: password_value,
        weeks: weeks_value
    };
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    };
    
    fetch('/login', options)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/dashboard';
            } else {
                loading_text.classList.add('red');
                console.log(data);
                loading_text.innerHTML = data.message;
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            }
        })
        .catch(err => {
            loading_text.classList.add('red');
            loading_text.innerHTML = err;
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
            console.log(err);
        })
}