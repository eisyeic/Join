function getContactPerson(key, renderContacts) {
    return `
        <div class="contact-abc-box">A</div>
        <div class="contact-placeholder">
            <img src="./assets/contacts/img/Vector 10.svg" />
        </div>
        <div class="contact-person">
            <div class="contact-person-icon">
                <img src="./assets/general_elements/icons/color1.svg" />
                <p>${getInitials(key.name)}</p>
            </div>
            <div class="contact-person-name">
                <h5>${key.name}</h5>
                <a class="" href="mailto:${key.email}">${key.email}</a>
            </div>
        </div>`;
}
