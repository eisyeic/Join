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

// Global function for user initials
window.updateUserInitials = function(user) {
    if (user) {
        const name = user.displayName || "User";
        const initialsElement = document.getElementById("person-icon-header-text");

        if (initialsElement && name !== "User") {
            const initials = name
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase())
                .join("");
            
            initialsElement.textContent = initials;
            
            if (initials.length === 2) {
                initialsElement.style.fontSize = "22px";
            } else {
                initialsElement.style.fontSize = "30px";
            }
        }
    }
}