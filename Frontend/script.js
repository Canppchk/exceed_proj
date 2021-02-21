//if text messsage is empty, disable send and settime button
function checkEmptyMessage(){
    var value = document.getElementById('message').value;
    if (value.trim().length > 0) {
        document.getElementById('sent-message').disabled = false; 
        document.getElementById('set-time').disabled = false; 
    } 
    else { 
        document.getElementById('sent-message').disabled = true;
        document.getElementById('set-time').disabled = true; 
    }
}

var dayArray = [];
var formCounted = 1;
var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var days_full = {Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday"};

//clear data from dayArray and re-color day buttons.
function setTime() {
    var message = document.getElementById("message").value;
    if (message.trim() == "") {  // if no any message are in text box just popup error.
        window.alert("please type something!!");
        $('#popup').modal("hide");
        document.getElementById("message").value = '';
        return;
    }
    $('#popup').modal("show");  // show modal.
    for (var i=0; i < dayArray.length; i++) {
        document.getElementById(dayArray[i]).style.backgroundColor = "gainsboro";
    }
    initSetTimeForm();

    now = new Date(Date.now());  // time now
    document.getElementById("hours").value = now.getHours();  // auto fill hour to be current time.
    document.getElementById("mins").value = now.getMinutes() + 1;  // auto fill hour to be current time.

}

//clear and recreate time form
function initSetTimeForm() {
    var container = document.getElementById("form-group");
    document.getElementById("modal-title").innerHTML = document.getElementById("message").value;
    //clear until left only form starter template
    while (formCounted > 1) {
        container.removeChild(container.lastChild);
        formCounted--;
    }
}

//decrease number of time form in set time
function reduceSetTimeForm() {
    var container = document.querySelector('#form-group');
    if (formCounted > 1) {
        container.removeChild(container.lastElementChild);
        formCounted--;
    }
    else;
}

//increase number of time form in set time
function addSetTimeForm() {
    //given maximun form === 5
    if (formCounted < 5) {
        formCounted++;
        var form = document.querySelector('#form-group').lastElementChild;
        var clone = form.cloneNode(true);

        clone.id = 'form'+formCounted;
        form.after(clone);
    }
    else;
}

//add clicked day to day Array and re-color the clicked button.
function selectDay() {
    if (!dayArray.includes(this.value)) {
        dayArray.push(this.value);
        this.style.backgroundColor = "lightcoral";
    }
    else {
        dayArray.splice(dayArray.indexOf(this.value),1);
        this.style.backgroundColor = "gainsboro";
    }
    // console.log(dayArray);
}

//sent message to patient
function sentMessage() {
    message = document.getElementById("message").value;
    if (message.trim() == "") {
        window.alert("please type something!!");
        return;
    }
    document.getElementById("message").value = '';
    console.log(message);

    url = "http://158.108.182.3:3000/new_msg?user_id="+currentPatientID;  // change user id.

    fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            message: message,
            type: "live"
        })
    }).then((response) => console.log(response))
    .then((result) => console.log(result));
}

//save message day(s) and time(s) from form
function saveMessage() {
    message = document.getElementById("message").value;
    if (message.trim() == "") {
        $('#popup').modal("hide");
        window.alert("please type something!!");
        return;
    }
    console.log(dayArray);

    if (!checkValidTime()) {  // check time
        return;
    }

    if (dayArray.length == 0) {
        window.alert("please select day to send message!!");
        return;
    }
    hours = parseInt(document.getElementById("hours").value);
    mins = parseInt(document.getElementById("mins").value);

    url = "http://158.108.182.3:3000/create_schedule?user_id=" + currentPatientID;  // change user id.
    var day_schedule = [];
    for (i=0; i<dayArray.length; i++) {
        day_schedule.push(days_full[dayArray[i]]);
    }
    fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            message: message,
            type: "schedule",
            hour: hours,
            minute: mins,
            second: 0,
            day: day_schedule
        })
    }).then((response) => console.log(response))
    .then((result) => console.log(result));
    $('#popup').modal("hide");
}

// check if time in message box is valid (not in the pass)
function checkValidTime() {
    now = new Date(Date.now());  // time now
    hours = document.getElementById("hours").value;
    mins = document.getElementById("mins").value;
    set_time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins);
    if (dayArray.length > 1 || !dayArray.includes(days[now.getDay()])) {
        return true;
    }
    if (set_time.getTime() < now.getTime()) {
        document.getElementById("hours").value = now.getHours();
        document.getElementById("mins").value = now.getMinutes() + 1;
        window.alert("you cannot send message to the pass!!");
        return false;
    }
    return true;
}


function formatTime() {
    if (document.getElementById("hours").value > 23) {
        document.getElementById("hours").value = 23;
    }
    else if (document.getElementById("hours").value < 0) {
        document.getElementById("hours").value = 0;
    }
    if (document.getElementById("mins").value > 59) {
        document.getElementById("mins").value = 59;
    }
    else if (document.getElementById("mins").value < 0) {
        document.getElementById("mins").value = 0;
    }
}


function showSchedule() {
    const url = "http://158.108.182.3:3000/msg?user_id="+currentPatientID;

    var historyList = document.getElementById("schedule-container");
    historyList.innerHTML = "";
    var all_schedules = document.createElement("ul");

    fetch(url, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    }).then((response) => {
        return response.json();
    }).then((json) => {
        //if number of patient in the page and json file doesn't match
        // console.log(json.result)
        for (const message in json.result) {
            var data = json.result[message];
            if (data.type == "schedule") {
                var sch = document.createElement("div");
                sch.id = "schedule-list";

                const event = new Date(2000, 1, 1, data.hour, data.minute);
                var time = event.toLocaleTimeString('it-IT');
                // console.log(event.toLocaleTimeString('it-IT'));
                var days = "";
                for (i=0; i<data.day.length; i++) {
                    days += data.day[i].substring(0, 3) + " ";
                }
                sch.innerHTML = data.message + " - " + time + " - " + days;

                //append remove button
                var remove_btn = document.createElement("button");
                remove_btn.className = "btn btn-danger";
                remove_btn.id = "remove-btn";
                remove_btn.innerHTML = "remove";
                remove_btn.value = data.msg_id;
                remove_btn.addEventListener("click",removeSchedule);
                sch.appendChild(remove_btn);
                all_schedules.appendChild(sch);
            }
        }
    });
    historyList.appendChild(all_schedules)
    $('#schedule').modal("show");
}


function removeSchedule() {
    fetch("http://158.108.182.3:3000/delete_schedule?msg_id="+this.value, {
        method: "DELETE"
    });
    $('#schedule').modal("hide");
}

//show patient list when clicked side bar
function showPatientList() {
    var patientList = document.getElementById("patientlist-container");
    $('#patientlist-container').empty();
    fetch("http://158.108.182.3:3000/all_user")
        .then((response) => {
        return response.json();
    })
    .then((json) => {
        console.log(json);
        var danger = false;
        json["result"].forEach(patientdata => {
            var patient = document.createElement("button");
            patient.className = "patient";
            patient.id = "patient";
            patient.innerHTML = patientdata["name"];
            patient.addEventListener("click", ()=> {
                currentPatientID = patientdata["user_id"];
                $('#patientlist').modal("hide");
                updatePatientInfo();
            });
            if (patientdata['status']==="normal") {
                patient.style.backgroundColor = "green"
            }
            else if (patientdata['status']==="idle") {
                patient.style.backgroundColor = "orange"
            }
            else if (patientdata['status']==="danger") {
                patient.style.backgroundColor = "red"
            }
            patientList.appendChild(patient);
        });
    })
    .catch((error) => {
        console.error(error);
    });
    $('#patientlist').modal("show");
}

var currentPatientID = 1;

var danger = false;

function updatePatientInfo() {
    let patient_id = currentPatientID - 1;
    fetch("http://158.108.182.3:3000/all_user")
        .then((response) => {
        return response.json();
    })
    .then((json) => {
    patientdata = json["result"];
    var patient = document.querySelector('#patientboard');
    patient.querySelector('#name').innerHTML = patientdata[patient_id]["name"];
    patient.querySelector('#age').innerHTML = patientdata[patient_id]["age"];
    patient.querySelector('#address').innerHTML = patientdata[patient_id]["address"];

    // safe_btn.style.display = '';
    safe_btn.disabled = true;
    safe_btn.style.opacity = '0.3';
    let status = patientdata[patient_id]["status"];
    if (status==="normal") {
        patient.querySelector("#status-light").style.backgroundColor = "green";
    }
    else if (status==="idle") {
        patient.querySelector("#status-light").style.backgroundColor = "orange";
    }
    else if (status==="danger") {
        patient.querySelector("#status-light").style.backgroundColor = "red";
        safe_btn.disabled = false;
        safe_btn.style.opacity = '';
    }

    var checkdanger = false;
    json["result"].forEach(patientdata => {
        if (patientdata['status']==="danger") {
            checkdanger = true;
        }
    });
    danger = checkdanger;
    if (danger) { 
        document.getElementById("patienticon").innerHTML = "&#127384;"
    }
    else document.getElementById("patienticon").innerHTML = "&#128567;"
    })
    .catch((error) => {
        console.error(error);
    });
}

// =======================
//        new update
// =======================
const safe_btn = document.getElementById('set-safe');
function safe() {
    fetch(`http://158.108.182.3:3000/update_status?user_id=${currentPatientID}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            status: "normal"
        })
    }).then((response) => console.log(response))
    .then((result) => {
        console.log(result);
        safe_btn.disabled = false;
        safe_btn.style.opacity = '0.3';
    });
}

var temp_msg = localStorage.getItem('temp_msg');
function liveResoponse() {
    const url = "http://158.108.182.3:3000/response?user_id="+currentPatientID;
    fetch(url, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    }).then((response) => {
        return response.json();
    }).then(({message, response, sent}) => {
        if (!sent || response == null)
            return;
        const u_msg = message + response;
        if (temp_msg != u_msg) {
            alert(`Send: ${message}\nReply : ${response ? 'Yes.' : 'No.'}`)
            localStorage.setItem('temp_msg', u_msg);
            temp_msg = u_msg;
        }
    });
}

//EventListeners

document.getElementById("message").addEventListener("keyup", checkEmptyMessage);
document.getElementById("set-time").addEventListener("click", setTime);
document.getElementById("set-time").addEventListener("click", initSetTimeForm);
// document.getElementById("reduce-form").addEventListener("click", reduceSetTimeForm);
// document.getElementById("add-form").addEventListener("click", addSetTimeForm);
Array.from(document.getElementsByClassName('day')).forEach(function(element){
  element.addEventListener("click", selectDay);
});
document.getElementById("sent-message").addEventListener("click", sentMessage);
document.getElementById("save-time").addEventListener("click", saveMessage);
document.getElementById("schedule-tab").addEventListener("click", showSchedule);
document.getElementById("patientlist-tab").addEventListener("click", showPatientList);

document.getElementById("hours").addEventListener("change", formatTime);
document.getElementById("mins").addEventListener("change", formatTime);

setInterval(()=> updatePatientInfo(),1000);
setInterval(()=> liveResoponse(),1000);
// setInterval(()=> updatePatientStatus(),1000);
