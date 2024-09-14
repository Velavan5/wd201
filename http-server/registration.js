let Form = document.getElementById("user-form");

// fetches the records
const retrieveEntries = () => {
    let entries= localStorage.getItem("user-entries");
    if(entries)
    return (JSON.parse(entries));

    return [];  
};

// display the records
const DisplayEntries = () => {
let entries = retrieveEntries();
let tableContent = entries.map( (entry) => {
    const namecell = `<td >${entry.name}</td>`;
    const emailcell = `<td >${entry.email}</td>`;
    const dobcell = `<td >${entry.dob}</td>`;
    const passcell = `<td >${entry.password}</td>`;
    const acceptedTermscell = `<td >${entry.acceptedTerms}</td>`;

    // returns  row 
    return `<tr> ${namecell} ${emailcell} ${passcell} ${dobcell} ${acceptedTermscell} </tr>`;
}).join("\n");

const table = "<table><tr><th>Name</th><th>Email</th><th>Password</th><th>dob</th><th>accepted terms?</th></tr>"+tableContent+"</table>";
let details = document.getElementById("user-entries");
details.innerHTML = table;

};

// saves user details to local storage
let userEntries = retrieveEntries();//to get the records already in local storage 
const saveUserForm = (event)=>{
    event.preventDefault();
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let dob = document.getElementById("dob").value;
    const acceptedTerms = document.getElementById("checkbox").checked;

    const data = { name ,email, password , dob , acceptedTerms}; 

    userEntries.push(data);
// storing values or entries
    localStorage.setItem("user-entries",JSON.stringify(userEntries));
    DisplayEntries();
};

Form.addEventListener("submit",saveUserForm);
DisplayEntries();