// utility
let $ = id => document.getElementById(id);

// Toggle Profile Navbar

function toggleProfileNavbar() {
    let profileNavbar = $("profile-navbar");
    if (profileNavbar.classList.contains("d-none")) {
        profileNavbar.classList.remove("d-none");
    } else {
        profileNavbar.classList.add("d-none");
    }
}