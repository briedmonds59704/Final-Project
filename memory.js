const element = document.getElementById("typewriter");

if (!element) {
    throw new Error('The typewriter heading with id "typewriter" was not found.');
}

const text = element.textContent.trim();
let index = 0;
let deleting = false;

element.textContent = "";

function typeWriter() {
    if (!deleting) {
        index += 1;
        element.textContent = text.slice(0, index);
        if (index === text.length) {
            deleting = true;
            setTimeout(typeWriter, 1000);
            return;
        }
    } else {
        index -= 1;
        element.textContent = text.slice(0, index);
        if (index === 0) {
            deleting = false;
        }
    }

    setTimeout(typeWriter, deleting ? 100 : 200);
}

if (text) {
    typeWriter();
}