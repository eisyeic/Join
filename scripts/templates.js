function getContactPerson(key, renderContacts, id) {
  colorIndex = (colorIndex % 15) + 1;

  return /*html*/`
        <div class="contact-placeholder">
            <img src="./assets/contacts/img/Vector 10.svg" />
        </div>
        <div class="contact-person" onclick="showContactDetails('${
          key.name
        }', '${key.email}', '${key.phone}', ${colorIndex}, '${id}')">
            <div class="contact-person-icon">
                <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
                <p>${getInitials(key.name)}</p>
            </div>
            <div class="contact-person-name">
                <h5>${key.name}</h5>
                <a>${key.email}</a>
            </div>
        </div>`;
}
let currentContact = {};

function getContactDeteails(name, email, phone, colorIndex, id, detailSection) {
  detailSection.innerHTML = /*html*/`
        <div class="contact-single-person-content-head">
            <div class="contact-person-icon-big">
                <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
                <h3>${getInitials(name)}</h3>
            </div>
            <div class="contact-single-person-content-head-name">
                <h3>${name}</h3>
                <div class="contact-single-person-content-head-edit-container">
                    <div class="contact-single-person-content-head-edit-box" onclick="openEditContact()">
                        <img class="regular-image" src="./assets/contacts/icons/pen_thin.svg" />
                        <p>Edit</p>
                    </div>
                    <div class="contact-single-person-content-head-trash-box" onclick="deleteContact()">
                        <img class="regular-image" src="./assets/contacts/icons/trash_thin.svg" />
                        <p>Delete</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="contact-single-person-content-info">
            <h4>Contact Information</h4>
            <h6>Email</h6>
            <a>${email}</a>
            <h6>Phone</h6>
            <span>${phone}</span>
        </div>`;
}

function getNewLayoutDetails(name, email, phone, colorIndex, detailSection) {
  detailSection.innerHTML = ``;
  detailSection.innerHTML = /*html*/ `
    <div class="contact-single-person-content-mobile-headline">
        <h5>Contact Information</h5>
        <a class="help-a-tag-back-button" onclick="detailsMobileBack()">
            <img src="./assets/general_elements/icons/arrow_left.svg">
        </a>
    </div>
    <div class="contact-single-person-content-head">
        <div class="contact-person-icon-big">
            <img src="./assets/general_elements/icons/color${colorIndex}.svg" />
            <h3>${getInitials(name)}</h3>
        </div>
        <div class="contact-single-person-content-head-name">
            <h4>${name}</h4>
        </div>
    </div>
    <div class="contact-single-person-content-info">
        <h6>Email</h6>
        <a>${email}</a>
        <h6>Phone</h6>
        <span>${phone}</span>
    </div>
    <div class="single-person-content-mobile-bottom" onclick="addDetailsMobileNavbar(), removeDetailsMobileNavbar(event)">
        <div class="white-point"></div>
        <div class="white-point"></div>
        <div class="white-point"></div>
    </div>
    <div class="single-person-content-mobile-navbar d-none" id="single-person-content-mobile-navbar" onclick="removeDetailsMobileNavbar(event)">
        <div class="single-person-content-mobile-navbar-content" onclick="toggleEditContact()">
            <img src="./assets/contacts/icons/pen_thin.svg" alt="Edit Icon">
            <p>Edit</p>
        </div>
        <div class="single-person-content-mobile-navbar-content">
            <img src="./assets/contacts/icons/trash_thin.svg" alt="Delete Icon">
            <p>Delete</p>
        </div>
    </div>
    `;
}
