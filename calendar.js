document.addEventListener("DOMContentLoaded", function () {
    const calendarContainer = document.getElementById("calendar");
    const appointmentsList = document.getElementById("appointments-list");
    const prevMonthButton = document.getElementById("prev-month-btn");
    const nextMonthButton = document.getElementById("next-month-btn");
    const currentMonthYear = document.getElementById("current-month-year");

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    renderCalendar(currentMonth, currentYear);
    displayAppointments();

    prevMonthButton.addEventListener("click", function () {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    nextMonthButton.addEventListener("click", function () {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });

    function renderCalendar(month, year) {
        calendarContainer.innerHTML = "";
        currentMonthYear.textContent = months[month] + " " + year;

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();

        let date = 1;
        const table = document.createElement("table");
        const tbody = document.createElement("tbody");

        for (let i = 0; i < 6; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement("td");
                if (i === 0 && j < firstDayOfMonth.getDay()) {
                    // Empty cells before the first day of the month
                    cell.textContent = "";
                } else if (date > daysInMonth) {
                    // Empty cells after the last day of the month
                    cell.textContent = "";
                } else {
                    // Fill cells with dates
                    cell.textContent = date;
                    if (date === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                        cell.classList.add("today");
                    }
                    date++;
                }
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        calendarContainer.appendChild(table);
    }

    function displayAppointments() {
        // Clear existing appointments
        appointmentsList.innerHTML = '';

        // Simulated appointments data for today
        const appointments = [
            { time: "10:00 AM", patient: "John Doe", reason: "Checkup" },
            { time: "11:30 AM", patient: "Jane Smith", reason: "Follow-up" }
            

            // Add more appointments as needed
        ];

        // Create list items for each appointment and append to the list
        appointments.forEach(appointment => {
            const li = document.createElement("li");
            li.textContent = `${appointment.time} - ${appointment.patient} (${appointment.reason})`;
            appointmentsList.appendChild(li);
        });
    }
    function renderCalendar(month, year) {
        calendarContainer.innerHTML = "";
        currentMonthYear.textContent = months[month] + " " + year;
    
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
    
        let date = 1;
        const table = document.createElement("table");
        const tbody = document.createElement("tbody");
    
        for (let i = 0; i < 6; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement("td");
                if (i === 0 && j < firstDayOfMonth.getDay()) {
                    // Empty cells before the first day of the month
                    cell.textContent = "";
                } else if (date > daysInMonth) {
                    // Empty cells after the last day of the month
                    cell.textContent = "";
                } else {
                    // Fill cells with dates
                    cell.textContent = date;
                    if (date === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                        cell.classList.add("today");
                    }
                    if ([5, 15, 25].includes(date)) {
                        cell.classList.add("highlighted-date");
                    }
                    date++;
                }
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        calendarContainer.appendChild(table);
    }
    function renderCalendar(month, year) {
        calendarContainer.innerHTML = "";
        currentMonthYear.textContent = months[month] + " " + year;
    
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
    
        let date = 1;
        const table = document.createElement("table");
        const tbody = document.createElement("tbody");
    
        // Create header row for the days of the week
        const headerRow = document.createElement("tr");
        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        daysOfWeek.forEach(day => {
            const th = document.createElement("th");
            th.textContent = day;
            headerRow.appendChild(th);
        });
        tbody.appendChild(headerRow);
    
        for (let i = 0; i < 6; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement("td");
                if (i === 0 && j < firstDayOfMonth.getDay()) {
                    // Empty cells before the first day of the month
                    cell.textContent = "";
                } else if (date > daysInMonth) {
                    // Empty cells after the last day of the month
                    cell.textContent = "";
                } else {
                    // Fill cells with dates
                    cell.textContent = date;
                    if (date === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                        cell.classList.add("today");
                    }
                    if ([5, 15, 25].includes(date)) {
                        cell.classList.add("highlighted-date");
                    }
                    date++;
                }
                row.appendChild(cell);
            }
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        calendarContainer.appendChild(table);
    }
    
});
