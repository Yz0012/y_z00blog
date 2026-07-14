const btn = document.getElementById('toggleBtn');
const body = document.body;

let a = false;

if (btn != null) {
    btn.addEventListener('click', function () {
        if (a) {
            body.style.backgroundColor = '#ffffff';
            body.style.color = '#000000';
            a = !a;
        } else {
            body.style.backgroundColor = '#000000';
            body.style.color = "#ffffff";
            a = !a;
        }
    });
}
