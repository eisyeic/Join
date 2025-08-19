// utility
let $ = id => document.getElementById(id);

// Toggle Profile Navbar
function toggleProfileNavbar() {
    let profileNavbar = $("profile-navbar");
    profileNavbar.classList.toggle("d-none");

    if (!profileNavbar.classList.contains("d-none")) {
        setTimeout(() => {
            document.addEventListener('click', closeProfileNavbar);
        }, 0);
    } else {
        document.removeEventListener('click', closeProfileNavbar);
    }
}

// Close Profile Navbar if clicked outside
function closeProfileNavbar() {
    let profileNavbar = $("profile-navbar");
    let guestIcon = document.querySelector('img[alt="Guest Icon"]');

    if (!profileNavbar.contains(event.target) && event.target !== guestIcon) {
        profileNavbar.classList.add("d-none");
        document.removeEventListener('click', closeProfileNavbar);
    }
}

// Beim Laden gespeicherte Initialen anzeigen
(() => {
    const cached = JSON.parse(localStorage.getItem('headerTextCache') || 'null');
    if (cached) {
        const style = document.createElement('style');
        style.textContent = `#person-icon-header-text { opacity: 0; }`;
        document.head.appendChild(style);
        
        document.addEventListener('DOMContentLoaded', () => {
            const initialsElement = document.getElementById("person-icon-header-text");
            if (initialsElement) {
                initialsElement.textContent = cached.text;
                initialsElement.style.fontSize = cached.fontSize;
                initialsElement.style.opacity = '1';
                style.remove();
            }
        });
    } else {
        // Fallback: Zeige "G" wenn kein Cache vorhanden ist
        document.addEventListener('DOMContentLoaded', () => {
            const initialsElement = document.getElementById("person-icon-header-text");
            if (initialsElement && initialsElement.textContent === "G") {
                initialsElement.style.fontSize = "30px";
            }
        });
    }
})();

// Global function for user initials
window.updateUserInitials = function(user) {
    if (user) {
        const name = user.displayName || "User";
        const initialsElement = document.getElementById("person-icon-header-text");

        if (initialsElement) {
            let initials, fontSize;
            
            // Prüfen ob es ein Gast-Login ist
            if (user.email === "guest@login.de" || name === "User") {
                initials = "G";
                fontSize = "30px";
            } else {
                initials = name
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase())
                    .join("");
                fontSize = initials.length === 2 ? "22px" : "30px";
            }
            
            // In localStorage speichern statt direkt zu rendern
            localStorage.setItem('headerTextCache', JSON.stringify({
                text: initials,
                fontSize: fontSize
            }));
            
            // Verzögertes Rendering
            requestAnimationFrame(() => {
                const cached = JSON.parse(localStorage.getItem('headerTextCache'));
                if (cached) {
                    initialsElement.textContent = cached.text;
                    initialsElement.style.fontSize = cached.fontSize;
                }
            });
        }
    }
}

// Funktion zum Leeren des localStorage beim Logout
window.clearHeaderTextCache = function() {
    localStorage.removeItem('headerTextCache');
    const initialsElement = document.getElementById("person-icon-header-text");
    if (initialsElement) {
        initialsElement.textContent = "G";
        initialsElement.style.fontSize = "30px";
    }
}