document.getElementById("registrationForm")
.addEventListener("submit", function(event) {

    event.preventDefault();

    const data = {
        name: document.getElementById("name").value,
        phone: document.getElementById("phone").value,
        sublocation: document.getElementById("sublocation").value,
        age: document.getElementById("age").value,
        gender: document.getElementById("gender").value,
        idno: document.getElementById("idno").value,
        disability: document.getElementById("disability").value,
        primarySkill: document.getElementById("primarySkill").value,
        otherSkills: document.getElementById("otherSkills").value,
        education: document.getElementById("education").value
    };

    console.log("Registration Data:", data);

    alert("Registration submitted successfully!");
});