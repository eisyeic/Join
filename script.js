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